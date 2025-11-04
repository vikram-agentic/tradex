import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TradingDecision {
  action: 'buy' | 'sell' | 'hold';
  symbol?: string;
  quantity?: number;
  confidence: number;
  reasoning: string;
}

export const useTrading = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getAgentDecision = async (
    agentId: string,
    marketData: any,
    newsData: any
  ): Promise<TradingDecision | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-decision', {
        body: { agentId, marketData, newsData },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to get agent decision');
      }

      return data.decision;
    } catch (error: any) {
      console.error('Error getting agent decision:', error);
      toast({
        title: 'Decision Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const executeTrade = async (
    agentId: string,
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    useLive: boolean,
    reasoning?: string
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('execute-trade', {
        body: {
          agentId,
          symbol,
          side,
          quantity,
          orderType: 'market',
          useLive,
          reasoning,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to execute trade');
      }

      toast({
        title: 'Trade Executed',
        description: `${side.toUpperCase()} ${quantity} ${symbol} @ $${data.trade.price.toFixed(2)}`,
      });

      return data;
    } catch (error: any) {
      console.error('Error executing trade:', error);
      toast({
        title: 'Trade Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketNews = async (symbols?: string[], keywords?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-market-news', {
        body: { symbols, keywords },
      });

      if (error) throw error;

      return data?.articles || [];
    } catch (error: any) {
      console.error('Error fetching news:', error);
      toast({
        title: 'News Fetch Failed',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    }
  };

  const runAutonomousAgent = async (
    agentId: string,
    useLive: boolean = false
  ) => {
    setLoading(true);
    try {
      // Fetch latest news
      const news = await fetchMarketNews(['AAPL', 'GOOGL', 'MSFT', 'TSLA']);

      // Mock market data (in production, fetch from Alpaca)
      const marketData = {
        timestamp: new Date().toISOString(),
        indices: {
          SPY: { price: 450.23, change: 0.45 },
          QQQ: { price: 380.12, change: 0.32 },
        },
      };

      // Get AI decision
      const decision = await getAgentDecision(agentId, marketData, news);

      if (!decision) {
        throw new Error('Failed to get trading decision');
      }

      // Execute trade if decision is buy/sell
      if (decision.action !== 'hold' && decision.symbol && decision.quantity) {
        await executeTrade(
          agentId,
          decision.symbol,
          decision.action,
          decision.quantity,
          useLive,
          decision.reasoning
        );
      } else {
        toast({
          title: 'Agent Decision: HOLD',
          description: decision.reasoning,
        });
      }

      return decision;
    } catch (error: any) {
      console.error('Error running autonomous agent:', error);
      toast({
        title: 'Agent Error',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getAgentDecision,
    executeTrade,
    fetchMarketNews,
    runAutonomousAgent,
  };
};
