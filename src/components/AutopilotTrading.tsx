import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTradingStore } from '@/stores/tradingStore';
import { fetchRealMarketData, getSymbolsForMarketType } from '@/lib/marketData';

interface AutopilotTradingProps {
  agentId: string;
  agentName: string;
  isActive: boolean;
  tradingInterval?: number; // milliseconds between trades (default: 30 seconds)
}

export const AutopilotTrading = ({
  agentId,
  agentName,
  isActive,
  tradingInterval = 30000 // 30 seconds default
}: AutopilotTradingProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);
  const { fetchAgents, fetchTrades, fetchActions } = useTradingStore();

  // Fetch REAL market data from Alpaca
  const fetchMarketData = async (agentMarketType: string) => {
    try {
      // Get appropriate symbols for agent's market type
      const symbols = getSymbolsForMarketType(agentMarketType);

      console.log(`📊 Fetching real market data for ${symbols.length} symbols:`, symbols);

      // Fetch real market data
      const marketData = await fetchRealMarketData(symbols);

      console.log('✅ Market data fetched:', Object.keys(marketData).length, 'symbols');

      return marketData;
    } catch (error) {
      console.error('❌ Error fetching market data:', error);
      return null;
    }
  };

  // Fetch news data
  const fetchNewsData = async () => {
    try {
      const { data: news } = await supabase
        .from('market_news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(10);

      return news || [];
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  };

  // Execute one trading cycle
  const executeTradingCycle = async () => {
    if (isRunningRef.current) {
      console.log(`Agent ${agentName} is already running a cycle, skipping...`);
      return;
    }

    try {
      isRunningRef.current = true;
      console.log(`🤖 ${agentName}: Starting trading cycle...`);

      // Get agent details to know market type
      const { data: agent } = await supabase
        .from('trading_agents')
        .select('market_type')
        .eq('id', agentId)
        .single();

      if (!agent) {
        console.error(`Agent ${agentName}: Not found`);
        return;
      }

      // Fetch REAL market data and news
      const [marketData, newsData] = await Promise.all([
        fetchMarketData(agent.market_type),
        fetchNewsData()
      ]);

      if (!marketData || Object.keys(marketData).length === 0) {
        console.log(`Agent ${agentName}: No market data available`);
        return;
      }

      // Get agent decision from Claude
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log(`🧠 ${agentName}: Asking Claude for trading decision...`);

      const response = await supabase.functions.invoke('agent-decision', {
        body: {
          agentId,
          marketData,
          newsData
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get decision');
      }

      const { decision } = response.data;

      console.log(`💡 ${agentName} Decision:`, decision.action.toUpperCase());
      console.log(`   Reasoning: ${decision.reasoning}`);
      console.log(`   Confidence: ${decision.confidence}%`);

      // Log the decision to database
      await supabase.from('agent_actions').insert({
        agent_id: agentId,
        user_id: session.user.id,
        action_type: 'decision',
        action_data: decision,
        reasoning: decision.reasoning,
        confidence_score: decision.confidence,
        market_data: marketData
      });

      // Execute trade if decision is buy or sell
      if (decision.action !== 'hold' && decision.confidence >= 70) {
        console.log(`📈 ${agentName}: Executing ${decision.action.toUpperCase()} trade for ${decision.symbol}`);

        const { data: trade, error: tradeError } = await supabase
          .from('trades')
          .insert({
            agent_id: agentId,
            user_id: session.user.id,
            symbol: decision.symbol,
            trade_type: decision.action,
            quantity: decision.quantity,
            price: marketData[decision.symbol]?.price || 0,
            total_amount: decision.quantity * (marketData[decision.symbol]?.price || 0),
            status: 'pending',
            reasoning: decision.reasoning
          })
          .select()
          .single();

        if (tradeError) {
          console.error('Error creating trade:', tradeError);
          throw tradeError;
        }

        // Execute the trade
        const executeResponse = await supabase.functions.invoke('execute-trade', {
          body: {
            agentId: agentId,
            symbol: decision.symbol,
            side: decision.action,
            quantity: decision.quantity,
            orderType: 'market',
            useLive: false, // Always use paper trading for safety
            reasoning: decision.reasoning
          }
        });

        if (executeResponse.error) {
          console.error('Trade execution failed:', executeResponse.error);
          toast.error(`${agentName}: Trade failed - ${executeResponse.error.message}`);
        } else {
          toast.success(`${agentName}: ${decision.action.toUpperCase()} ${decision.quantity} ${decision.symbol} @ $${marketData[decision.symbol]?.price.toFixed(2)}`);
          console.log(`✅ ${agentName}: Trade executed successfully!`);
        }
      } else {
        console.log(`⏸️ ${agentName}: HOLD decision (confidence: ${decision.confidence}%)`);
      }

      // Refresh data
      fetchAgents();
      fetchTrades();
      fetchActions();

    } catch (error) {
      console.error(`❌ ${agentName} error:`, error);
      toast.error(`${agentName}: ${error instanceof Error ? error.message : 'Trading cycle failed'}`);

      // Increment error count
      try {
        const { data: agent } = await supabase
          .from('trading_agents')
          .select('error_count')
          .eq('id', agentId)
          .single();

        if (agent) {
          const newErrorCount = (agent.error_count || 0) + 1;

          await supabase
            .from('trading_agents')
            .update({ error_count: newErrorCount })
            .eq('id', agentId);

          // Auto-pause after 5 errors
          if (newErrorCount >= 5) {
            await supabase
              .from('trading_agents')
              .update({ status: 'paused' })
              .eq('id', agentId);

            toast.error(`${agentName} has been paused due to multiple errors`);
            console.log(`🛑 ${agentName}: Auto-paused after ${newErrorCount} errors`);
          }
        }
      } catch (e) {
        console.error('Error updating error count:', e);
      }
    } finally {
      isRunningRef.current = false;
    }
  };

  useEffect(() => {
    if (isActive) {
      console.log(`🚀 ${agentName}: AUTOPILOT STARTED - Trading every ${tradingInterval/1000} seconds`);
      toast.success(`${agentName} autopilot started!`, {
        description: `Trading automatically every ${tradingInterval/1000} seconds`
      });

      // Execute first cycle immediately
      executeTradingCycle();

      // Then execute on interval
      intervalRef.current = setInterval(() => {
        executeTradingCycle();
      }, tradingInterval);
    } else {
      // Stop autopilot
      if (intervalRef.current) {
        console.log(`🛑 ${agentName}: AUTOPILOT STOPPED`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, agentId, agentName, tradingInterval]);

  // This component doesn't render anything
  return null;
};
