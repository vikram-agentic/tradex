import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Bot, TrendingUp, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isHome = location.pathname === "/";
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/");
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/40 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Bot className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <TrendingUp className="h-4 w-4 text-success absolute -bottom-1 -right-1" />
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            TradeX AI
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-primary hover:opacity-90">
                  Get Started
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
