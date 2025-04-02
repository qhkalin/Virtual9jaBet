import { useState } from "react";
import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Withdrawal schema
const withdrawalSchema = z.object({
  amount: z.number()
    .min(1000, "Minimum withdrawal amount is ₦1,000")
    .max(500000, "Maximum withdrawal amount is ₦500,000"),
  bankName: z.string().min(3, "Bank name is required"),
  accountNumber: z.string().min(10, "Account number must be at least 10 digits"),
  accountName: z.string().min(3, "Account name is required"),
});

export default function WithdrawPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  
  // Get user saved bank details
  const { data: transactions } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  // Get pending withdrawals
  const pendingWithdrawals = transactions?.filter(t => 
    t.type === "withdrawal" && t.status === "pending"
  ) || [];
  
  // Withdrawal form
  const withdrawalForm = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 5000,
      bankName: user?.bankName || "",
      accountNumber: user?.accountNumber || "",
      accountName: user?.accountName || "",
    },
  });
  
  // Create withdrawal mutation
  const createWithdrawalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof withdrawalSchema>) => {
      const res = await apiRequest("POST", "/api/withdrawals", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setIsPending(true);
      toast({
        title: "Withdrawal requested",
        description: `Your withdrawal request of ₦${withdrawalForm.getValues().amount.toLocaleString()} has been submitted.`,
      });
      
      // Reset form
      withdrawalForm.reset({
        amount: 5000,
        bankName: user?.bankName || "",
        accountNumber: user?.accountNumber || "",
        accountName: user?.accountName || "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle withdrawal form submission
  const onWithdrawalSubmit = (data: z.infer<typeof withdrawalSchema>) => {
    if (!user) return;
    
    if (data.amount > (user.balance || 0)) {
      toast({
        title: "Insufficient balance",
        description: `Your current balance is ₦${user.balance?.toLocaleString() || 0}`,
        variant: "destructive",
      });
      return;
    }
    
    createWithdrawalMutation.mutate(data);
  };
  
  return (
    <Layout>
      <div className="container max-w-xl py-8">
        <h1 className="text-3xl font-bold mb-6">Withdraw Funds</h1>
        
        {pendingWithdrawals.length > 0 && (
          <Alert className="mb-6 bg-yellow-900/20 border-yellow-700">
            <Clock className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-500">Pending Withdrawal</AlertTitle>
            <AlertDescription>
              You have {pendingWithdrawals.length} pending withdrawal request{pendingWithdrawals.length > 1 ? 's' : ''}. 
              Admin will process your withdrawal within 5 hours.
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Request Withdrawal</CardTitle>
            <CardDescription>
              Enter the amount and bank details for your withdrawal
            </CardDescription>
          </CardHeader>
          <form onSubmit={withdrawalForm.handleSubmit(onWithdrawalSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <div className="flex">
                  <div className="w-16 bg-gray-800 flex items-center justify-center rounded-l-lg border-y border-l border-gray-700">
                    <span className="text-[#FFD700] font-semibold">₦</span>
                  </div>
                  <Input
                    id="amount"
                    type="number"
                    min={1000}
                    max={500000}
                    step={1000}
                    {...withdrawalForm.register("amount", { valueAsNumber: true })}
                    className="flex-grow bg-gray-800 text-white border-y border-r border-gray-700 rounded-r-lg"
                  />
                </div>
                {withdrawalForm.formState.errors.amount && (
                  <p className="text-sm text-destructive">{withdrawalForm.formState.errors.amount.message}</p>
                )}
              </div>
              
              <div className="flex justify-between space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                  onClick={() => withdrawalForm.setValue("amount", 5000)}
                >
                  ₦5,000
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                  onClick={() => withdrawalForm.setValue("amount", 10000)}
                >
                  ₦10,000
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                  onClick={() => withdrawalForm.setValue("amount", 20000)}
                >
                  ₦20,000
                </Button>
              </div>
              
              <div className="pt-4 border-t border-gray-800">
                <h3 className="font-medium mb-3">Bank Details</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      placeholder="Enter your bank name"
                      {...withdrawalForm.register("bankName")}
                    />
                    {withdrawalForm.formState.errors.bankName && (
                      <p className="text-sm text-destructive">{withdrawalForm.formState.errors.bankName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="Enter your account number"
                      {...withdrawalForm.register("accountNumber")}
                    />
                    {withdrawalForm.formState.errors.accountNumber && (
                      <p className="text-sm text-destructive">{withdrawalForm.formState.errors.accountNumber.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      placeholder="Enter the account name"
                      {...withdrawalForm.register("accountName")}
                    />
                    {withdrawalForm.formState.errors.accountName && (
                      <p className="text-sm text-destructive">{withdrawalForm.formState.errors.accountName.message}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription className="text-sm">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Admin processes withdrawals manually within 5 hours.</li>
                    <li>You'll receive a "Payment Withdrawal Confirm" status within 24 hours.</li>
                    <li>Make sure your bank details are correct to avoid delays.</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-primary"
                disabled={createWithdrawalMutation.isPending || pendingWithdrawals.length > 0}
              >
                {createWithdrawalMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : pendingWithdrawals.length > 0 ? (
                  "Withdrawal Pending"
                ) : (
                  "Request Withdrawal"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
