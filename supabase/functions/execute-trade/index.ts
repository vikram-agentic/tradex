import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlpacaOrder {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  time_in_force: 'day' | 'gtc';
  limit_price?: number;
}

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

    const { agentId, symbol, side, quantity, orderType, useLive, reasoning } = await req.json();

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

    // Get user's Alpaca API keys
    const keyService = useLive ? 'alpaca_live_key' : 'alpaca_paper_key';
    const secretService = useLive ? 'alpaca_live_secret' : 'alpaca_paper_secret';

    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('service, encrypted_key')
      .eq('user_id', user.id)
      .in('service', [keyService, secretService]);

    if (keysError || !apiKeys || apiKeys.length < 2) {
      throw new Error('Alpaca API keys not configured');
    }

    const encryptedKey = apiKeys.find(k => k.service === keyService)?.encrypted_key;
    const encryptedSecret = apiKeys.find(k => k.service === secretService)?.encrypted_key;

    if (!encryptedKey || !encryptedSecret) {
      throw new Error('Missing Alpaca credentials');
    }

    // Decrypt the API keys
    const encryptionKey = Deno.env.get('API_KEY_ENCRYPTION_SECRET');
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const { data: alpacaKey, error: keyDecryptError } = await supabase
      .rpc('decrypt_api_key', {
        encrypted_key: encryptedKey,
        encryption_key: encryptionKey
      });

    const { data: alpacaSecret, error: secretDecryptError } = await supabase
      .rpc('decrypt_api_key', {
        encrypted_key: encryptedSecret,
        encryption_key: encryptionKey
      });

    if (keyDecryptError || secretDecryptError || !alpacaKey || !alpacaSecret) {
      console.error('Decryption error:', keyDecryptError || secretDecryptError);
      throw new Error('Failed to decrypt Alpaca credentials');
    }

    // Get current price from Alpaca
    const alpacaBaseUrl = useLive 
      ? 'https://api.alpaca.markets'
      : 'https://paper-api.alpaca.markets';

    const priceResponse = await fetch(
      `${alpacaBaseUrl}/v2/stocks/${symbol}/quotes/latest`,
      {
        headers: {
          'APCA-API-KEY-ID': alpacaKey,
          'APCA-API-SECRET-KEY': alpacaSecret,
        },
      }
    );

    if (!priceResponse.ok) {
      throw new Error('Failed to fetch stock price');
    }

    const priceData = await priceResponse.json();
    const currentPrice = side === 'buy' ? priceData.quote.ap : priceData.quote.bp;

    // Calculate total amount
    const totalAmount = currentPrice * quantity;

    // Check if agent has sufficient balance
    if (side === 'buy' && agent.balance < totalAmount) {
      throw new Error('Insufficient balance');
    }

    // Execute trade on Alpaca
    const order: AlpacaOrder = {
      symbol,
      qty: quantity,
      side,
      type: orderType || 'market',
      time_in_force: 'day',
    };

    console.log('Executing trade:', order);

    const orderResponse = await fetch(
      `${alpacaBaseUrl}/v2/orders`,
      {
        method: 'POST',
        headers: {
          'APCA-API-KEY-ID': alpacaKey,
          'APCA-API-SECRET-KEY': alpacaSecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      }
    );

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(`Alpaca order failed: ${JSON.stringify(errorData)}`);
    }

    const orderResult = await orderResponse.json();
    console.log('Order executed:', orderResult);

    // Update agent balance
    const newBalance = side === 'buy' 
      ? agent.balance - totalAmount 
      : agent.balance + totalAmount;

    await supabase
      .from('trading_agents')
      .update({ 
        balance: newBalance,
        total_trades: agent.total_trades + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    // Record trade in database
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        symbol,
        trade_type: side,
        quantity,
        price: currentPrice,
        total_amount: totalAmount,
        status: 'executed',
        executed_at: new Date().toISOString(),
        reasoning: reasoning || 'Manual trade execution',
      })
      .select()
      .single();

    if (tradeError) {
      console.error('Failed to record trade:', tradeError);
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        trade_id: trade?.id,
        type: 'trade_executed',
        title: `${side.toUpperCase()} Order Executed`,
        message: `${side.toUpperCase()} ${quantity} ${symbol} @ $${currentPrice.toFixed(2)}`,
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        trade,
        order: orderResult,
        newBalance 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error executing trade:', error);
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
