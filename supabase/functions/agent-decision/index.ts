import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { agentId, marketData, newsData } = await req.json();

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('trading_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    // Get user's Anthropic API key
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('service', 'anthropic')
      .single();

    if (keyError || !apiKeyData) {
      throw new Error('Anthropic API key not configured. Please add your API key in Settings.');
    }

    // Decrypt the API key
    const encryptionKey = Deno.env.get('API_KEY_ENCRYPTION_SECRET');
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const { data: decryptedKey, error: decryptError } = await supabase
      .rpc('decrypt_api_key', {
        encrypted_key: apiKeyData.encrypted_key,
        encryption_key: encryptionKey
      });

    if (decryptError || !decryptedKey) {
      console.error('Decryption error:', decryptError);
      throw new Error('Failed to decrypt API key');
    }

    // Get recent trades for context
    const { data: recentTrades } = await supabase
      .from('trades')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build context for Claude
    const systemPrompt = `You are an autonomous trading AI agent named "${agent.name}".
Your trading strategy is: ${agent.strategy}
Market type: ${agent.market_type}
Current balance: $${agent.balance}
Risk tolerance: ${agent.risk_tolerance}/10
Total trades made: ${agent.total_trades}
Win rate: ${agent.total_trades > 0 ? ((agent.winning_trades / agent.total_trades) * 100).toFixed(2) : 0}%

Your job is to analyze market data and news to make informed trading decisions.
You must respond with a JSON object containing:
{
  "action": "buy" | "sell" | "hold",
  "symbol": "stock symbol if action is buy/sell",
  "quantity": number of shares (must be within risk tolerance),
  "confidence": 0-100,
  "reasoning": "detailed explanation of decision"
}

Consider:
- Current portfolio balance and risk limits
- Market trends and technical indicators
- News sentiment and impact
- Your historical performance
- Risk-reward ratio`;

    const userPrompt = `Market Data:
${JSON.stringify(marketData, null, 2)}

Recent News:
${JSON.stringify(newsData, null, 2)}

Recent Trades:
${JSON.stringify(recentTrades?.slice(0, 5), null, 2)}

Based on this information, what trading action should I take?`;

    console.log('Calling Claude API for trading decision...');

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': decryptedKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    console.log('Claude response:', claudeData);

    const content = claudeData.content[0].text;
    
    // Parse JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse Claude response');
    }

    const decision = JSON.parse(jsonMatch[0]);
    
    // Validate decision
    if (!['buy', 'sell', 'hold'].includes(decision.action)) {
      throw new Error('Invalid action from Claude');
    }

    // Risk check
    if (decision.action === 'buy' && decision.quantity) {
      const maxRiskAmount = (agent.balance * agent.risk_tolerance) / 100;
      // Will be validated in execute-trade with actual price
      console.log(`Risk check: Max risk amount $${maxRiskAmount}`);
    }

    console.log('Trading decision:', decision);

    return new Response(
      JSON.stringify({ 
        success: true,
        decision,
        agent: {
          name: agent.name,
          balance: agent.balance,
          strategy: agent.strategy,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in agent decision:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
