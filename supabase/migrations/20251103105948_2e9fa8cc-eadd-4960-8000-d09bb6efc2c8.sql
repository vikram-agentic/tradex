-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create API keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, service)
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys"
  ON public.api_keys FOR ALL
  USING (auth.uid() = user_id);

-- Create trading agents table
CREATE TABLE public.trading_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  strategy TEXT NOT NULL,
  market_type TEXT NOT NULL CHECK (market_type IN ('stocks', 'crypto', 'both')),
  balance DECIMAL(15, 2) DEFAULT 50.00,
  initial_balance DECIMAL(15, 2) DEFAULT 50.00,
  risk_tolerance INTEGER DEFAULT 5 CHECK (risk_tolerance BETWEEN 1 AND 10),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  total_profit DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trading_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agents"
  ON public.trading_agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agents"
  ON public.trading_agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents"
  ON public.trading_agents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents"
  ON public.trading_agents FOR DELETE
  USING (auth.uid() = user_id);

-- Create trades table
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.trading_agents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  quantity DECIMAL(15, 8) NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reasoning TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades"
  ON public.trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create trades for their agents"
  ON public.trades FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.trading_agents WHERE id = agent_id AND user_id = auth.uid())
  );

-- Create market news table
CREATE TABLE public.market_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  source TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  symbols TEXT[],
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view news"
  ON public.market_news FOR SELECT
  TO authenticated
  USING (true);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.trading_agents(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('trade_executed', 'agent_status', 'profit_alert', 'risk_warning', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trading_agents_updated_at
  BEFORE UPDATE ON public.trading_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();