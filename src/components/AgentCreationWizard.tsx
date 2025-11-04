import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Zap,
  LineChart,
  Target,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface AgentStrategy {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  riskLevel: 'low' | 'medium' | 'high';
  characteristics: string[];
  config: Record<string, any>;
}

const STRATEGIES: AgentStrategy[] = [
  {
    id: 'momentum',
    name: 'Momentum Trading',
    description: 'Follows strong trends and rides market momentum. Buys assets showing upward movement and sells during downtrends.',
    icon: <TrendingUp className="w-6 h-6" />,
    riskLevel: 'medium',
    characteristics: [
      'Trend following',
      'Technical indicators',
      'Quick entry/exit',
      'High frequency'
    ],
    config: {
      indicators: ['RSI', 'MACD', 'Moving Averages'],
      timeframe: 'short',
      maxHoldPeriod: '3 days'
    }
  },
  {
    id: 'mean_reversion',
    name: 'Mean Reversion',
    description: 'Buys oversold assets and sells overbought ones, betting on price returns to average.',
    icon: <TrendingDown className="w-6 h-6" />,
    riskLevel: 'medium',
    characteristics: [
      'Counter-trend',
      'Statistical analysis',
      'Value seeking',
      'Patient approach'
    ],
    config: {
      indicators: ['Bollinger Bands', 'RSI', 'Standard Deviation'],
      timeframe: 'medium',
      maxHoldPeriod: '7 days'
    }
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Makes decisions based on news sentiment, social media trends, and market emotions.',
    icon: <Brain className="w-6 h-6" />,
    riskLevel: 'high',
    characteristics: [
      'News-driven',
      'AI sentiment analysis',
      'Event-based',
      'Fast reactions'
    ],
    config: {
      sources: ['News APIs', 'Social Media', 'Economic Calendar'],
      timeframe: 'short',
      maxHoldPeriod: '2 days'
    }
  },
  {
    id: 'scalping',
    name: 'Scalping',
    description: 'High-frequency trading capturing small price movements. Makes numerous quick trades.',
    icon: <Zap className="w-6 h-6" />,
    riskLevel: 'high',
    characteristics: [
      'Very high frequency',
      'Small profits per trade',
      'Tight stop-losses',
      'Requires attention'
    ],
    config: {
      indicators: ['Price Action', 'Volume', 'Order Flow'],
      timeframe: 'ultra-short',
      maxHoldPeriod: '1 hour'
    }
  },
  {
    id: 'swing',
    name: 'Swing Trading',
    description: 'Holds positions for days to weeks, capturing larger market swings.',
    icon: <LineChart className="w-6 h-6" />,
    riskLevel: 'low',
    characteristics: [
      'Medium-term holds',
      'Pattern recognition',
      'Lower frequency',
      'Balanced approach'
    ],
    config: {
      indicators: ['Chart Patterns', 'Support/Resistance', 'Fibonacci'],
      timeframe: 'long',
      maxHoldPeriod: '14 days'
    }
  },
  {
    id: 'arbitrage',
    name: 'Arbitrage',
    description: 'Exploits price differences across markets or exchanges for risk-free profits.',
    icon: <Target className="w-6 h-6" />,
    riskLevel: 'low',
    characteristics: [
      'Low risk',
      'Market inefficiencies',
      'Quick execution',
      'Multiple markets'
    ],
    config: {
      markets: ['Multiple exchanges'],
      timeframe: 'instant',
      maxHoldPeriod: 'Minutes'
    }
  }
];

