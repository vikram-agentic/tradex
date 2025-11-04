import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AgentRunner } from "@/components/AgentRunner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAgents();
    }
  }, [user]);

  const loadAgents = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('trading_agents')
      .select('*')
      .eq('user_id', user.id)
      .order('balance', { ascending: false });

    if (!error && data) {
      setAgents(data);
    }
    setLoading(false);
  };

  const totalBalance = agents.reduce((sum, agent) => sum + Number(agent.balance), 0);
  const totalProfit = agents.reduce((sum, agent) => sum + Number(agent.total_profit), 0);
  const totalTrades = agents.reduce((sum, agent) => sum + agent.total_trades, 0);

  const sortedAgents = [...agents].sort((a, b) => Number(b.balance) - Number(a.balance));

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border/40 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TradeX AI
            </span>
          </Link>

          <div className="flex items-center gap-4">
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
            <Button variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
            {
              label: "Total Balance",
              value: `$${totalBalance.toFixed(2)}`,
              change: totalProfit > 0 ? `+${((totalProfit / (totalBalance - totalProfit)) * 100).toFixed(2)}%` : "0%",
              icon: DollarSign,
              trend: "up",
            },
            {
              label: "Total Profit",
              value: `$${totalProfit.toFixed(2)}`,
              change: totalProfit > 0 ? `+${((totalProfit / (totalBalance - totalProfit)) * 100).toFixed(2)}%` : "0%",
              icon: TrendingUp,
              trend: "up",
            },
            {
              label: "Active Agents",
              value: agents.length.toString(),
              change: "Trading ready",
              icon: Bot,
              trend: "neutral",
            },
            {
              label: "Total Trades",
              value: totalTrades.toString(),
              change: "All time",
              icon: Activity,
              trend: "neutral",
            },
          ].map((stat, i) => (
            <Card key={i} className="glass p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="h-8 w-8 text-primary" />
                {stat.trend === "up" && (
                  <span className="text-xs text-success flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="agents">AI Agents</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-4">
            {loading ? (
              <Card className="glass p-6">
                <p className="text-center text-muted-foreground">Loading agents...</p>
              </Card>
            ) : agents.length === 0 ? (
              <Card className="glass p-6">
                <p className="text-center text-muted-foreground">
                  No agents yet. Create your first trading agent to get started.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {agents.map((agent) => {
                  const profitPercent = agent.initial_balance > 0 
                    ? ((Number(agent.total_profit) / Number(agent.initial_balance)) * 100) 
                    : 0;
                  const winRate = agent.total_trades > 0
                    ? ((agent.winning_trades / agent.total_trades) * 100)
                    : 0;

                  return (
                    <Card key={agent.id} className="glass p-6 hover:scale-[1.02] transition-transform space-y-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                            <Bot className="h-6 w-6 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{agent.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {agent.strategy} • {agent.market_type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/20 text-success text-xs">
                          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                          {agent.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Balance</p>
                          <p className="text-2xl font-bold text-primary">
                            ${Number(agent.balance).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Profit</p>
                          <p className={`text-2xl font-bold ${Number(agent.total_profit) >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {Number(agent.total_profit) >= 0 ? '+' : ''}
                            ${Number(agent.total_profit).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">ROI</span>
                          <span className={`font-semibold ${profitPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                          </span>
                        </div>
                        <Progress value={Math.min(Math.abs(profitPercent), 100)} className="h-2" />
                      </div>

                      <div className="flex justify-between text-sm border-t border-border pt-3">
                        <div>
                          <p className="text-muted-foreground">Trades</p>
                          <p className="font-semibold">{agent.total_trades}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Win Rate</p>
                          <p className="font-semibold text-success">{winRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Risk</p>
                          <p className="font-semibold">{agent.risk_tolerance}/10</p>
                        </div>
                      </div>

                      <AgentRunner agentId={agent.id} agentName={agent.name} />
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card className="glass p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                Top Performing Agents
              </h2>

              {sortedAgents.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No agents to display yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {sortedAgents.map((agent, index) => {
                    const profitPercent = agent.initial_balance > 0 
                      ? ((Number(agent.total_profit) / Number(agent.initial_balance)) * 100) 
                      : 0;

                    return (
                      <div
                        key={agent.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                      >
                        <div
                          className={`text-2xl font-bold w-10 text-center ${
                            index === 0
                              ? "text-warning"
                              : index === 1
                              ? "text-muted-foreground"
                              : index === 2
                              ? "text-warning/60"
                              : "text-muted-foreground/60"
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                          <Bot className="h-6 w-6 text-primary-foreground" />
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold">{agent.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {agent.strategy} • {agent.market_type}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            ${Number(agent.balance).toFixed(2)}
                          </p>
                          <p className={`text-sm ${profitPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
