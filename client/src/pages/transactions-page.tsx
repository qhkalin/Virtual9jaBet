import { useState } from "react";
import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

// Define type for transaction
type Transaction = {
  id: number;
  type: string;
  amount: number;
  status: string;
  details: string;
  createdAt: string;
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  // Filter transactions based on active tab
  const getFilteredTransactions = () => {
    if (!transactions) return [];
    
    switch (activeTab) {
      case "deposits":
        return transactions.filter(t => t.type === "deposit");
      case "withdrawals":
        return transactions.filter(t => t.type === "withdrawal");
      case "games":
        return transactions.filter(t => t.type === "game_win" || t.type === "game_loss");
      case "all":
      default:
        return transactions;
    }
  };

  const filteredTransactions = getFilteredTransactions();

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy HH:mm");
    } catch (e) {
      return dateString;
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

  // Helper function to format transaction amount with prefix
  const formatAmount = (type: string, amount: number) => {
    const isPositive = ["deposit", "game_win", "referral_bonus", "signup_bonus"].includes(type);
    const prefix = isPositive ? "+" : "-";
    return `${prefix}₦${amount.toLocaleString()}`;
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-500 hover:bg-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-500 hover:bg-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30";
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

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Transaction History</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Transactions</CardTitle>
            <CardDescription>
              View your complete transaction history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="deposits">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                <TabsTrigger value="games">Games</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>No transactions found</p>
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
                          <th className="pb-2">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => {
                          const { icon, bgColor, textColor } = getTransactionIconAndColor(transaction.type);
                          const amountText = formatAmount(transaction.type, transaction.amount);
                          const amountColor = ["deposit", "game_win", "referral_bonus", "signup_bonus"].includes(transaction.type) 
                            ? "text-green-500" 
                            : "text-red-500";
                          
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
                                <Badge className={getStatusBadgeClass(transaction.status)}>
                                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-3 text-gray-400">{formatDate(transaction.createdAt)}</td>
                              <td className="py-3 text-gray-400">{transaction.details}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