interface AgentCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AgentCreationWizard = ({ open, onOpenChange, onSuccess }: AgentCreationWizardProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Info
  const [agentName, setAgentName] = useState('');

  // Step 2: Strategy
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');

  // Step 3: Market Type
  const [marketTypes, setMarketTypes] = useState<string[]>(['stocks']);

  // Step 4: Risk & Capital
  const [riskTolerance, setRiskTolerance] = useState([5]);
  const [initialBalance, setInitialBalance] = useState('1000');
  const [maxPositionSize, setMaxPositionSize] = useState([20]);

  // Step 5: Trading Mode
  const [tradingMode, setTradingMode] = useState<'paper' | 'live'>('paper');

  const getRiskLevel = (risk: number) => {
    if (risk <= 3) return { label: 'Conservative', color: 'bg-green-500' };
    if (risk <= 7) return { label: 'Moderate', color: 'bg-yellow-500' };
    return { label: 'Aggressive', color: 'bg-red-500' };
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return agentName.trim().length >= 3;
      case 2:
        return selectedStrategy !== '';
      case 3:
        return marketTypes.length > 0;
      case 4:
        return parseFloat(initialBalance) >= 50;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const strategy = STRATEGIES.find(s => s.id === selectedStrategy);

      const { error } = await supabase.from('trading_agents').insert({
        user_id: user.id,
        name: agentName,
        strategy: selectedStrategy,
        market_type: marketTypes.length === 2 ? 'both' : marketTypes[0],
        balance: parseFloat(initialBalance),
        initial_balance: parseFloat(initialBalance),
        risk_tolerance: riskTolerance[0],
        max_position_size: maxPositionSize[0] / 100,
        trading_mode: tradingMode,
        status: 'paused',
        strategy_config: strategy?.config || {}
      });

      if (error) throw error;

      toast.success('Agent created successfully!');
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setAgentName('');
    setSelectedStrategy('');
    setMarketTypes(['stocks']);
    setRiskTolerance([5]);
    setInitialBalance('1000');
    setMaxPositionSize([20]);
    setTradingMode('paper');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="agentName">Agent Name</Label>
              <Input
                id="agentName"
                placeholder="e.g., Alpha Trader, Market Hunter"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Give your agent a unique name (minimum 3 characters)
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Select Trading Strategy</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the strategy your agent will use to make trading decisions
              </p>
            </div>

            <RadioGroup value={selectedStrategy} onValueChange={setSelectedStrategy}>
              <div className="grid gap-4">
                {STRATEGIES.map((strategy) => (
                  <Card
                    key={strategy.id}
                    className={`cursor-pointer transition-all ${
                      selectedStrategy === strategy.id
                        ? 'ring-2 ring-primary'
                        : 'hover:ring-1 hover:ring-muted-foreground'
                    }`}
                    onClick={() => setSelectedStrategy(strategy.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={strategy.id} id={strategy.id} />
                          <div className="flex items-center gap-2">
                            {strategy.icon}
                            <CardTitle className="text-lg">{strategy.name}</CardTitle>
                          </div>
                        </div>
                        <Badge
                          variant={
                            strategy.riskLevel === 'low'
                              ? 'default'
                              : strategy.riskLevel === 'medium'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {strategy.riskLevel} risk
                        </Badge>
                      </div>
                      <CardDescription>{strategy.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {strategy.characteristics.map((char) => (
                          <Badge key={char} variant="outline">
                            {char}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Market Type</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select which markets your agent will trade in
              </p>
            </div>

            <div className="space-y-3">
              <Card
                className={`cursor-pointer transition-all ${
                  marketTypes.includes('stocks') ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  if (marketTypes.includes('stocks')) {
                    setMarketTypes(marketTypes.filter((m) => m !== 'stocks'));
                  } else {
                    setMarketTypes([...marketTypes, 'stocks']);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={marketTypes.includes('stocks')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setMarketTypes([...marketTypes, 'stocks']);
                        } else {
                          setMarketTypes(marketTypes.filter((m) => m !== 'stocks'));
                        }
                      }}
                    />
                    <div>
                      <CardTitle>Stocks</CardTitle>
                      <CardDescription>
                        Trade equity markets (NYSE, NASDAQ, etc.)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  marketTypes.includes('crypto') ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  if (marketTypes.includes('crypto')) {
                    setMarketTypes(marketTypes.filter((m) => m !== 'crypto'));
                  } else {
                    setMarketTypes([...marketTypes, 'crypto']);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={marketTypes.includes('crypto')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setMarketTypes([...marketTypes, 'crypto']);
                        } else {
                          setMarketTypes(marketTypes.filter((m) => m !== 'crypto'));
                        }
                      }}
                    />
                    <div>
                      <CardTitle>Cryptocurrency</CardTitle>
                      <CardDescription>
                        Trade crypto markets (Bitcoin, Ethereum, etc.)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        );

      case 4:
        const riskLevel = getRiskLevel(riskTolerance[0]);

        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="initialBalance">Initial Balance</Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="initialBalance"
                  type="number"
                  min="50"
                  step="50"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Minimum: $50
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Risk Tolerance</Label>
                <Badge className={riskLevel.color}>{riskLevel.label}</Badge>
              </div>
              <Slider
                value={riskTolerance}
                onValueChange={setRiskTolerance}
                min={1}
                max={10}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Conservative (1)</span>
                <span>Moderate (5)</span>
                <span>Aggressive (10)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Max Position Size</Label>
                <span className="text-sm font-medium">{maxPositionSize[0]}%</span>
              </div>
              <Slider
                value={maxPositionSize}
                onValueChange={setMaxPositionSize}
                min={5}
                max={50}
                step={5}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Maximum percentage of balance per trade
              </p>
            </div>
          </div>
        );

      case 5:
        const strategy = STRATEGIES.find((s) => s.id === selectedStrategy);

        return (
          <div className="space-y-6">
            <div>
              <Label>Trading Mode</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Choose between paper trading (simulated) or live trading (real money)
              </p>
            </div>

            <RadioGroup value={tradingMode} onValueChange={(value) => setTradingMode(value as 'paper' | 'live')}>
              <Card
                className={`cursor-pointer transition-all ${
                  tradingMode === 'paper' ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setTradingMode('paper')}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="paper" id="paper" />
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Paper Trading
                        <Badge variant="secondary">Recommended</Badge>
                      </CardTitle>
                      <CardDescription>
                        Simulated trading with virtual money. Perfect for testing strategies without risk.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  tradingMode === 'live' ? 'ring-2 ring-destructive' : ''
                }`}
                onClick={() => setTradingMode('live')}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="live" id="live" />
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Live Trading
                        <Badge variant="destructive">Real Money</Badge>
                      </CardTitle>
                      <CardDescription>
                        Real trading with actual money. Only use if you're confident in your strategy.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </RadioGroup>

            {tradingMode === 'live' && (
              <Card className="border-destructive bg-destructive/10">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <CardTitle className="text-sm text-destructive">Warning</CardTitle>
                      <CardDescription className="text-destructive/80">
                        Live trading involves real financial risk. You may lose your entire investment.
                        Make sure you have proper API keys configured and understand the risks.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Review Your Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{agentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strategy:</span>
                  <span className="font-medium">{strategy?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Markets:</span>
                  <span className="font-medium capitalize">
                    {marketTypes.length === 2 ? 'Stocks & Crypto' : marketTypes[0]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Initial Balance:</span>
                  <span className="font-medium">${initialBalance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Tolerance:</span>
                  <span className="font-medium">{getRiskLevel(riskTolerance[0]).label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Position:</span>
                  <span className="font-medium">{maxPositionSize[0]}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-medium capitalize">{tradingMode}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Trading Agent</DialogTitle>
          <DialogDescription>
            Step {step} of 5: {
              step === 1 ? 'Basic Information' :
              step === 2 ? 'Select Strategy' :
              step === 3 ? 'Choose Markets' :
              step === 4 ? 'Configure Risk & Capital' :
              'Review & Launch'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    s < step
                      ? 'bg-primary border-primary text-primary-foreground'
                      : s === step
                      ? 'border-primary text-primary'
                      : 'border-muted text-muted-foreground'
                  }`}
                >
                  {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
              ))}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {renderStep()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1 || loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < 5 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed() || loading}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating...' : 'Create Agent'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
