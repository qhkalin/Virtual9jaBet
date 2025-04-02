import { useState, useEffect } from "react";
import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

export default function DepositPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<DepositStep>(DepositStep.AMOUNT);
  const [depositId, setDepositId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute in seconds
  
  // Define the deposit state interface for localStorage
  interface DepositState {
    step: DepositStep;
    depositId: number | null;
    timeRemaining: number;
    amount: number;
    expiryTime: number; // Timestamp when the countdown should end
  }
  
  // Load deposit state from localStorage on component mount
  useEffect(() => {
    const loadSavedState = () => {
      try {
        const savedState = localStorage.getItem('depositState');
        if (savedState) {
          const parsedState: DepositState = JSON.parse(savedState);
          
          // Check if state is still valid (not expired)
          if (parsedState.expiryTime > Date.now()) {
            setCurrentStep(parsedState.step);
            setDepositId(parsedState.depositId);
            
            // Calculate remaining time
            const newTimeRemaining = Math.max(0, Math.floor((parsedState.expiryTime - Date.now()) / 1000));
            setTimeRemaining(newTimeRemaining);
            
            if (parsedState.step === DepositStep.WAITING && newTimeRemaining > 0) {
              // Auto-start the countdown (needs to be done after state is fully loaded)
              setTimeout(() => startCountdown(), 0);
            } else if (parsedState.step === DepositStep.WAITING && newTimeRemaining <= 0) {
              // Timer expired, move to verification step
              setCurrentStep(DepositStep.VERIFICATION);
            }
            
            // Set amount in the form
            depositForm.setValue('amount', parsedState.amount);
          } else {
            // Clear expired state
            localStorage.removeItem('depositState');
          }
        }
      } catch (error) {
        console.error('Error loading deposit state from localStorage', error);
        localStorage.removeItem('depositState');
      }
    };
    
    loadSavedState();
  }, []);
  
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
      
      // Clear deposit state from localStorage
      localStorage.removeItem('depositState');
      
      setCurrentStep(DepositStep.AMOUNT);
      toast({
        title: "Deposit successful",
        description: `Your account has been credited with ₦${depositForm.getValues().amount.toLocaleString()}`,
      });
      
      // Reset forms
      depositForm.reset({ amount: 10000 });
      verificationForm.reset({ withdrawalCode: "" });
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
  
  // Start countdown function
  const startCountdown = () => {
    const intervalId = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setCurrentStep(DepositStep.VERIFICATION);
          
          // Update localStorage
          const currentState = JSON.parse(localStorage.getItem('depositState') || '{}');
          localStorage.setItem('depositState', JSON.stringify({
            ...currentState,
            step: DepositStep.VERIFICATION,
            timeRemaining: 0
          }));
          
          return 0;
        }
        
        // Update localStorage with new time
        const currentState = JSON.parse(localStorage.getItem('depositState') || '{}');
        if (currentState.step === DepositStep.WAITING) {
          localStorage.setItem('depositState', JSON.stringify({
            ...currentState,
            timeRemaining: prev - 1
          }));
        }
        
        return prev - 1;
      });
    }, 1000);
    
    return intervalId;
  };
  
  // Handle payment made
  const handlePaymentMade = () => {
    // Set to 1 minute as requested (instead of 3)
    const countdownDuration = 60; // 1 minute in seconds
    setTimeRemaining(countdownDuration);
    setCurrentStep(DepositStep.WAITING);
    
    // Save state to localStorage
    const expiryTime = Date.now() + (countdownDuration * 1000);
    localStorage.setItem('depositState', JSON.stringify({
      step: DepositStep.WAITING,
      depositId,
      timeRemaining: countdownDuration,
      amount: depositForm.getValues().amount,
      expiryTime
    }));
    
    // Start countdown
    startCountdown();
    
    toast({
      title: "Payment notification sent",
      description: "Admin will verify your payment and provide a withdrawal code.",
    });
  };
  
  // Handle verification form submission
  const onVerificationSubmit = (data: z.infer<typeof verificationSchema>) => {
    verifyCodeMutation.mutate(data);
  };
  
  // Format time remaining
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Calculate progress percentage
  const progressPercentage = 100 - Math.floor((timeRemaining / 60) * 100);
  
  return (
    <Layout>
      <div className="container max-w-xl py-8">
        <h1 className="text-3xl font-bold mb-6">Deposit Funds</h1>
        
        {currentStep === DepositStep.AMOUNT && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Deposit Amount</CardTitle>
              <CardDescription>
                Enter the amount you want to deposit (₦1,000 - ₦500,000)
              </CardDescription>
            </CardHeader>
            <form onSubmit={depositForm.handleSubmit(onDepositSubmit)}>
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
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-primary"
                  disabled={createDepositMutation.isPending}
                >
                  {createDepositMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Proceed"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
        
        {currentStep === DepositStep.PAYMENT_DETAILS && (
          <Card>
            <CardHeader>
              <CardTitle>Make Payment</CardTitle>
              <CardDescription>
                Transfer ₦{depositForm.getValues().amount.toLocaleString()} to the company account below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
              
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Make the transfer to the account above.</li>
                    <li>Click "I've Made Payment" after completing your transfer.</li>
                    <li>Admin will verify and approve your deposit within 1 minute.</li>
                    <li>You'll receive a one-time withdrawal code to complete the process.</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-[#FFD700] hover:bg-yellow-600 text-black font-bold"
                onClick={handlePaymentMade}
              >
                I've Made Payment
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {currentStep === DepositStep.WAITING && (
          <Card>
            <CardHeader>
              <CardTitle>Deposit Pending</CardTitle>
              <CardDescription>
                Your deposit request has been sent to admin for verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
                <Clock className="h-12 w-12 text-yellow-500" />
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
            </CardContent>
          </Card>
        )}
        
        {currentStep === DepositStep.VERIFICATION && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Withdrawal Code</CardTitle>
              <CardDescription>
                Enter the one-time withdrawal code provided by admin
              </CardDescription>
            </CardHeader>
            <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)}>
              <CardContent className="space-y-4">
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
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-primary"
                  disabled={verifyCodeMutation.isPending}
                >
                  {verifyCodeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Complete Deposit"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </Layout>
  );
}
