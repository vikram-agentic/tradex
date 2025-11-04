import { useEffect } from 'react';
import { useTradingStore } from '@/stores/tradingStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AgentLeaderboard = () => {
  const { leaderboard, loading, fetchLeaderboard } = useTradingStore();

  useEffect(() => {
    fetchLeaderboard();
    // Refresh leaderboard every 10 seconds
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Trophy className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="w-6 text-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500">🥇 1st Place</Badge>;
      case 2:
        return <Badge className="bg-gray-400">🥈 2nd Place</Badge>;
      case 3:
        return <Badge className="bg-amber-700">🥉 3rd Place</Badge>;
      default:
        return <Badge variant="outline">#{rank}</Badge>;
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'momentum':
        return <TrendingUp className="w-4 h-4" />;
      case 'mean_reversion':
        return <TrendingDown className="w-4 h-4" />;
      case 'scalping':
        return <Zap className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading && leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Agent Leaderboard
          </CardTitle>
          <CardDescription>Loading rankings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Agent Leaderboard
          </CardTitle>
          <CardDescription>No active agents yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Create your first agent to see it on the leaderboard!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Agent Leaderboard
          <Badge variant="outline" className="ml-auto">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </Badge>
        </CardTitle>
        <CardDescription>Top performing agents ranked by profit</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((agent) => (
            <Card
              key={agent.id}
              className={cn(
                'transition-all hover:shadow-md',
                agent.rank === 1 && 'border-yellow-500 bg-yellow-500/5',
                agent.rank === 2 && 'border-gray-400 bg-gray-400/5',
                agent.rank === 3 && 'border-amber-700 bg-amber-700/5'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 flex justify-center">
                    {getRankIcon(agent.rank)}
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-lg truncate">{agent.name}</h4>
                      {agent.rank <= 3 && getRankBadge(agent.rank)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getStrategyIcon(agent.strategy)}
                      <span className="capitalize">{agent.strategy.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-shrink-0 text-right space-y-1">
                    <div
                      className={cn(
                        'text-xl font-bold',
                        agent.total_profit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {formatCurrency(agent.total_profit)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercentage(agent.roi)} ROI
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className="flex-shrink-0 text-center px-3">
                    <div className="text-sm font-medium">{agent.win_rate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>

                  {/* Trades */}
                  <div className="flex-shrink-0 text-center px-3">
                    <div className="text-sm font-medium">{agent.total_trades}</div>
                    <div className="text-xs text-muted-foreground">Trades</div>
                  </div>
                </div>

                {/* Progress Bar */}
                {agent.total_trades > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Winning Trades: {agent.winning_trades}</span>
                      <span>Losing Trades: {agent.total_trades - agent.winning_trades}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${agent.win_rate}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
