import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface TradingAgent {
  id: string;
  user_id: string;
  name: string;
  strategy: string;
  market_type: string;
  balance: number;
  initial_balance: number;
  risk_tolerance: number;
  status: 'active' | 'paused' | 'stopped';
  total_trades: number;
  winning_trades: number;
  total_profit: number;
  strategy_config: Record<string, any>;
  last_action_at: string | null;
  error_count: number;
  max_position_size: number;
  trading_mode: 'paper' | 'live';
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  agent_id: string;
  user_id: string;
  symbol: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reasoning: string | null;
  executed_at: string | null;
  created_at: string;
  agent_name?: string;
  agent_strategy?: string;
}

export interface AgentAction {
  id: string;
  agent_id: string;
  user_id: string;
  action_type: 'decision' | 'trade' | 'analysis' | 'error' | 'status_change';
  action_data: Record<string, any>;
  reasoning: string | null;
  confidence_score: number | null;
  market_data: Record<string, any> | null;
  created_at: string;
  agent_name?: string;
}

export interface AgentPosition {
  id: string;
  agent_id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number | null;
  total_value: number | null;
  unrealized_pnl: number | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  agent_id: string | null;
  trade_id: string | null;
  type: 'trade_executed' | 'agent_status' | 'profit_alert' | 'risk_warning' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  name: string;
  strategy: string;
  balance: number;
  initial_balance: number;
  total_profit: number;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  roi: number;
  rank: number;
  status: string;
  created_at: string;
}

interface TradingStore {
  // State
  agents: TradingAgent[];
  trades: Trade[];
  actions: AgentAction[];
  positions: AgentPosition[];
  notifications: Notification[];
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  realtimeConnected: boolean;

  // Actions
  fetchAgents: () => Promise<void>;
  fetchTrades: (limit?: number) => Promise<void>;
  fetchActions: (limit?: number) => Promise<void>;
  fetchPositions: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;

  startAgent: (agentId: string) => Promise<void>;
  pauseAgent: (agentId: string) => Promise<void>;
  stopAgent: (agentId: string) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;

  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  subscribeToRealtime: (userId: string) => void;
  unsubscribeFromRealtime: () => void;
}

export const useTradingStore = create<TradingStore>((set, get) => ({
  // Initial State
  agents: [],
  trades: [],
  actions: [],
  positions: [],
  notifications: [],
  leaderboard: [],
  loading: false,
  realtimeConnected: false,

  // Fetch Agents
  fetchAgents: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('trading_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ agents: data || [] });
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      set({ loading: false });
    }
  },

  // Fetch Trades
  fetchTrades: async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          trading_agents (
            name,
            strategy
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const tradesWithAgentInfo = (data || []).map((trade: any) => ({
        ...trade,
        agent_name: trade.trading_agents?.name,
        agent_strategy: trade.trading_agents?.strategy
      }));

      set({ trades: tradesWithAgentInfo });
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  },

  // Fetch Actions
  fetchActions: async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('agent_actions')
        .select(`
          *,
          trading_agents (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const actionsWithAgentInfo = (data || []).map((action: any) => ({
        ...action,
        agent_name: action.trading_agents?.name
      }));

      set({ actions: actionsWithAgentInfo });
    } catch (error) {
      console.error('Error fetching actions:', error);
    }
  },

  // Fetch Positions
  fetchPositions: async () => {
    try {
      const { data, error } = await supabase
        .from('agent_positions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ positions: data || [] });
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  },

  // Fetch Notifications
  fetchNotifications: async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      set({ notifications: data || [] });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  },

  // Fetch Leaderboard
  fetchLeaderboard: async () => {
    try {
      const { data, error } = await supabase
        .from('agent_leaderboard')
        .select('*')
        .limit(100);

      if (error) throw error;
      set({ leaderboard: data || [] });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  },

  // Start Agent
  startAgent: async (agentId: string) => {
    try {
      const { error } = await supabase
        .from('trading_agents')
        .update({ status: 'active' })
        .eq('id', agentId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === agentId ? { ...agent, status: 'active' as const } : agent
        )
      }));
    } catch (error) {
      console.error('Error starting agent:', error);
      throw error;
    }
  },

  // Pause Agent
  pauseAgent: async (agentId: string) => {
    try {
      const { error } = await supabase
        .from('trading_agents')
        .update({ status: 'paused' })
        .eq('id', agentId);

      if (error) throw error;

      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === agentId ? { ...agent, status: 'paused' as const } : agent
        )
      }));
    } catch (error) {
      console.error('Error pausing agent:', error);
      throw error;
    }
  },

  // Stop Agent
  stopAgent: async (agentId: string) => {
    try {
      const { error } = await supabase
        .from('trading_agents')
        .update({ status: 'stopped' })
        .eq('id', agentId);

      if (error) throw error;

      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === agentId ? { ...agent, status: 'stopped' as const } : agent
        )
      }));
    } catch (error) {
      console.error('Error stopping agent:', error);
      throw error;
    }
  },

  // Delete Agent
  deleteAgent: async (agentId: string) => {
    try {
      const { error } = await supabase
        .from('trading_agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      set((state) => ({
        agents: state.agents.filter((agent) => agent.id !== agentId)
      }));
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  },

  // Mark Notification Read
  markNotificationRead: async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      }));
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  },

  // Mark All Notifications Read
  markAllNotificationsRead: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.map((notif) => ({ ...notif, read: true }))
      }));
    } catch (error) {
      console.error('Error marking all notifications read:', error);
    }
  },

  // Subscribe to Realtime Updates with auto-reconnection
  subscribeToRealtime: (userId: string) => {
    console.log('🔌 Connecting to Realtime...');

    // Subscribe to agents with reconnection logic
    const agentsChannel = supabase
      .channel('trading_agents_changes', {
        config: {
          broadcast: { self: true },
          presence: { key: userId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_agents',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Agent change:', payload);
          get().fetchAgents();
        }
      )
      .subscribe((status) => {
        console.log('Agents channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Agents realtime connected');
        }
      });

    // Subscribe to trades
    const tradesChannel = supabase
      .channel('trades_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Trade change:', payload);
          get().fetchTrades();
        }
      )
      .subscribe((status) => {
        console.log('Trades channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Trades realtime connected');
        }
      });

    // Subscribe to actions
    const actionsChannel = supabase
      .channel('actions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_actions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Action change:', payload);
          get().fetchActions();
        }
      )
      .subscribe((status) => {
        console.log('Actions channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Actions realtime connected');
        }
      });

    // Subscribe to notifications
    const notificationsChannel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification:', payload);
          get().fetchNotifications();
        }
      )
      .subscribe((status) => {
        console.log('Notifications channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Notifications realtime connected');
        }
      });

    set({ realtimeConnected: true });
    console.log('🚀 All realtime channels initialized');
  },

  // Unsubscribe from Realtime
  unsubscribeFromRealtime: () => {
    supabase.removeAllChannels();
    set({ realtimeConnected: false });
  }
}));
