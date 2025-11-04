import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  ArrowLeft,
  Wallet as WalletIcon,
  CreditCard,
  Plus,
  TrendingUp,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";

export default function Wallet() {
  const [amount, setAmount] = useState("");
  const [distribution, setDistribution] = useState({
    agent1: 25,
    agent2: 25,
    agent3: 25,
    agent4: 25,
  });
  const { toast } = useToast();

  const handleAddFunds = () => {
    // TODO: Implement AP2 payment
    toast({
      title: "Payment initiated",
      description: "Opening secure payment gateway...",
    });
  };

  const agents = [
    { id: "agent1", name: "Alpha Trader", balance: 73.42 },
    { id: "agent2", name: "Beta Scanner", balance: 68.91 },
    { id: "agent3", name: "Gamma Momentum", balance: 61.24 },
    { id: "agent4", name: "Delta Arbitrage", balance: 54.87 },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border/40 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                TradeX AI
              </span>
            </div>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <WalletIcon className="h-8 w-8 text-primary" />
          Wallet Management
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="glass p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
            <p className="text-3xl font-bold text-primary">$258.44</p>
          </Card>
          <Card className="glass p-6">
            <p className="text-sm text-muted-foreground mb-2">Available to Deposit</p>
            <p className="text-3xl font-bold">$0.00</p>
          </Card>
          <Card className="glass p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Profit</p>
            <p className="text-3xl font-bold text-success">+$58.44</p>
          </Card>
        </div>

        <Tabs defaultValue="add" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="add">Add Funds</TabsTrigger>
            <TabsTrigger value="distribute">Distribute</TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <Card className="glass p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Add Funds to Agents
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Add funds and distribute them among your trading agents.
              </p>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="10"
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum deposit: $10.00
                  </p>
                </div>

                <Button
                  onClick={handleAddFunds}
                  className="w-full bg-gradient-primary hover:opacity-90"
                  size="lg"
                  disabled={!amount || parseFloat(amount) < 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Funds via AP2 Payment
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="distribute">
            <Card className="glass p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Fund Distribution
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                After successful payment, distribute funds among agents.
              </p>

              <div className="space-y-6">
                {agents.map((agent) => (
                  <div key={agent.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={agent.id}>{agent.name}</Label>
                      <span className="text-sm text-muted-foreground">
                        Current: ${agent.balance}
                      </span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <Input
                        id={agent.id}
                        type="number"
                        value={distribution[agent.id as keyof typeof distribution]}
                        onChange={(e) =>
                          setDistribution({
                            ...distribution,
                            [agent.id]: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        max="100"
                      />
                      <span className="text-sm font-semibold w-12">
                        {distribution[agent.id as keyof typeof distribution]}%
                      </span>
                    </div>
                  </div>
                ))}

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm">
                    Total Distribution:{" "}
                    <span className="font-bold">
                      {Object.values(distribution).reduce((a, b) => a + b, 0)}%
                    </span>
                  </p>
                </div>

                <Button
                  className="w-full bg-gradient-success hover:opacity-90"
                  size="lg"
                  disabled={
                    Object.values(distribution).reduce((a, b) => a + b, 0) !== 100
                  }
                >
                  Confirm Distribution
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
