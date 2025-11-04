import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  TrendingUp,
  TrendingDown,
  Wallet,
  Settings,
  LogOut,
  DollarSign,
  Trophy,
  Activity,
  Plus,
  Target,
  Zap
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AgentRunner } from "@/components/AgentRunner";
import { AgentCreationWizard } from "@/components/AgentCreationWizard";
import { AgentLeaderboard } from "@/components/AgentLeaderboard";
import { AgentActivityFeed } from "@/components/AgentActivityFeed";
import { AutopilotTrading } from "@/components/AutopilotTrading";
import { useAuth } from "@/hooks/useAuth";
import { useTradingStore } from "@/stores/tradingStore";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function EnhancedDashboard() {
  const { user } = useAuth();
  const [wizardOpen, setWizardOpen] = useState(false);
  const {
    agents,
    positions,
    loading,
    fetchAgents,
    fetchPositions,
    subscribeToRealtime,
    unsubscribeFromRealtime
  } = useTradingStore();

  useEffect(() => {
    if (user) {
      // Initial data fetch
      fetchAgents();
      fetchPositions();

      // Subscribe to realtime updates
      subscribeToRealtime(user.id);

      // Cleanup
      return () => {
        unsubscribeFromRealtime();
      };
    }
  }, [user]);

  const handleLogout = async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const totalBalance = agents.reduce((sum, agent) => sum + Number(agent.balance), 0);
  const totalProfit = agents.reduce((sum, agent) => sum + Number(agent.total_profit), 0);
  const totalTrades = agents.reduce((sum, agent) => sum + agent.total_trades, 0);
  const totalWinningTrades = agents.reduce((sum, agent) => sum + agent.winning_trades, 0);
  const overallWinRate = totalTrades > 0 ? (totalWinningTrades / totalTrades) * 100 : 0;

  const activeAgents = agents.filter(a => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border/40 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TradeX AI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => setWizardOpen(true)}
              className="gap-2 bg-gradient-primary"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Agent</span>
            </Button>
            <Link to="/wallet">
              <Button variant="outline" className="gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Wallet</span>
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[
            {
              label: "Total Balance",
              value: `$${totalBalance.toFixed(2)}`,
              change: totalProfit > 0 ? `+${((totalProfit / (totalBalance - totalProfit)) * 100).toFixed(2)}%` : "0%",
              icon: DollarSign,
              trend: "up" as const,
              color: "text-blue-600"
            },
            {
              label: "Total Profit",
              value: `$${totalProfit.toFixed(2)}`,
              change: totalProfit >= 0 ? "profit" : "loss",
              icon: TrendingUp,
              trend: totalProfit >= 0 ? "up" as const : "down" as const,
              color: totalProfit >= 0 ? "text-green-600" : "text-red-600"
            },
            {
              label: "Active Agents",
              value: `${activeAgents}/${agents.length}`,
              change: "Trading now",
              icon: Bot,
              trend: "neutral" as const,
              color: "text-purple-600"
            },
            {
              label: "Total Trades",
              value: totalTrades.toString(),
              change: `${totalWinningTrades} wins`,
              icon: Activity,
              trend: "neutral" as const,
              color: "text-cyan-600"
            },
            {
              label: "Win Rate",
              value: `${overallWinRate.toFixed(1)}%`,
              change: "Overall",
              icon: Target,
              trend: overallWinRate > 50 ? "up" as const : "down" as const,
              color: overallWinRate > 50 ? "text-green-600" : "text-orange-600"
            },
          ].map((stat, i) => (
            <Card
              key={i}
              className="glass p-6 hover:scale-105 transition-transform relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={cn("h-8 w-8", stat.color)} />
                  {stat.trend === "up" && (
                    <Badge variant="default" className="bg-green-600 text-white">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.change}
                    </Badge>
                  )}
                  {stat.trend === "down" && (
                    <Badge variant="destructive">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {stat.change}
                    </Badge>
                  )}
                  {stat.trend === "neutral" && (
                    <Badge variant="outline">{stat.change}</Badge>
                  )}
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="agents" className="gap-2">
              <Bot className="h-4 w-4" />
              My Agents
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Live Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-4">
            {loading ? (
              <Card className="glass p-6">
                <div className="flex items-center justify-center">
                  <Zap className="h-8 w-8 animate-pulse text-primary" />
                  <p className="ml-3 text-muted-foreground">Loading agents...</p>
                </div>
              </Card>
            ) : agents.length === 0 ? (
              <Card className="glass p-12 text-center">
                <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Agents Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first AI trading agent to start automated trading
                </p>
                <Button
                  onClick={() => setWizardOpen(true)}
                  className="gap-2 bg-gradient-primary"
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Agent
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {agents.map((agent) => {
                  const profitPercent = agent.initial_balance > 0
                    ? ((Number(agent.total_profit) / Number(agent.initial_balance)) * 100)
                    : 0;
                  const winRate = agent.total_trades > 0
                    ? ((agent.winning_trades / agent.total_trades) * 100)
                    : 0;

                  return (
                    <Card
                      key={agent.id}
                      className="glass p-6 hover:scale-[1.02] transition-all space-y-4 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                              <Bot className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{agent.name}</h3>
                              <p className="text-sm text-muted-foreground capitalize">
                                {agent.strategy.replace('_', ' ')} • {agent.market_type}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={agent.status === 'active' ? 'default' : 'secondary'}
                            className={cn(
                              'flex items-center gap-1',
                              agent.status === 'active' && 'bg-green-600'
                            )}
                          >
                            {agent.status === 'active' && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                              </span>
                            )}
                            {agent.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Balance</p>
                            <p className="text-2xl font-bold text-primary">
                              ${Number(agent.balance).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Profit/Loss</p>
                            <p
                              className={cn(
                                'text-2xl font-bold',
                                Number(agent.total_profit) >= 0 ? 'text-green-600' : 'text-red-600'
                              )}
                            >
                              {Number(agent.total_profit) >= 0 ? '+' : ''}
                              ${Number(agent.total_profit).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">ROI</span>
                            <span
                              className={cn(
                                'font-semibold',
                                profitPercent >= 0 ? 'text-green-600' : 'text-red-600'
                              )}
                            >
                              {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(Math.abs(profitPercent), 100)}
                            className="h-2"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center border-t border-border pt-3 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Trades</p>
                            <p className="font-semibold">{agent.total_trades}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                            <p className="font-semibold text-green-600">{winRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Risk</p>
                            <p className="font-semibold">{agent.risk_tolerance}/10</p>
                          </div>
                        </div>

                        <AgentRunner
                          agentId={agent.id}
                          agentName={agent.name}
                          onUpdate={fetchAgents}
                        />

                        {/* Autopilot Trading - Runs automatically when agent is active */}
                        <AutopilotTrading
                          agentId={agent.id}
                          agentName={agent.name}
                          isActive={agent.status === 'active'}
                          tradingInterval={30000}
                        />
                      </div>
                    </Card>
                  );
                })}

                {/* Create New Agent Card */}
                <Card
                  className="glass p-6 hover:scale-[1.02] transition-all cursor-pointer border-dashed border-2 flex items-center justify-center min-h-[400px]"
                  onClick={() => setWizardOpen(true)}
                >
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Create New Agent</h3>
                    <p className="text-sm text-muted-foreground">
                      Deploy another AI agent to maximize profits
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <AgentLeaderboard />
          </TabsContent>

          <TabsContent value="activity">
            <AgentActivityFeed />
          </TabsContent>
        </Tabs>
      </div>

      {/* Agent Creation Wizard */}
      <AgentCreationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={() => {
          fetchAgents();
        }}
      />
    </div>
  );
}
