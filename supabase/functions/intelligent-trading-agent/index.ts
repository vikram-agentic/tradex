import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Strategy-specific system prompts
const STRATEGY_PROMPTS = {
  momentum: `You are an expert momentum trading AI agent. Your strategy is to identify and ride strong trends.

RULES:
1. Buy when price shows strong upward momentum with increasing volume
2. Sell when momentum weakens or reverses
3. Use technical indicators: RSI (>70 overbought, <30 oversold), MACD crossovers, Moving Averages
4. Look for breakouts above resistance levels
5. Set tight stop-losses to protect capital
6. Maximum hold period: 3 days
7. Never risk more than the configured position size limit

DECISION PROCESS:
1. Analyze current market data and price trends
2. Check technical indicators
3. Review recent news sentiment
4. Calculate risk/reward ratio
5. Make BUY, SELL, or HOLD decision with confidence score
6. Provide clear reasoning for your decision`,

  mean_reversion: `You are an expert mean reversion trading AI agent. Your strategy is to profit from price returning to average.

RULES:
1. Buy oversold assets (RSI < 30, price 2+ std dev below mean)
2. Sell overbought assets (RSI > 70, price 2+ std dev above mean)
3. Use Bollinger Bands, RSI, and standard deviation
4. Look for support and resistance levels
5. Be patient - wait for extreme deviations
6. Maximum hold period: 7 days
7. Never risk more than the configured position size limit

DECISION PROCESS:
1. Calculate moving averages and standard deviations
2. Identify overbought/oversold conditions
3. Check if price has deviated significantly from mean
4. Review volume and market conditions
5. Make BUY, SELL, or HOLD decision with confidence score
6. Provide clear reasoning based on statistical analysis`,

  sentiment: `You are an expert sentiment-based trading AI agent. Your strategy is to trade based on news and market emotions.

RULES:
1. Analyze news sentiment (positive = buy signal, negative = sell signal)
2. React quickly to breaking news and events
3. Monitor social media trends and discussions
4. Consider earnings reports, product launches, regulatory news
5. Fast entry and exit - capture emotional moves
6. Maximum hold period: 2 days
7. Never risk more than the configured position size limit

DECISION PROCESS:
1. Review recent news articles and headlines
2. Analyze sentiment (positive, negative, neutral)
3. Assess impact on stock/crypto price
4. Check if market has already priced in the news
5. Make BUY, SELL, or HOLD decision with confidence score
6. Provide reasoning based on sentiment analysis`,

  scalping: `You are an expert scalping AI agent. Your strategy is high-frequency trading for small profits.

RULES:
1. Make numerous quick trades capturing small price movements
2. Use tight stop-losses (0.5-1% max loss per trade)
3. Take profits quickly (0.5-2% gains)
4. Focus on high liquidity assets
5. Monitor price action, order flow, and volume
6. Maximum hold period: 1 hour
7. Never risk more than the configured position size limit

DECISION PROCESS:
1. Analyze real-time price action and volume
2. Identify short-term support/resistance
3. Look for quick profit opportunities
4. Calculate very tight risk/reward
5. Make BUY, SELL, or HOLD decision with confidence score
6. Provide reasoning for quick trades`,

  swing: `You are an expert swing trading AI agent. Your strategy is to hold positions for days to weeks.

RULES:
1. Identify chart patterns (head and shoulders, triangles, flags)
2. Use support/resistance levels and Fibonacci retracements
3. Hold positions through minor fluctuations
4. Focus on larger price swings
5. Less frequent trading, more analysis
6. Maximum hold period: 14 days
7. Never risk more than the configured position size limit

DECISION PROCESS:
1. Analyze daily/weekly charts for patterns
2. Identify support and resistance zones
3. Check trend direction and strength
4. Review fundamental factors
5. Make BUY, SELL, or HOLD decision with confidence score
6. Provide reasoning based on technical patterns`,

  arbitrage: `You are an expert arbitrage trading AI agent. Your strategy is to exploit price differences.

RULES:
1. Find price discrepancies across exchanges/markets
2. Execute simultaneous buy and sell for risk-free profit
3. Act extremely fast - arbitrage opportunities close quickly
4. Consider transaction fees in profit calculation
5. Focus on highly liquid assets
6. Maximum hold period: Minutes
7. Never risk more than the configured position size limit

DECISION PROCESS:
1. Monitor prices across multiple exchanges
2. Calculate price differences minus fees
3. Identify profitable arbitrage opportunities
4. Execute paired trades quickly
5. Make BUY, SELL, or HOLD decision with confidence score
6. Provide reasoning for arbitrage opportunity`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { agentId, marketData, newsData } = await req.json()

    // Fetch agent details
    const { data: agent, error: agentError } = await supabaseClient
      .from('trading_agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      throw new Error('Agent not found')
    }

    // Fetch agent's current positions
    const { data: positions } = await supabaseClient
      .from('agent_positions')
      .select('*')
      .eq('agent_id', agentId)

    // Fetch recent trades
    const { data: recentTrades } = await supabaseClient
      .from('trades')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get strategy prompt
    const strategyPrompt = STRATEGY_PROMPTS[agent.strategy as keyof typeof STRATEGY_PROMPTS] || STRATEGY_PROMPTS.momentum

    // Build context for Claude
    const context = `
AGENT STATUS:
- Name: ${agent.name}
- Strategy: ${agent.strategy}
- Current Balance: $${agent.balance}
- Risk Tolerance: ${agent.risk_tolerance}/10
- Max Position Size: ${(agent.max_position_size * 100).toFixed(0)}%
- Total Trades: ${agent.total_trades}
- Winning Trades: ${agent.winning_trades}
- Total Profit: $${agent.total_profit}

CURRENT POSITIONS:
${positions && positions.length > 0
  ? positions.map(p => `- ${p.symbol}: ${p.quantity} shares @ $${p.average_price} (Current: $${p.current_price || 'N/A'}, P&L: $${p.unrealized_pnl || 'N/A'})`).join('\n')
  : '- No open positions'}

RECENT TRADES:
${recentTrades && recentTrades.length > 0
  ? recentTrades.map(t => `- ${t.trade_type.toUpperCase()} ${t.symbol} ${t.quantity} @ $${t.price} - ${t.status} - ${t.reasoning || 'No reasoning'}`).join('\n')
  : '- No recent trades'}

MARKET DATA:
${JSON.stringify(marketData, null, 2)}

NEWS & SENTIMENT:
${JSON.stringify(newsData, null, 2)}

Based on your strategy and the above information, make a trading decision. Respond in JSON format:
{
  "decision": "BUY" | "SELL" | "HOLD",
  "symbol": "AAPL" (or null for HOLD),
  "quantity": 10 (or null for HOLD),
  "reasoning": "Clear explanation of your decision",
  "confidence": 85 (0-100),
  "risk_assessment": "Low" | "Medium" | "High"
}

IMPORTANT:
- Only trade if confidence > 70%
- Respect the max position size limit
- Never exceed available balance
- Consider transaction fees
- Always provide clear reasoning
`;

    // Call Claude API
    const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured')
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: strategyPrompt,
        messages: [
          {
            role: 'user',
            content: context
          }
        ]
      })
    })

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.statusText}`)
    }

    const claudeData = await claudeResponse.json()
    const responseText = claudeData.content[0].text

    // Parse Claude's decision
    let decision
    try {
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0])
      } else {
        decision = JSON.parse(responseText)
      }
    } catch (e) {
      console.error('Failed to parse Claude response:', responseText)
      throw new Error('Failed to parse trading decision')
    }

    // Log the agent action
    await supabaseClient
      .from('agent_actions')
      .insert({
        agent_id: agentId,
        user_id: agent.user_id,
        action_type: 'decision',
        action_data: decision,
        reasoning: decision.reasoning,
        confidence_score: decision.confidence,
        market_data: marketData
      })

    // Execute trade if decision is BUY or SELL with sufficient confidence
    if ((decision.decision === 'BUY' || decision.decision === 'SELL') && decision.confidence >= 70) {
      // Calculate position size based on risk tolerance and max position size
      const maxPositionValue = agent.balance * agent.max_position_size
      const estimatedPrice = marketData[decision.symbol]?.price || 0

      if (estimatedPrice === 0) {
        throw new Error(`No price data available for ${decision.symbol}`)
      }

      let quantity = decision.quantity || Math.floor(maxPositionValue / estimatedPrice)

      // Validate trade
      if (decision.decision === 'BUY') {
        const totalCost = quantity * estimatedPrice
        if (totalCost > agent.balance) {
          // Adjust quantity to match available balance
          quantity = Math.floor(agent.balance / estimatedPrice)
        }

        if (quantity === 0) {
          throw new Error('Insufficient balance for trade')
        }
      }

      // Create trade record
      const { data: trade, error: tradeError } = await supabaseClient
        .from('trades')
        .insert({
          agent_id: agentId,
          user_id: agent.user_id,
          symbol: decision.symbol,
          trade_type: decision.decision.toLowerCase(),
          quantity: quantity,
          price: estimatedPrice,
          total_amount: quantity * estimatedPrice,
          status: 'pending',
          reasoning: decision.reasoning
        })
        .select()
        .single()

      if (tradeError) {
        throw new Error(`Failed to create trade: ${tradeError.message}`)
      }

      // Execute trade via existing execute-trade function
      const executeResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/execute-trade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            tradeId: trade.id,
            userId: agent.user_id,
            isPaperTrading: agent.trading_mode === 'paper'
          })
        }
      )

      if (!executeResponse.ok) {
        console.error('Trade execution failed:', await executeResponse.text())
      }

      return new Response(
        JSON.stringify({
          success: true,
          decision: decision.decision,
          trade: trade,
          reasoning: decision.reasoning,
          confidence: decision.confidence
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // HOLD decision
    return new Response(
      JSON.stringify({
        success: true,
        decision: 'HOLD',
        reasoning: decision.reasoning,
        confidence: decision.confidence
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in intelligent-trading-agent:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
