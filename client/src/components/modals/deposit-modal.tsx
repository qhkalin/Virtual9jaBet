import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Step enum
enum DepositStep {
  AMOUNT,
  PAYMENT_DETAILS,
  WAITING,
  VERIFICATION,
}

// Deposit schema
const depositSchema = z.object({
  amount: z.number()
    .min(1000, "Minimum deposit amount is ₦1,000")
    .max(500000, "Maximum deposit amount is ₦500,000"),
});

// Verification schema
const verificationSchema = z.object({
  withdrawalCode: z.string().min(4, "Withdrawal code is required"),
});

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<DepositStep>(DepositStep.AMOUNT);
  const [depositId, setDepositId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(3 * 60); // 3 minutes in seconds
  
  // Deposit form
  const depositForm = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 10000,
    },
  });
  
  // Verification form
  const verificationForm = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      withdrawalCode: "",
    },
  });
  
  // Create deposit mutation
  const createDepositMutation = useMutation({
    mutationFn: async (data: z.infer<typeof depositSchema>) => {
      const res = await apiRequest("POST", "/api/deposits", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setDepositId(data.id);
      setCurrentStep(DepositStep.PAYMENT_DETAILS);
      toast({
        title: "Deposit created",
        description: "Please transfer the deposit amount to the company account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deposit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Verify withdrawal code mutation
  const verifyCodeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof verificationSchema>) => {
      const res = await apiRequest("POST", "/api/deposits/verify", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Deposit successful",
        description: `Your account has been credited with ₦${depositForm.getValues().amount.toLocaleString()}`,
      });
      
      // Reset state
      resetState();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle deposit form submission
  const onDepositSubmit = (data: z.infer<typeof depositSchema>) => {
    createDepositMutation.mutate(data);
  };
  
  // Handle payment made
  const handlePaymentMade = () => {
    setCurrentStep(DepositStep.WAITING);
    setTimeRemaining(3 * 60); // Ensure we start with full 3 minutes
    
    // Start countdown timer
    const intervalId = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setCurrentStep(DepositStep.VERIFICATION);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    toast({
      title: "Payment notification sent",
      description: "Admin will verify your payment and provide a withdrawal code.",
    });
  };
  
  // Handle verification form submission
  const onVerificationSubmit = (data: z.infer<typeof verificationSchema>) => {
    verifyCodeMutation.mutate(data);
  };
  
  // Reset state when modal closes
  const resetState = () => {
    setCurrentStep(DepositStep.AMOUNT);
    setDepositId(null);
    setTimeRemaining(3 * 60);
    depositForm.reset({ amount: 10000 });
    verificationForm.reset({ withdrawalCode: "" });
  };
  
  // Format time remaining
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Calculate progress percentage
  const progressPercentage = 100 - Math.floor((timeRemaining / (3 * 60)) * 100);
  
  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetState();
        onClose();
      }
    }}>
      <DialogContent className="bg-gray-900 max-w-md">
        {currentStep === DepositStep.AMOUNT && (
          <>
            <DialogHeader>
              <DialogTitle>Enter Deposit Amount</DialogTitle>
              <DialogDescription>
                Enter the amount you want to deposit (₦1,000 - ₦500,000)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={depositForm.handleSubmit(onDepositSubmit)}>
              <div className="space-y-4 py-4">
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
                      {...depositForm.register("amount", { valueAsNumber: true })}
                      className="flex-grow bg-gray-800 text-white border-y border-r border-gray-700 rounded-r-lg"
                    />
                  </div>
                  {depositForm.formState.errors.amount && (
                    <p className="text-sm text-destructive">{depositForm.formState.errors.amount.message}</p>
                  )}
                </div>
                
                <div className="flex justify-between space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                    onClick={() => depositForm.setValue("amount", 5000)}
                  >
                    ₦5,000
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                    onClick={() => depositForm.setValue("amount", 10000)}
                  >
                    ₦10,000
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                    onClick={() => depositForm.setValue("amount", 20000)}
                  >
                    ₦20,000
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-primary"
                  disabled={createDepositMutation.isPending}
                >
                  {createDepositMutation.isPending ? "Processing..." : "Proceed"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
        
        {currentStep === DepositStep.PAYMENT_DETAILS && (
          <>
            <DialogHeader>
              <DialogTitle>Make Payment</DialogTitle>
              <DialogDescription>
                Transfer ₦{depositForm.getValues().amount.toLocaleString()} to the company account below
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-[#FFD700]">Company Account Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bank:</span>
                    <span className="font-medium">OPay</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Number:</span>
                    <span className="font-medium">6100827551</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Name:</span>
                    <span className="font-medium">OMOBANKE JUMOKE ADEKAYERO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="font-medium text-[#FFD700]">₦{depositForm.getValues().amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Make the transfer to the account above.</li>
                    <li>Click "I've Made Payment" after completing your transfer.</li>
                    <li>Admin will verify and approve your deposit within 3 minutes.</li>
                    <li>You'll receive a one-time withdrawal code to complete the process.</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button 
                className="w-full bg-[#FFD700] hover:bg-yellow-600 text-black font-bold"
                onClick={handlePaymentMade}
              >
                I've Made Payment
              </Button>
            </DialogFooter>
          </>
        )}
        
        {currentStep === DepositStep.WAITING && (
          <>
            <DialogHeader>
              <DialogTitle>Deposit Pending</DialogTitle>
              <DialogDescription>
                Your deposit request has been sent to admin for verification
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6 text-center">
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
                <Clock className="h-10 w-10 text-yellow-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-2">Awaiting Confirmation</h3>
                <p className="text-gray-400 mb-4">Admin is verifying your deposit</p>
              </div>
              
              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-sm text-gray-400">
                  Time remaining: <span className="font-bold">{formatTimeRemaining()}</span>
                </p>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Next Step</AlertTitle>
                <AlertDescription className="text-sm">
                  After verification, you'll receive a one-time withdrawal code to complete your deposit.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
        
        {currentStep === DepositStep.VERIFICATION && (
          <>
            <DialogHeader>
              <DialogTitle>Enter Withdrawal Code</DialogTitle>
              <DialogDescription>
                Enter the one-time withdrawal code provided by admin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)}>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawalCode">Withdrawal Code</Label>
                  <Input
                    id="withdrawalCode"
                    placeholder="Enter your withdrawal code"
                    {...verificationForm.register("withdrawalCode")}
                  />
                  {verificationForm.formState.errors.withdrawalCode && (
                    <p className="text-sm text-destructive">{verificationForm.formState.errors.withdrawalCode.message}</p>
                  )}
                </div>
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Ready to Complete</AlertTitle>
                  <AlertDescription className="text-sm">
                    Enter the withdrawal code you received from admin to complete your deposit.
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-primary"
                  disabled={verifyCodeMutation.isPending}
                >
                  {verifyCodeMutation.isPending ? "Verifying..." : "Complete Deposit"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
