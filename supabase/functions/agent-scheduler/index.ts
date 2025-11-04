import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to fetch market data
async function fetchMarketData(symbols: string[], alpacaKey: string, alpacaSecret: string) {
  const marketData: Record<string, any> = {}

  for (const symbol of symbols) {
    try {
      // Fetch latest quote from Alpaca
      const response = await fetch(
        `https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`,
        {
          headers: {
            'APCA-API-KEY-ID': alpacaKey,
            'APCA-API-SECRET-KEY': alpacaSecret
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        marketData[symbol] = {
          price: data.quote.ap, // Ask price
          bid: data.quote.bp,
          ask: data.quote.ap,
          volume: data.quote.as,
          timestamp: data.quote.t
        }
      }
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error)
    }
  }

  return marketData
}

// Function to fetch news and sentiment
async function fetchNewsData(symbols: string[], supabaseClient: any) {
  const { data: news } = await supabaseClient
    .from('market_news')
    .select('*')
    .contains('symbols', symbols)
    .order('published_at', { ascending: false })
    .limit(10)

  return news || []
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch all active agents
    const { data: activeAgents, error: agentsError } = await supabaseClient
      .from('trading_agents')
      .select('*')
      .eq('status', 'active')

    if (agentsError) {
      throw new Error(`Error fetching agents: ${agentsError.message}`)
    }

    if (!activeAgents || activeAgents.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active agents to process', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${activeAgents.length} active agents`)

    const results = []

    for (const agent of activeAgents) {
      try {
        // Check if agent has API keys configured
        const { data: apiKeys } = await supabaseClient
          .from('api_keys')
          .select('service')
          .eq('user_id', agent.user_id)

        const hasAlpacaKeys = apiKeys?.some(k =>
          k.service === 'alpaca_paper_key' || k.service === 'alpaca_live_key'
        )

        if (!hasAlpacaKeys) {
          console.log(`Skipping agent ${agent.id}: No Alpaca API keys configured`)
          continue
        }

        // Determine which symbols to analyze based on market type
        let symbols = []
        if (agent.market_type === 'stocks' || agent.market_type === 'both') {
          symbols.push('AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA')
        }
        if (agent.market_type === 'crypto' || agent.market_type === 'both') {
          symbols.push('BTCUSD', 'ETHUSD')
        }

        // For demo purposes, use default Alpaca paper trading keys
        // In production, fetch user's encrypted keys
        const alpacaKey = Deno.env.get('ALPACA_API_KEY') || ''
        const alpacaSecret = Deno.env.get('ALPACA_API_SECRET') || ''

        // Fetch market data
        const marketData = await fetchMarketData(symbols, alpacaKey, alpacaSecret)

        // Fetch news data
        const newsData = await fetchNewsData(symbols, supabaseClient)

        // Call intelligent trading agent
        const agentResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/intelligent-trading-agent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              agentId: agent.id,
              marketData,
              newsData
            })
          }
        )

        if (agentResponse.ok) {
          const result = await agentResponse.json()
          results.push({
            agentId: agent.id,
            agentName: agent.name,
            success: true,
            decision: result.decision,
            reasoning: result.reasoning
          })

          console.log(`Agent ${agent.name} decision: ${result.decision}`)
        } else {
          const errorText = await agentResponse.text()
          console.error(`Agent ${agent.name} error:`, errorText)

          // Increment error count
          await supabaseClient
            .from('trading_agents')
            .update({
              error_count: (agent.error_count || 0) + 1
            })
            .eq('id', agent.id)

          // Auto-pause agent after 5 consecutive errors
          if ((agent.error_count || 0) >= 4) {
            await supabaseClient
              .from('trading_agents')
              .update({ status: 'paused' })
              .eq('id', agent.id)

            // Create notification
            await supabaseClient
              .from('notifications')
              .insert({
                user_id: agent.user_id,
                agent_id: agent.id,
                type: 'agent_status',
                title: 'Agent Paused Due to Errors',
                message: `Agent "${agent.name}" has been automatically paused after multiple consecutive errors.`
              })
          }

          results.push({
            agentId: agent.id,
            agentName: agent.name,
            success: false,
            error: errorText
          })
        }

        // Small delay between agents to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`Error processing agent ${agent.id}:`, error)
        results.push({
          agentId: agent.id,
          agentName: agent.name,
          success: false,
          error: error.message
        })
      }
    }

    // Update leaderboard after all agents have been processed
    try {
      // This would be done automatically by the database view, but we can trigger a refresh
      await supabaseClient.rpc('refresh_leaderboard_cache')
    } catch (e) {
      // Ignore if function doesn't exist
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${activeAgents.length} agents`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in agent-scheduler:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
