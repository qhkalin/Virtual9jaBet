import { useState } from "react";
import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Define leaderboard entry type
type LeaderboardEntry = {
  userId: number;
  username: string;
  totalWinnings: number;
  gamesPlayed: number;
};

export default function LeaderboardPage() {
  const [timeFrame, setTimeFrame] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Fetch leaderboard data
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Top Winners</CardTitle>
                <CardDescription>
                  The highest winners on Virtual9jaBet
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant={timeFrame === 'all' ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setTimeFrame('all')}
                >
                  All Time
                </Button>
                <Button 
                  variant={timeFrame === 'today' ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setTimeFrame('today')}
                >
                  Today
                </Button>
                <Button 
                  variant={timeFrame === 'week' ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setTimeFrame('week')}
                >
                  This Week
                </Button>
                <Button 
                  variant={timeFrame === 'month' ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setTimeFrame('month')}
                >
                  This Month
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No leaderboard data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={entry.userId} 
                    className={`flex items-center p-4 rounded-lg relative ${
                      index === 0 
                        ? 'bg-[#002B5B]/50 border border-[#FFD700]/30' 
                        : 'bg-gray-800/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${
                      index === 0 
                        ? 'bg-[#002B5B] text-[#FFD700]' 
                        : 'bg-gray-700 text-white'
                    } flex items-center justify-center mr-4 font-bold`}>
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium">{entry.username}</p>
                      <p className="text-xs text-gray-400">{entry.gamesPlayed} games played</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#FFD700] font-bold text-lg">₦{entry.totalWinnings.toLocaleString()}</p>
                      <p className="text-xs text-green-500">+₦{Math.floor(entry.totalWinnings * 0.15).toLocaleString()} today</p>
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
