-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to encrypt API keys
CREATE OR REPLACE FUNCTION public.encrypt_api_key(key_text TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(key_text, encryption_key),
    'base64'
  );
END;
$$;

-- Create function to decrypt API keys
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key TEXT, encryption_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_key, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Create agent positions table for tracking current holdings
CREATE TABLE IF NOT EXISTS public.agent_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.trading_agents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  quantity DECIMAL(15, 8) NOT NULL,
  average_price DECIMAL(15, 2) NOT NULL,
  current_price DECIMAL(15, 2),
  total_value DECIMAL(15, 2),
  unrealized_pnl DECIMAL(15, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, symbol)
);

ALTER TABLE public.agent_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent positions"
  ON public.agent_positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage positions for their agents"
  ON public.agent_positions FOR ALL
  USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.trading_agents WHERE id = agent_id AND user_id = auth.uid())
  );

-- Create agent performance metrics table
CREATE TABLE IF NOT EXISTS public.agent_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.trading_agents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  balance DECIMAL(15, 2) NOT NULL,
  daily_profit DECIMAL(15, 2) DEFAULT 0.00,
  daily_return DECIMAL(10, 4) DEFAULT 0.00,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0.00,
  sharpe_ratio DECIMAL(10, 4),
  max_drawdown DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, date)
);

ALTER TABLE public.agent_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent performance"
  ON public.agent_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert agent performance"
  ON public.agent_performance FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.trading_agents WHERE id = agent_id AND user_id = auth.uid())
  );

-- Create agent actions log table for detailed activity tracking
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.trading_agents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('decision', 'trade', 'analysis', 'error', 'status_change')),
  action_data JSONB NOT NULL,
  reasoning TEXT,
  confidence_score DECIMAL(5, 2),
  market_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent actions"
  ON public.agent_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert agent actions for their agents"
  ON public.agent_actions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.trading_agents WHERE id = agent_id AND user_id = auth.uid())
  );

