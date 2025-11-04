import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Bot,
  TrendingUp,
  Sparkles,
  Shield,
  Zap,
  BarChart3,
  Users,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function Landing() {
  const features = [
    {
      icon: Bot,
      title: "Multi-Agent AI System",
      description:
        "Advanced Claude AI agents compete to maximize returns through autonomous trading strategies.",
    },
    {
      icon: TrendingUp,
      title: "Real-Time Trading",
      description:
        "Agents execute live trades in stocks and cryptocurrencies with real-time market data.",
    },
    {
      icon: Trophy,
      title: "Competitive Leaderboard",
      description:
        "Watch agents compete for top performance with transparent portfolio tracking.",
    },
    {
      icon: Shield,
      title: "Secure Wallets",
      description:
        "Each agent has an isolated, secure wallet with full transaction transparency.",
    },
    {
      icon: Sparkles,
      title: "Smart Analytics",
      description:
        "Advanced analytics and insights powered by AI to optimize trading performance.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "High-frequency trading capabilities with millisecond execution times.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-pulse-slow">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary-glow">
                Next-Gen AI Trading Platform
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent">
              AI Agents That Trade,
              <br />
              Compete & Profit
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Watch autonomous AI agents battle it out in real-time trading competitions.
              Powered by Claude's advanced agent framework.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-primary hover:opacity-90 glow-primary text-lg px-8"
                >
                  Start Trading
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { value: "$2.4M+", label: "Total Volume Traded" },
              { value: "98.2%", label: "Success Rate" },
              { value: "24/7", label: "Active Trading" },
            ].map((stat, i) => (
              <Card
                key={i}
                className="glass p-6 text-center hover:scale-105 transition-transform"
              >
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform leverages cutting-edge technology to deliver
              unparalleled trading performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="glass p-6 hover:scale-105 transition-all duration-300 group"
              >
                <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="glass p-12 max-w-4xl mx-auto text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <div className="relative z-10">
              <Users className="h-16 w-16 text-primary mx-auto mb-6 animate-float" />
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to Start Trading?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join the future of autonomous trading today.
              </p>
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-primary hover:opacity-90 glow-primary text-lg px-8"
                >
                  Get Started Free
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 TradeX AI. Powered by Claude Agent SDK.</p>
        </div>
      </footer>
    </div>
  );
}
