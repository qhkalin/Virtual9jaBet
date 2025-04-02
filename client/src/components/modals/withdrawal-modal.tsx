import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Loader2 } from "lucide-react";
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

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  
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
      setIsSuccess(true);
      toast({
        title: "Withdrawal requested",
        description: `Your withdrawal request of ₦${withdrawalForm.getValues().amount.toLocaleString()} has been submitted.`,
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
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof withdrawalSchema>) => {
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
  
  // Reset state when modal closes
  const handleClose = () => {
    setIsSuccess(false);
    withdrawalForm.reset({
      amount: 5000,
      bankName: user?.bankName || "",
      accountNumber: user?.accountNumber || "",
      accountName: user?.accountName || "",
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 max-w-md">
        {isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle>Withdrawal Requested</DialogTitle>
              <DialogDescription>
                Your withdrawal request has been submitted
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-2">Withdrawal Processing</h3>
                <p className="text-gray-400">
                  Your withdrawal request of ₦{withdrawalForm.getValues().amount.toLocaleString()} has been submitted.
                </p>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Next Steps</AlertTitle>
                <AlertDescription className="text-sm">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Admin will process your withdrawal within 5 hours.</li>
                    <li>You'll receive a "Payment Withdrawal Confirm" status within 24 hours.</li>
                    <li>The funds will be transferred to your bank account.</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button className="w-full bg-primary" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Withdraw Funds</DialogTitle>
              <DialogDescription>
                Enter the amount and bank details for your withdrawal
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={withdrawalForm.handleSubmit(onSubmit)}>
              <div className="py-4 space-y-4">
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
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-primary"
                  disabled={createWithdrawalMutation.isPending}
                >
                  {createWithdrawalMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Request Withdrawal"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
