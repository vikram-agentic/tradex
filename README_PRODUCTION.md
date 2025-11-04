# TradeX AI - Production-Grade Autonomous Trading Platform

🤖 **Intelligent AI trading agents powered by Claude that compete with each other in real-time to maximize your profits!**

## 🌟 Overview

TradeX AI is a cutting-edge autonomous trading platform that deploys multiple AI-powered trading agents using Claude's advanced intelligence. Each agent operates independently with its own strategy, competes on a global leaderboard, and makes intelligent trading decisions in real-time.

### ✨ Key Features

- 🤖 **Multiple AI Agents** - Deploy unlimited autonomous trading agents
- 🧠 **Claude-Powered Intelligence** - Leverages Claude Sonnet 4.5 for decision making
- 📊 **6 Trading Strategies** - Momentum, Mean Reversion, Sentiment, Scalping, Swing, Arbitrage
- 🏆 **Live Leaderboard** - Real-time agent rankings and competition
- 📈 **Real-Time Activity Feed** - Watch every trade and decision as it happens
- 💰 **Dual Trading Modes** - Paper trading (simulated) and Live trading (real money)
- 🔐 **Enterprise Security** - Encrypted API keys, secure vault storage
- ⚡ **High Performance** - Real-time WebSocket updates, optimized queries
- 📱 **Responsive Design** - Beautiful UI that works on all devices
- 🎯 **Risk Management** - Customizable risk tolerance and position sizing

---

## 📁 Project Structure

```
tradexai-main/
├── src/
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components (57 components)
│   │   ├── AgentCreationWizard.tsx      # Multi-step agent creation wizard
│   │   ├── AgentLeaderboard.tsx         # Real-time leaderboard
│   │   ├── AgentActivityFeed.tsx        # Live trade and activity feed
│   │   ├── AgentRunner.tsx              # Agent control component
│   │   ├── Navbar.tsx                   # Navigation bar
│   │   ├── ProtectedRoute.tsx           # Auth-protected routes
│   │   └── Theme*.tsx                   # Theme components
│   ├── hooks/
│   │   ├── useAuth.tsx                  # Authentication hook
│   │   ├── useEncryptedApiKeys.tsx      # Secure API key management
│   │   ├── useTrading.tsx               # Trading operations
│   │   └── use-toast.ts                 # Toast notifications
│   ├── stores/
│   │   └── tradingStore.ts              # Zustand global state management
│   ├── pages/
│   │   ├── EnhancedDashboard.tsx        # 🆕 Main dashboard with all features
│   │   ├── Dashboard.tsx                # Classic dashboard (legacy)
│   │   ├── Landing.tsx                  # Landing page
│   │   ├── Login.tsx                    # Login page
│   │   ├── Signup.tsx                   # Signup page
│   │   ├── Settings.tsx                 # API key configuration
│   │   └── Wallet.tsx                   # Wallet management
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts                # Supabase client
│   │       └── types.ts                 # Generated database types
│   ├── lib/
│   │   └── utils.ts                     # Utility functions
│   ├── App.tsx                          # Main app with routing
│   ├── main.tsx                         # Entry point
│   └── index.css                        # Global styles
├── supabase/
│   ├── functions/
│   │   ├── intelligent-trading-agent/   # 🆕 Claude AI trading agent
│   │   ├── agent-scheduler/             # 🆕 Automated agent execution
│   │   ├── manage-api-keys/             # 🆕 Encrypted API key management
│   │   ├── agent-decision/              # Claude decision engine (legacy)
│   │   ├── execute-trade/               # Alpaca trade execution
│   │   └── fetch-market-news/           # News fetching
│   ├── migrations/
│   │   ├── 20251103105948_*.sql         # Initial schema
│   │   ├── 20251104104832_*.sql         # Updates
│   │   └── 20251104130000_*.sql         # 🆕 Encryption & performance tracking
│   └── config.toml                      # Supabase config
├── package.json                         # Dependencies
├── vite.config.ts                       # Vite configuration
├── tailwind.config.ts                   # Tailwind CSS config
└── tsconfig.json                        # TypeScript config
```

---

## 🗄️ Database Schema

### Core Tables

**trading_agents** - AI trading agents
- Configuration, strategy, balance, performance metrics
- Status: active, paused, stopped
- Strategy types: momentum, mean_reversion, sentiment, scalping, swing, arbitrage
- Trading modes: paper, live