-- Create agent competitions table
CREATE TABLE IF NOT EXISTS public.agent_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  competition_type TEXT NOT NULL CHECK (competition_type IN ('daily', 'weekly', 'monthly', 'all_time')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  prize_pool DECIMAL(15, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view competitions"
  ON public.agent_competitions FOR SELECT
  TO authenticated
  USING (true);

-- Create competition leaderboard table
CREATE TABLE IF NOT EXISTS public.competition_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES public.agent_competitions(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.trading_agents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rank INTEGER NOT NULL,
  score DECIMAL(15, 2) NOT NULL,
  profit DECIMAL(15, 2) NOT NULL,
  win_rate DECIMAL(5, 2) NOT NULL,
  total_trades INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_id, agent_id)
);

ALTER TABLE public.competition_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard"
  ON public.competition_leaderboard FOR SELECT
  TO authenticated
  USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_agent_positions_updated_at
  BEFORE UPDATE ON public.agent_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_competitions_updated_at
  BEFORE UPDATE ON public.agent_competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competition_leaderboard_updated_at
  BEFORE UPDATE ON public.competition_leaderboard
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_agent_positions_agent_id ON public.agent_positions(agent_id);
CREATE INDEX idx_agent_positions_symbol ON public.agent_positions(symbol);
CREATE INDEX idx_agent_performance_agent_id ON public.agent_performance(agent_id);
CREATE INDEX idx_agent_performance_date ON public.agent_performance(date);
CREATE INDEX idx_agent_actions_agent_id ON public.agent_actions(agent_id);
CREATE INDEX idx_agent_actions_created_at ON public.agent_actions(created_at DESC);
CREATE INDEX idx_trades_agent_id ON public.trades(agent_id);
CREATE INDEX idx_trades_created_at ON public.trades(created_at DESC);
CREATE INDEX idx_trades_status ON public.trades(status);
CREATE INDEX idx_competition_leaderboard_competition_id ON public.competition_leaderboard(competition_id);
CREATE INDEX idx_competition_leaderboard_rank ON public.competition_leaderboard(rank);

-- Add strategy_config column to trading_agents for storing strategy parameters
ALTER TABLE public.trading_agents ADD COLUMN IF NOT EXISTS strategy_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.trading_agents ADD COLUMN IF NOT EXISTS last_action_at TIMESTAMPTZ;
ALTER TABLE public.trading_agents ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;
ALTER TABLE public.trading_agents ADD COLUMN IF NOT EXISTS max_position_size DECIMAL(5, 2) DEFAULT 0.20;
ALTER TABLE public.trading_agents ADD COLUMN IF NOT EXISTS trading_mode TEXT DEFAULT 'paper' CHECK (trading_mode IN ('paper', 'live'));

-- Create view for agent leaderboard
CREATE OR REPLACE VIEW public.agent_leaderboard AS
SELECT
  ta.id,
  ta.user_id,
  ta.name,
  ta.strategy,
  ta.balance,
  ta.initial_balance,
  ta.total_profit,
  ta.total_trades,
  ta.winning_trades,
  CASE
    WHEN ta.total_trades > 0
    THEN ROUND((ta.winning_trades::DECIMAL / ta.total_trades::DECIMAL) * 100, 2)
    ELSE 0
  END as win_rate,
  CASE
    WHEN ta.initial_balance > 0
    THEN ROUND(((ta.balance - ta.initial_balance) / ta.initial_balance) * 100, 2)
    ELSE 0
  END as roi,
  ta.created_at,
  ta.status,
  ROW_NUMBER() OVER (ORDER BY ta.total_profit DESC) as rank
FROM public.trading_agents ta
WHERE ta.status = 'active'
ORDER BY ta.total_profit DESC;

-- Create view for real-time trade feed
CREATE OR REPLACE VIEW public.trade_feed AS
SELECT
  t.id,
  t.agent_id,
  t.user_id,
  t.symbol,
  t.trade_type,
  t.quantity,
  t.price,
  t.total_amount,
  t.status,
  t.reasoning,
  t.executed_at,
  t.created_at,
  ta.name as agent_name,
  ta.strategy as agent_strategy,
  p.full_name as trader_name
FROM public.trades t
JOIN public.trading_agents ta ON t.agent_id = ta.id
JOIN public.profiles p ON t.user_id = p.id
ORDER BY t.created_at DESC;

-- Insert default all-time competition
INSERT INTO public.agent_competitions (name, description, competition_type, start_date, status)
VALUES (
  'All-Time Leaderboard',
  'Global leaderboard tracking all-time agent performance',
  'all_time',
  now(),
  'active'
) ON CONFLICT DO NOTHING;

-- Create function to update agent balance after trade
CREATE OR REPLACE FUNCTION public.update_agent_balance_on_trade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.trading_agents
    SET
      balance = CASE
        WHEN NEW.trade_type = 'buy' THEN balance - NEW.total_amount
        WHEN NEW.trade_type = 'sell' THEN balance + NEW.total_amount
        ELSE balance
      END,
      total_trades = total_trades + 1,
      last_action_at = NEW.executed_at
    WHERE id = NEW.agent_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for automatic balance updates
CREATE TRIGGER update_agent_balance_after_trade
  AFTER UPDATE ON public.trades
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.update_agent_balance_on_trade();

-- Create function to log agent actions
CREATE OR REPLACE FUNCTION public.log_agent_action(
  p_agent_id UUID,
  p_user_id UUID,
  p_action_type TEXT,
  p_action_data JSONB,
  p_reasoning TEXT DEFAULT NULL,
  p_confidence_score DECIMAL DEFAULT NULL,
  p_market_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_id UUID;
BEGIN
  INSERT INTO public.agent_actions (
    agent_id,
    user_id,
    action_type,
    action_data,
    reasoning,
    confidence_score,
    market_data
  )
  VALUES (
    p_agent_id,
    p_user_id,
    p_action_type,
    p_action_data,
    p_reasoning,
    p_confidence_score,
    p_market_data
  )
  RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$;
