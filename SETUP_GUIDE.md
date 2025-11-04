# 🚀 TradeX AI - Quick Setup Guide

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ Git
- ✅ Supabase account (free tier works)
- ✅ Anthropic API key ([Get one here](https://console.anthropic.com/))
- ✅ Alpaca trading account ([Sign up here](https://alpaca.markets/))

---

## Step 1: Install Dependencies

```bash
cd tradexai-main
npm install
```

This will install all required packages including:
- React, TypeScript, Vite
- Supabase client
- Zustand for state management
- shadcn/ui components
- And more...

---

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com/)
2. Click "Start your project"
3. Create a new organization (if you don't have one)
4. Create a new project:
   - Project name: `tradexai` (or any name)
   - Database password: Save this securely
   - Region: Choose closest to you
   - Wait 2-3 minutes for provisioning

### 2.2 Get Your API Keys

1. Go to Project Settings → API
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon public key**: `eyJhbGciOiJIUzI1...`
   - **Service role key**: `eyJhbGciOiJIUzI1...` (keep secret!)

### 2.3 Create .env File

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Step 3: Run Database Migrations

### Option A: Using Supabase Dashboard (Easiest)

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy content from `supabase/migrations/20251103105948_2e9fa8cc-eadd-4960-8000-d09bb6efc2c8.sql`
4. Run it
5. Repeat for other migration files in order

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

---

## Step 4: Deploy Edge Functions

### 4.1 Set Function Secrets

In Supabase Dashboard → Edge Functions → Secrets, add:

```
ANTHROPIC_API_KEY=sk-ant-your-key
API_KEY_ENCRYPTION_SECRET=your-random-32-char-secret
ALPACA_API_KEY=your-alpaca-key
ALPACA_API_SECRET=your-alpaca-secret
NEWS_API_KEY=your-news-api-key (optional)
```

### 4.2 Deploy Functions

Using Supabase CLI:

```bash
# Deploy intelligent trading agent
supabase functions deploy intelligent-trading-agent

# Deploy agent scheduler
supabase functions deploy agent-scheduler

# Deploy API key manager
supabase functions deploy manage-api-keys

# Deploy trade executor (if exists)
supabase functions deploy execute-trade

# Deploy news fetcher (if exists)
supabase functions deploy fetch-market-news
```

**OR** manually create functions in Supabase Dashboard and copy the code from `supabase/functions/*/index.ts`.

---

## Step 5: Get API Keys

### 5.1 Anthropic API Key (Claude)

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up / Log in
3. Go to API Keys
4. Create new key
5. Copy the key (starts with `sk-ant-`)

### 5.2 Alpaca API Keys

1. Go to [alpaca.markets](https://alpaca.markets/)
2. Sign up for account
3. Go to Paper Trading (for testing)
4. Generate API Key & Secret
5. Copy both

**Important**: Start with **Paper Trading** keys for testing!

### 5.3 NewsAPI Key (Optional)

1. Go to [newsapi.org](https://newsapi.org/)
2. Sign up for free account
3. Get your API key

---

## Step 6: Run the Application

```bash
# Start development server
npm run dev
```

Visit http://localhost:5173

---

## Step 7: Create Your First Agent

1. **Sign Up**
   - Go to http://localhost:5173
   - Click "Sign Up"
   - Create account

2. **Add API Keys**
   - Click Settings (top right)
   - Add your Alpaca Paper Trading keys
   - Add Anthropic API key
   - Save

3. **Create Agent**
   - Go to Dashboard
   - Click "Create Agent" button
   - Follow the wizard:
     - Step 1: Name your agent (e.g., "Alpha Trader")
     - Step 2: Choose strategy (try "Momentum" first)
     - Step 3: Select markets (Stocks for testing)
     - Step 4: Set initial balance ($1000) and risk (5/10)
     - Step 5: Choose Paper Trading mode
   - Click "Create Agent"

4. **Start Trading**
   - Your agent appears on dashboard
   - Click "Start" button
   - Watch the Activity Feed for decisions!

---

## Step 8: Set Up Agent Scheduler (Automated Trading)

For agents to trade automatically, set up a scheduled function:

### Option A: Supabase Cron Job

1. Go to Supabase Dashboard → Database → Cron Jobs
2. Create new job:
   ```sql
   SELECT net.http_post(
     url := 'https://your-project.supabase.co/functions/v1/agent-scheduler',
     headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
   );
   ```
3. Schedule: Every 5 minutes
4. Enable job

### Option B: External Cron (cron-job.org)

1. Go to [cron-job.org](https://cron-job.org/)
2. Create account
3. Create new cron job:
   - URL: `https://your-project.supabase.co/functions/v1/agent-scheduler`
   - Interval: Every 5 minutes
   - Headers: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`

---

## 🎉 You're All Set!

Your TradeX AI platform is now running! Here's what to do next:

### Testing Checklist

- [ ] Create an account
- [ ] Add API keys in settings
- [ ] Create your first agent
- [ ] Start the agent
- [ ] Watch the Activity Feed for trades
- [ ] Check the Leaderboard
- [ ] Create a second agent with different strategy
- [ ] Compare their performance!

### Next Steps

1. **Try Different Strategies**
   - Create agents with each strategy
   - See which performs best

2. **Monitor Performance**
   - Watch the Leaderboard
   - Review the Activity Feed
   - Check agent stats

3. **Optimize Risk**
   - Adjust risk tolerance
   - Change position sizing
   - Pause underperforming agents

4. **Go Live (Optional)**
   - After successful paper trading
   - Switch to live Alpaca keys
   - Start with small amounts

---

## 🐛 Troubleshooting

### "Agent not trading"

**Check:**
1. Agent status is "active"
2. API keys are configured
3. Agent scheduler is running
4. Check browser console for errors
5. Check Supabase Edge Function logs

### "Trades failing"

**Check:**
1. Market is open (stocks: 9:30-4:00 ET, Mon-Fri)
2. Alpaca keys are correct
3. Sufficient balance
4. Symbol is valid
5. Execute-trade function logs

### "Real-time updates not working"

**Check:**
1. Supabase Realtime is enabled
2. Browser WebSocket connection
3. RLS policies allow SELECT
4. Try refreshing the page

### "Can't connect to Supabase"

**Check:**
1. `.env` file exists and has correct values
2. Project URL is correct
3. Anon key is correct
4. Internet connection

---

## 📚 Additional Resources

- **Full Documentation**: See `README_PRODUCTION.md`
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Claude API Docs**: [docs.anthropic.com](https://docs.anthropic.com/)
- **Alpaca Docs**: [alpaca.markets/docs](https://alpaca.markets/docs/)

---

## 🔐 Security Best Practices

1. **Never commit** `.env` file to git
2. **Use paper trading** keys for testing
3. **Rotate API keys** regularly
4. **Monitor** agent behavior closely
5. **Start small** if going live
6. **Set up alerts** for unusual activity

---

## 💡 Tips for Success

1. **Start with Paper Trading**
   - Test thoroughly before using real money
   - Understand how each strategy works

2. **Diversify Strategies**
   - Don't put all agents on one strategy
   - Different strategies excel in different markets

3. **Monitor Regularly**
   - Check the dashboard daily
   - Review trade reasoning
   - Pause underperforming agents

4. **Adjust Risk**
   - Lower risk = smaller positions
   - Higher risk = larger potential gains/losses

5. **Be Patient**
   - Trading takes time
   - Some strategies need days/weeks to show results
   - Don't panic on small losses

---

## 🚀 Ready to Deploy to Production?

See `README_PRODUCTION.md` for production deployment guide including:
- Vercel/Netlify deployment
- Custom domain setup
- Production security checklist
- Monitoring and alerts
- Backup strategies

---

**Happy Trading! 🤖📈💰**

Need help? Open an issue on GitHub or contact support@tradexai.com
