import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Pause, AlertTriangle } from 'lucide-react';
import { useTrading } from '@/hooks/useTrading';
import { useToast } from '@/hooks/use-toast';

interface AgentRunnerProps {
  agentId: string;
  agentName: string;
}

export const AgentRunner = ({ agentId, agentName }: AgentRunnerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [useLive, setUseLive] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const { runAutonomousAgent, loading } = useTrading();
  const { toast } = useToast();

  const startAgent = async () => {
    if (useLive) {
      const confirmed = window.confirm(
        '⚠️ WARNING: You are about to enable LIVE trading with REAL MONEY. Are you sure?'
      );
      if (!confirmed) return;
    }

    setIsRunning(true);
    toast({
      title: 'Agent Started',
      description: `${agentName} is now running in ${useLive ? 'LIVE' : 'PAPER'} mode`,
    });

    // Run immediately
    await runAutonomousAgent(agentId, useLive);

    // Then run every 5 minutes
    const id = setInterval(async () => {
      try {
        await runAutonomousAgent(agentId, useLive);
      } catch (error) {
        console.error('Agent error:', error);
      }
    }, 5 * 60 * 1000);

    setIntervalId(id);
  };

  const stopAgent = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsRunning(false);
    toast({
      title: 'Agent Stopped',
      description: `${agentName} has been stopped`,
    });
  };

  return (
    <Card className="glass p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Autonomous Trading</h3>
            <p className="text-sm text-muted-foreground">
              {isRunning ? 'Agent is actively trading' : 'Agent is paused'}
            </p>
          </div>
          {isRunning ? (
            <Button
              onClick={stopAgent}
              variant="destructive"
              size="sm"
              disabled={loading}
            >
              <Pause className="h-4 w-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button
              onClick={startAgent}
              size="sm"
              disabled={loading}
              className="bg-gradient-primary"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2">
            {useLive && <AlertTriangle className="h-4 w-4 text-destructive" />}
            <Label htmlFor="live-mode" className={useLive ? 'text-destructive' : ''}>
              {useLive ? 'LIVE Trading (Real Money)' : 'Paper Trading (Simulation)'}
            </Label>
          </div>
          <Switch
            id="live-mode"
            checked={useLive}
            onCheckedChange={setUseLive}
            disabled={isRunning}
          />
        </div>

        {useLive && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-xs text-destructive font-semibold">
              ⚠️ LIVE MODE: Trades will use real money from your Alpaca account
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
