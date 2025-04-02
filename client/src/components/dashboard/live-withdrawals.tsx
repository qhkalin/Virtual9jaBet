import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

type Withdrawal = {
  id: number;
  amount: number;
  username: string;
  createdAt: string;
};

export default function LiveWithdrawals() {
  // Fetch recent withdrawals
  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals/recent"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // This state will hold the continuous animated list of withdrawals
  const [animatedWithdrawals, setAnimatedWithdrawals] = useState<Withdrawal[]>([]);

  // When withdrawals are loaded, set up the animated list
  useEffect(() => {
    if (!withdrawals || withdrawals.length === 0) {
      // Create demo withdrawals if none are available to showcase the animation
      const demoWithdrawals: Withdrawal[] = [
        { id: 1, username: "Username1", amount: 35000, createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
        { id: 2, username: "Username2", amount: 20000, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        { id: 3, username: "Username3", amount: 50000, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
        { id: 4, username: "Username4", amount: 15000, createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
        { id: 5, username: "Username5", amount: 28000, createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() }
      ];
      
      // Make a repeating list for the infinite scroll effect with demo data
      const repeatedWithdrawals = [...demoWithdrawals, ...demoWithdrawals, ...demoWithdrawals];
      setAnimatedWithdrawals(repeatedWithdrawals);
      return;
    }
    
    // Make a repeating list for the infinite scroll effect
    const repeatedWithdrawals = [...withdrawals, ...withdrawals, ...withdrawals];
    setAnimatedWithdrawals(repeatedWithdrawals);
  }, [withdrawals]);

  // Format username with asterisks for privacy (e.g., "Jam****es")
  const formatUsername = (username: string) => {
    if (username.length <= 5) return username;
    
    const firstPart = username.slice(0, 3);
    const lastPart = username.slice(-2);
    const middlePart = '*'.repeat(username.length - 5);
    
    return `${firstPart}${middlePart}${lastPart}`;
  };

  // Format time for display (e.g., "Just now", "5 minutes ago")
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <Card className="bg-gray-900 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-xl font-heading font-semibold">Live Withdrawals</CardTitle>
          <Badge variant="outline" className="bg-green-500/20 text-green-500 animate-pulse">
            LIVE
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] overflow-hidden relative">
          {isLoading ? (
            <div className="space-y-4 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
            </div>
          ) : !animatedWithdrawals || animatedWithdrawals.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-400">
              No withdrawals available
            </div>
          ) : (
            <div className="animate-marquee">
              {animatedWithdrawals.map((withdrawal, index) => (
                <div key={`${withdrawal.id}-${index}`} className="flex items-center space-x-3 border-b border-gray-800 py-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-[#FFD700]">
                    <User size={18} />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <p className="font-medium">{formatUsername(withdrawal.username)}</p>
                      <p className="text-green-500 font-bold">₦{withdrawal.amount.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-gray-400">{formatTime(withdrawal.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Gradient overlay at the bottom for smooth fade-out effect */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
        </div>
      </CardContent>
    </Card>
  );
}