**trades** - Individual trade records
- Buy/sell transactions with reasoning
- Status tracking: pending → completed/failed
- Links to agent and user

**agent_actions** - Detailed activity log
- All agent decisions and reasoning
- Confidence scores and market data
- Action types: decision, trade, analysis, error, status_change

**agent_positions** - Current holdings
- Real-time position tracking
- Unrealized P&L calculation
- Average price and current value

**agent_performance** - Historical performance
- Daily snapshots of agent metrics
- Win rates, Sharpe ratio, drawdowns
- Performance over time

**agent_competitions** - Competition system
- Daily, weekly, monthly, all-time competitions
- Prize pools and rankings

**competition_leaderboard** - Rankings
- Real-time leaderboard data
- Score calculation and updates

**notifications** - User alerts
- Trade execution, agent status, profit alerts
- Risk warnings, system notifications

**api_keys** - Encrypted API storage
- PGP encryption for sensitive keys
- Services: Anthropic, Alpaca, NewsAPI

**market_news** - Cached news data
- Sentiment analysis
- Symbol associations

### Views

**agent_leaderboard** - Optimized leaderboard query
- Real-time rankings by profit
- Win rates and ROI calculations

**trade_feed** - Activity feed query
- Trades with agent and user info
- Sorted by recency

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Anthropic API key (Claude)
- Alpaca trading account (paper or live)
- NewsAPI key (optional)

### 1. Clone & Install

```bash
cd tradexai-main
npm install
```

### 2. Environment Variables

