import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";

type Transaction = {
  id: number;
  type: string;
  amount: number;
  status: string;
  details: string;
  createdAt: string;
};

export default function RecentActivity() {
  const { user } = useAuth();

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  const getRecentTransactions = () => {
    if (!transactions) return [];
    return transactions.slice(0, 4); // Get the 4 most recent transactions
  };

  const recentTransactions = getRecentTransactions();

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      if (diffHours < 1) {
        return 'Just now';
      }
      const hours = Math.floor(diffHours);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  // Helper function to get transaction icon and color
  const getTransactionIconAndColor = (type: string) => {
    switch (type) {
      case "deposit":
        return {
          icon: "fas fa-wallet",
          bgColor: "bg-blue-500/20",
          textColor: "text-blue-500"
        };
      case "withdrawal":
        return {
          icon: "fas fa-money-bill-wave",
          bgColor: "bg-yellow-500/20",
          textColor: "text-yellow-500"
        };
      case "game_win":
        return {
          icon: "fas fa-gamepad",
          bgColor: "bg-green-500/20",
          textColor: "text-green-500"
        };
      case "game_loss":
        return {
          icon: "fas fa-gamepad",
          bgColor: "bg-red-500/20", 
          textColor: "text-red-500"
        };
      case "referral_bonus":
        return {
          icon: "fas fa-user-friends",
          bgColor: "bg-purple-500/20",
          textColor: "text-purple-500"
        };
      case "signup_bonus":
        return {
          icon: "fas fa-gift",
          bgColor: "bg-green-500/20",
          textColor: "text-green-500"
        };
      default:
        return {
          icon: "fas fa-exchange-alt",
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-500"
        };
    }
  };

  // Helper function to format transaction type for display
  const formatTransactionType = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposit";
      case "withdrawal":
        return "Withdrawal";
      case "game_win":
        return "Game Win";
      case "game_loss":
        return "Game Loss";
      case "referral_bonus":
        return "Referral Bonus";
      case "signup_bonus":
        return "Signup Bonus";
      default:
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  // Helper function to format amount with prefix
  const formatAmount = (type: string, amount: number) => {
    const isPositive = ["deposit", "game_win", "referral_bonus", "signup_bonus"].includes(type);
    const prefix = isPositive ? "+" : "-";
    const color = isPositive ? "text-green-500" : "text-red-500";
    return { text: `${prefix}₦${amount.toLocaleString()}`, color };
  };

  return (
    <Card className="bg-gray-900 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-heading font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[160px]" />
                </div>
              </div>
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => {
                  const { icon, bgColor, textColor } = getTransactionIconAndColor(transaction.type);
                  const { text: amountText, color: amountColor } = formatAmount(transaction.type, transaction.amount);
                  
                  return (
                    <tr key={transaction.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 flex items-center">
                        <span className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center mr-2`}>
                          <i className={`${icon} ${textColor}`}></i>
                        </span>
                        <span>{formatTransactionType(transaction.type)}</span>
                      </td>
                      <td className={`py-3 ${amountColor}`}>{amountText}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                          transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400">{formatDate(transaction.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Link href="/transactions">
            <Button variant="link" className="text-[#FFD700] hover:text-[#FFD700]/80 hover:underline">
              View All Transactions
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
