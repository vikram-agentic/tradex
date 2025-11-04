import { useEffect, useRef } from 'react';
import { useTradingStore } from '@/stores/tradingStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Brain,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const AgentActivityFeed = () => {
  const { trades, actions, fetchTrades, fetchActions } = useTradingStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrades(50);
    fetchActions(100);

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      fetchTrades(50);
      fetchActions(100);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchTrades, fetchActions]);

  // Auto-scroll to top when new items arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [trades.length, actions.length]);

  // Combine and sort trades and actions by timestamp
  const combinedActivity = [
    ...trades.map((trade) => ({
      id: trade.id,
      type: 'trade' as const,
      timestamp: trade.created_at,
      data: trade
    })),
    ...actions.map((action) => ({
      id: action.id,
      type: 'action' as const,
      timestamp: action.created_at,
      data: action
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getTradeIcon = (tradeType: string) => {
    return tradeType === 'buy' ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'decision':
        return <Brain className="w-4 h-4 text-blue-600" />;
      case 'trade':
        return <Activity className="w-4 h-4 text-purple-600" />;
      case 'analysis':
        return <Activity className="w-4 h-4 text-cyan-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'status_change':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getTradeStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
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

  if (combinedActivity.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Live Activity Feed
          </CardTitle>
          <CardDescription>No activity yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start your agents to see live activity!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Live Activity Feed
          <Badge variant="outline" className="ml-auto">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </Badge>
        </CardTitle>
        <CardDescription>Real-time agent decisions and trades</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[600px]" ref={scrollRef}>
          <div className="p-6 space-y-3">
            {combinedActivity.map((item) => {
              if (item.type === 'trade') {
                const trade = item.data as any;
                return (
                  <Card
                    key={`trade-${item.id}`}
                    className={cn(
                      'transition-all hover:shadow-md animate-in fade-in slide-in-from-top-2',
                      trade.trade_type === 'buy' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">{getTradeIcon(trade.trade_type)}</div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{trade.agent_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {trade.agent_strategy?.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDistanceToNow(new Date(trade.created_at), { addSuffix: true })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={trade.trade_type === 'buy' ? 'default' : 'destructive'}
                              className={trade.trade_type === 'buy' ? 'bg-green-600' : 'bg-red-600'}
                            >
                              {trade.trade_type.toUpperCase()}
                            </Badge>
                            <span className="font-medium text-lg">{trade.symbol}</span>
                            <span className="text-muted-foreground">
                              {trade.quantity} @ {formatCurrency(trade.price)}
                            </span>
                            {getTradeStatusBadge(trade.status)}
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">{formatCurrency(trade.total_amount)}</span>
                          </div>

                          {trade.reasoning && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                              <Brain className="w-3 h-3 inline mr-1" />
                              <span className="text-muted-foreground italic">"{trade.reasoning}"</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              } else {
                const action = item.data as any;
                return (
                  <Card
                    key={`action-${item.id}`}
                    className="transition-all hover:shadow-md animate-in fade-in slide-in-from-top-2"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">{getActionIcon(action.action_type)}</div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{action.agent_name}</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {action.action_type.replace('_', ' ')}
                            </Badge>
                            {action.confidence_score && (
                              <Badge variant="secondary" className="text-xs">
                                {action.confidence_score}% confidence
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                            </span>
                          </div>

                          {action.reasoning && (
                            <div className="text-sm text-muted-foreground">
                              <Brain className="w-3 h-3 inline mr-1" />
                              <span className="italic">"{action.reasoning}"</span>
                            </div>
                          )}

                          {action.action_data && Object.keys(action.action_data).length > 0 && (
                            <div className="mt-2 text-xs font-mono bg-muted/50 p-2 rounded">
                              {JSON.stringify(action.action_data, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
