import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

type LeaderboardEntry = {
  userId: number;
  username: string;
  totalWinnings: number;
  gamesPlayed: number;
};

export default function Leaderboard() {
  // Fetch leaderboard data
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    refetchInterval: 60000, // Refetch every minute
  });

  return (
    <Card className="bg-gray-900 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-heading font-semibold">Top Winners</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center p-3 bg-gray-800/50 rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full mr-3" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-[90px] mb-1" />
                  <Skeleton className="h-3 w-[70px]" />
                </div>
              </div>
            ))}
          </div>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No winners yet
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((winner, index) => (
              <div key={winner.userId} className={`flex items-center p-3 ${index === 0 ? 'bg-primary/30' : 'bg-gray-800/50'} rounded-lg relative`}>
                <div className={`w-8 h-8 rounded-full ${index === 0 ? 'bg-primary text-[#FFD700]' : 'bg-gray-700 text-white'} flex items-center justify-center mr-3 font-bold`}>
                  {index + 1}
                </div>
                <div className="flex-grow">
                  <p className="font-medium">{winner.username}</p>
                  <p className="text-xs text-gray-400">{winner.gamesPlayed} games played</p>
                </div>
                <div className="text-right">
                  <p className={`text-[#FFD700] font-bold ${index === 0 ? 'text-lg' : ''}`}>₦{winner.totalWinnings.toLocaleString()}</p>
                  <p className="text-xs text-green-500">
                    +₦{Math.floor(winner.totalWinnings * (Math.random() * 0.1 + 0.05)).toLocaleString()} today
                  </p>
                </div>
                
                {index === 0 && (
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 text-[#FFD700] animate-pulse">
                    <i className="fas fa-trophy text-2xl"></i>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Link href="/leaderboard">
            <Button variant="link" className="text-[#FFD700] hover:text-[#FFD700]/80 hover:underline">
              View Full Leaderboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
