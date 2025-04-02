import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function useSpinGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(1000);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [spinError, setSpinError] = useState<string | null>(null);

  // Spin game mutation
  const spinMutation = useMutation({
    mutationFn: async (data: { selectedNumber: number; betAmount: number }) => {
      const res = await apiRequest("POST", "/api/games", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Set spin result
      setSpinResult(data.resultNumber);
      
      // Show appropriate modal after spin animation
      setTimeout(() => {
        if (data.isWin) {
          setWinAmount(data.winAmount);
          setShowWinModal(true);
        } else {
          setShowLoseModal(true);
        }
        setIsSpinning(false);
      }, 5000); // Same as spin animation duration
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      toast({
        title: "Spin failed",
        description: errorMessage,
        variant: "destructive",
      });
      setSpinError(errorMessage);
      setIsSpinning(false);
    },
  });

  // Handle spin action
  const handleSpin = () => {
    // Clear any previous errors
    setSpinError(null);
    
    if (!user) {
      const errorMessage = "Please log in to play the game";
      toast({
        title: "Not logged in",
        description: errorMessage,
        variant: "destructive",
      });
      setSpinError(errorMessage);
      return;
    }

    if (!selectedNumber) {
      const errorMessage = "Please select a number to bet on";
      toast({
        title: "Select a number",
        description: errorMessage,
        variant: "destructive",
      });
      setSpinError(errorMessage);
      return;
    }

    if (betAmount <= 0) {
      const errorMessage = "Please enter a valid bet amount";
      toast({
        title: "Invalid bet amount",
        description: errorMessage,
        variant: "destructive",
      });
      setSpinError(errorMessage);
      return;
    }

    if (betAmount > (user.balance || 0)) {
      const errorMessage = `Your current balance is ₦${user.balance?.toLocaleString() || 0}`;
      toast({
        title: "Insufficient balance",
        description: errorMessage,
        variant: "destructive",
      });
      setSpinError(errorMessage);
      return;
    }

    setIsSpinning(true);
    spinMutation.mutate({ selectedNumber, betAmount });
  };

  // Reset spin state
  const resetSpin = () => {
    setSpinResult(null);
    setShowWinModal(false);
    setShowLoseModal(false);
    setWinAmount(null);
    setSpinError(null);
  };

  return {
    selectedNumber,
    setSelectedNumber,
    betAmount,
    setBetAmount,
    isSpinning,
    spinResult,
    resetSpin,
    handleSpin,
    showWinModal,
    showLoseModal,
    setShowWinModal,
    setShowLoseModal,
    winAmount,
    spinError,
    setSpinError,
  };
}
