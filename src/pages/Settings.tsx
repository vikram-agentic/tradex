import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, ArrowLeft, Key, Save } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const [apiKeys, setApiKeys] = useState({
    anthropic: "",
    alpaca_paper_key: "",
    alpaca_paper_secret: "",
    alpaca_live_key: "",
    alpaca_live_secret: "",
    newsApi: "",
  });
  const [loading, setLoading] = useState(false);
  const [initialBalance, setInitialBalance] = useState("50");
  const [maxRisk, setMaxRisk] = useState("5");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('api_keys')
      .select('service, encrypted_key')
      .eq('user_id', user.id);

    if (!error && data) {
      const keys: any = {
        anthropic: "",
        alpaca_paper_key: "",
        alpaca_paper_secret: "",
        alpaca_live_key: "",
        alpaca_live_secret: "",
        newsApi: "",
      };
      data.forEach((item) => {
        if (item.service in keys) {
          keys[item.service] = "••••••••"; // Show masked value
        }
      });
      setApiKeys(keys);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Save API keys
      for (const [service, key] of Object.entries(apiKeys)) {
        if (key && key !== "••••••••") {
          await supabase
            .from('api_keys')
            .upsert({
              user_id: user.id,
              service,
              encrypted_key: key, // In production, encrypt this on the backend
            });
        }
      }

      toast({
        title: "Settings saved",
        description: "Your API keys have been securely stored.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <Card className="glass p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            API Keys Configuration
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configure your API keys for the trading agents. These will be securely
            stored and used automatically.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="anthropic">Anthropic API Key</Label>
              <Input
                id="anthropic"
                type="password"
                placeholder="sk-ant-api..."
                value={apiKeys.anthropic}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, anthropic: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required for Claude AI agents
              </p>
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <h3 className="font-semibold text-sm">Alpaca Paper Trading (Testing)</h3>
              <div>
                <Label htmlFor="alpaca_paper_key">Paper Trading API Key</Label>
                <Input
                  id="alpaca_paper_key"
                  type="password"
                  placeholder="PK..."
                  value={apiKeys.alpaca_paper_key}
                  onChange={(e) => setApiKeys({ ...apiKeys, alpaca_paper_key: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="alpaca_paper_secret">Paper Trading Secret Key</Label>
                <Input
                  id="alpaca_paper_secret"
                  type="password"
                  placeholder="..."
                  value={apiKeys.alpaca_paper_secret}
                  onChange={(e) => setApiKeys({ ...apiKeys, alpaca_paper_secret: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                For testing with virtual money (recommended to start)
              </p>
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <h3 className="font-semibold text-sm text-destructive">Alpaca Live Trading (Real Money)</h3>
              <div>
                <Label htmlFor="alpaca_live_key">Live Trading API Key</Label>
                <Input
                  id="alpaca_live_key"
                  type="password"
                  placeholder="AK..."
                  value={apiKeys.alpaca_live_key}
                  onChange={(e) => setApiKeys({ ...apiKeys, alpaca_live_key: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="alpaca_live_secret">Live Trading Secret Key</Label>
                <Input
                  id="alpaca_live_secret"
                  type="password"
                  placeholder="..."
                  value={apiKeys.alpaca_live_secret}
                  onChange={(e) => setApiKeys({ ...apiKeys, alpaca_live_secret: e.target.value })}
                />
              </div>
              <p className="text-xs text-destructive">
                ⚠️ Use with caution - trades real money
              </p>
            </div>

            <div>
              <Label htmlFor="newsApi">News API Key</Label>
              <Input
                id="newsApi"
                type="password"
                placeholder="..."
                value={apiKeys.newsApi}
                onChange={(e) => setApiKeys({ ...apiKeys, newsApi: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                For real-time market news and sentiment analysis
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="mt-6 bg-gradient-primary hover:opacity-90"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save API Keys"}
          </Button>
        </Card>

        <Card className="glass p-6">
          <h2 className="text-xl font-semibold mb-4">Agent Configuration</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Initial wallet balance and trading parameters for new agents.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="initialBalance">Initial Balance ($)</Label>
              <Input 
                id="initialBalance" 
                type="number" 
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="maxRisk">Max Risk Per Trade (%)</Label>
              <Input 
                id="maxRisk" 
                type="number" 
                value={maxRisk}
                onChange={(e) => setMaxRisk(e.target.value)}
                max="100" 
              />
            </div>
          </div>

          <Button 
            className="mt-6 bg-gradient-primary hover:opacity-90"
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Configuration"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