Create `.env` file:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Edge Functions (set in Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_claude_api_key
API_KEY_ENCRYPTION_SECRET=your_encryption_secret
ALPACA_API_KEY=your_alpaca_key
ALPACA_API_SECRET=your_alpaca_secret
NEWS_API_KEY=your_news_api_key
```

### 3. Database Setup

```bash
# Run migrations
npx supabase db push

# Or if using Supabase CLI:
supabase db push
```

### 4. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy intelligent-trading-agent
supabase functions deploy agent-scheduler
supabase functions deploy manage-api-keys
supabase functions deploy execute-trade
supabase functions deploy fetch-market-news
```

### 5. Set Function Secrets

```bash
supabase secrets set ANTHROPIC_API_KEY=your_key
supabase secrets set API_KEY_ENCRYPTION_SECRET=your_secret
supabase secrets set ALPACA_API_KEY=your_key
supabase secrets set ALPACA_API_SECRET=your_secret
supabase secrets set NEWS_API_KEY=your_key
```

### 6. Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173

---

## 🎯 Trading Strategies

### 1. **Momentum Trading** 📈
- **Risk Level**: Medium
- **Hold Period**: Up to 3 days
- **Approach**: Rides strong trends, buys breakouts
- **Indicators**: RSI, MACD, Moving Averages
- **Best For**: Trending markets, high volume stocks

### 2. **Mean Reversion** 📉
- **Risk Level**: Medium
- **Hold Period**: Up to 7 days
- **Approach**: Buys oversold, sells overbought
- **Indicators**: Bollinger Bands, RSI, Std Dev
- **Best For**: Range-bound markets, established stocks

### 3. **Sentiment Analysis** 🧠
- **Risk Level**: High
- **Hold Period**: Up to 2 days
- **Approach**: News-driven, emotion-based trading
- **Sources**: News APIs, earnings reports, events
- **Best For**: Event-driven opportunities, volatile markets

### 4. **Scalping** ⚡
- **Risk Level**: High
- **Hold Period**: Minutes to 1 hour
- **Approach**: High-frequency, small profits
- **Focus**: Price action, volume, order flow
- **Best For**: Liquid markets, active traders

### 5. **Swing Trading** 📊
- **Risk Level**: Low
- **Hold Period**: Up to 14 days
- **Approach**: Captures larger price swings
- **Tools**: Chart patterns, support/resistance
- **Best For**: Part-time traders, multi-day moves

### 6. **Arbitrage** 🎯
- **Risk Level**: Low
- **Hold Period**: Minutes
- **Approach**: Exploits price differences
- **Method**: Simultaneous buy/sell across exchanges
- **Best For**: Risk-averse, high-frequency opportunities

---

## 🤖 How the AI Agents Work

### Agent Architecture

```
User Creates Agent
       ↓
Agent Scheduler (Edge Function)
   - Runs every 1-5 minutes
   - Fetches all active agents
       ↓
For Each Agent:
   1. Fetch market data (Alpaca API)
   2. Fetch recent news (NewsAPI)
   3. Call Intelligent Trading Agent
       ↓
Claude AI Decision Engine
   - System Prompt (strategy-specific)
   - Current agent status & positions
   - Market data & news sentiment
   - Risk parameters
       ↓
Claude Returns Decision:
   {
     "decision": "BUY" | "SELL" | "HOLD",
     "symbol": "AAPL",
     "quantity": 10,
     "reasoning": "Strong momentum...",
     "confidence": 85,
     "risk_assessment": "Medium"
   }
       ↓
If Decision = BUY/SELL:
   1. Validate trade (balance, limits)
   2. Create trade record
   3. Execute via Alpaca API
   4. Update agent balance
   5. Log action to database
       ↓
Real-time Updates
   - Supabase Realtime pushes to frontend
   - Leaderboard updates
   - Activity feed updates
   - Notifications sent
```

### Strategy-Specific Prompts

Each strategy has a custom system prompt that guides Claude's decision-making:

**Momentum Example:**
```
You are an expert momentum trading AI agent.

RULES:
1. Buy when price shows strong upward momentum
2. Sell when momentum weakens
3. Use RSI (>70 overbought, <30 oversold)
4. Maximum hold period: 3 days
5. Never risk more than position size limit

DECISION PROCESS:
1. Analyze current market data
2. Check technical indicators
3. Review news sentiment
4. Calculate risk/reward
5. Make decision with confidence score
```

---

## 📊 Real-Time Features

### 1. Leaderboard
- **Updates**: Every 10 seconds
- **Metrics**: Profit, win rate, total trades, ROI
- **Rankings**: 🥇 🥈 🥉 for top 3
- **Visual**: Progress bars, color-coded performance

### 2. Activity Feed
- **Real-time**: WebSocket updates via Supabase
- **Shows**: All trades + agent actions
- **Details**: Reasoning, confidence, market data
- **Auto-scroll**: New items appear at top

### 3. Agent Cards
- **Live Status**: Active/Paused/Stopped
- **Metrics**: Balance, profit, win rate, trades
- **Controls**: Start, pause, stop buttons
- **Visual Feedback**: Pulsing indicator for active agents

---

## 🔐 Security Features

### API Key Encryption

```typescript
// Server-side encryption using PostgreSQL pgcrypto
CREATE FUNCTION encrypt_api_key(key_text TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(key_text, encryption_key),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

// Client never sees raw keys
// All encryption/decryption happens server-side
// Keys stored as base64-encoded encrypted strings
```

### Row Level Security (RLS)

All tables have RLS policies:
- Users can only access their own data
- Trades linked to user's agents only
- Notifications filtered by user ID

### Rate Limiting

- API endpoints protected
- Max requests per minute
- Circuit breakers for external APIs

---

## 🎨 UI Components

### Agent Creation Wizard (5 Steps)

**Step 1: Basic Info**
- Agent name (min 3 characters)

**Step 2: Strategy Selection**
- 6 strategy cards with descriptions
- Risk level badges
- Characteristics tags

**Step 3: Market Type**
- Stocks (NYSE, NASDAQ)
- Crypto (BTC, ETH, etc.)
- Both markets

**Step 4: Risk & Capital**
- Initial balance ($50 minimum)
- Risk tolerance slider (1-10)
- Max position size (5-50%)

**Step 5: Trading Mode**
- Paper trading (recommended)
- Live trading (real money warning)
- Final review summary

### Enhanced Dashboard

**Stats Overview** (5 cards):
1. Total Balance
2. Total Profit
3. Active Agents
4. Total Trades
5. Win Rate

**Tabs**:
- **My Agents**: Grid of agent cards + create new
- **Leaderboard**: Global rankings
- **Live Activity**: Real-time feed

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript** - Type safety
- **Vite 5.4** - Build tool
- **TailwindCSS 3.4** - Styling
- **shadcn/ui** - Component library
- **Zustand** - State management
- **React Query** - Server state
- **React Router** - Routing
- **Recharts** - Data visualization

### Backend
- **Supabase** - Backend as a service
- **PostgreSQL** - Database
- **Edge Functions (Deno)** - Serverless functions
- **Supabase Realtime** - WebSocket updates
- **Row Level Security** - Data access control

### External APIs
- **Claude API (Anthropic)** - AI decision engine
- **Alpaca Markets** - Trading execution
- **NewsAPI** - Market news

---

## 📈 Performance Optimizations

1. **Database Indexes** on all frequently queried columns
2. **Materialized Views** for leaderboard (fast queries)
3. **Supabase Realtime** instead of polling
4. **React Query Caching** for API responses
5. **Code Splitting** for faster initial load
6. **Optimistic UI Updates** for instant feedback

---

## 🚧 Deployment

### Production Checklist

- [ ] Set all environment variables
- [ ] Run database migrations
- [ ] Deploy edge functions
- [ ] Configure Supabase secrets
- [ ] Enable RLS on all tables
- [ ] Set up API rate limiting
- [ ] Configure CORS policies
- [ ] Set up monitoring (Sentry)
- [ ] Configure backup schedule
- [ ] Test with paper trading first
- [ ] Add custom domain
- [ ] Enable HTTPS

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables (Vercel)

Add all `.env` variables in Vercel dashboard.

---

## 🧪 Testing

### Test Agent Creation
1. Sign up for account
2. Go to settings → Add Alpaca API keys
3. Click "Create Agent"
4. Complete wizard
5. Start agent
6. Watch activity feed for decisions

### Test Paper Trading
- Use Alpaca paper trading keys
- No real money involved
- Full feature testing

### Test Live Trading
⚠️ **WARNING**: Only use with funds you can afford to lose
- Requires Alpaca live trading account
- Real money at risk
- Start with small amounts

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Agent Performance**
   - Win rate by strategy
   - Average profit per trade
   - Sharpe ratio
   - Maximum drawdown

2. **System Health**
   - API response times
   - Edge function errors
   - Database query performance
   - Realtime connection status

3. **User Engagement**
   - Active users
   - Agents created
   - Trades executed
   - Session duration

---

## 🐛 Troubleshooting

### Agent Not Trading

1. Check agent status (must be "active")
2. Verify API keys are configured
3. Check agent-scheduler function logs
4. Ensure sufficient balance
5. Review error_count in database

### Trades Failing

1. Verify Alpaca API keys
2. Check market hours (stocks trade 9:30-4:00 ET)
3. Ensure symbol is valid
4. Check balance is sufficient
5. Review execute-trade function logs

### Real-time Updates Not Working

1. Check Supabase Realtime is enabled
2. Verify WebSocket connection in browser console
3. Check RLS policies allow SELECT
4. Refresh page and reconnect

---

## 🔮 Roadmap

### Phase 1 ✅ (Completed)
- [x] Agent creation wizard
- [x] 6 trading strategies
- [x] Real-time leaderboard
- [x] Live activity feed
- [x] API key encryption
- [x] Claude AI integration
- [x] Paper & live trading modes

### Phase 2 🚧 (In Progress)
- [ ] Advanced analytics dashboard
- [ ] Portfolio diversification
- [ ] Stop-loss / take-profit automation
- [ ] Backtesting system
- [ ] Performance attribution
- [ ] Email notifications
- [ ] Mobile app (React Native)

### Phase 3 📋 (Planned)
- [ ] Multi-model support (GPT-4, Gemini)
- [ ] Agent collaboration features
- [ ] Tournament mode with prizes
- [ ] Social features (share agents)
- [ ] Strategy marketplace
- [ ] Advanced order types
- [ ] Options trading support

---

## 📄 License

MIT License - See LICENSE file

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/tradexai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/tradexai/discussions)
- **Email**: support@tradexai.com

---

## ⚠️ Disclaimer

**IMPORTANT**: Trading involves significant risk. Past performance does not guarantee future results. The AI agents make autonomous decisions but are not infallible. Only trade with money you can afford to lose. This software is provided "as is" without warranty of any kind.

TradeX AI is for educational and entertainment purposes. Always do your own research and consult with a financial advisor before making investment decisions.

---

## 🎉 Credits

Built with:
- [Claude](https://www.anthropic.com/claude) by Anthropic
- [Supabase](https://supabase.com/)
- [Alpaca Markets](https://alpaca.markets/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

---

**Happy Trading! 🚀📈💰**
