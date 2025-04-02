import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  CreditCard, 
  DollarSign, 
  History, 
  Trophy, 
  Settings, 
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="h-screen w-64 border-r border-border fixed top-0 left-0 pt-16 bg-background">
      <ScrollArea className="h-full py-6 px-2">
        <div className="space-y-1 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Menu</h2>
          
          <Link href="/">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                location === "/" && "bg-accent text-accent-foreground"
              )}
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          
          <Link href="/deposit">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                location === "/deposit" && "bg-accent text-accent-foreground"
              )}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Deposit
            </Button>
          </Link>
          
          <Link href="/withdraw">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                location === "/withdraw" && "bg-accent text-accent-foreground"
              )}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </Link>
          
          <Link href="/transactions">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                location === "/transactions" && "bg-accent text-accent-foreground"
              )}
            >
              <History className="mr-2 h-4 w-4" />
              Transactions
            </Button>
          </Link>
          
          <Link href="/leaderboard">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                location === "/leaderboard" && "bg-accent text-accent-foreground"
              )}
            >
              <Trophy className="mr-2 h-4 w-4" />
              Leaderboard
            </Button>
          </Link>
        </div>
        
        <div className="py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Account</h2>
          <div className="space-y-1">
            <Link href="/settings">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  location === "/settings" && "bg-accent text-accent-foreground"
                )}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
        
        {user && (
          <div className="mt-6 px-3">
            <div className="rounded-lg bg-primary/10 p-4">
              <h3 className="text-sm font-medium text-foreground">Referral Program</h3>
              <p className="mt-1 text-xs text-muted-foreground">Share your code and earn ₦1,500</p>
              <div className="mt-2 bg-background/50 rounded p-2 flex justify-between items-center">
                <code className="text-xs font-mono text-[#FFD700]">{user.referralCode}</code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(user.referralCode || '');
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-4 w-4"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
