import { useEffect, useState } from "react";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import SpinWheel from "@/components/game/spin-wheel";
import NumberSelector from "@/components/game/number-selector";
import RecentActivity from "@/components/dashboard/recent-activity";
import LiveWithdrawals from "@/components/dashboard/live-withdrawals";
import Leaderboard from "@/components/dashboard/leaderboard";
import WinModal from "@/components/modals/win-modal";
import LoseModal from "@/components/modals/lose-modal";
import DepositModal from "@/components/modals/deposit-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Wallet, CircleDollarSign } from "lucide-react";
import { useSpinGame } from "@/lib/use-spin-game";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showDepositModal, setShowDepositModal] = useState(false);
  
  const {
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
    setSpinError
  } = useSpinGame();

  // Quick bet buttons
  const handleQuickBet = (amount: number) => {
    setBetAmount(amount);
  };

  return (
    <Layout>
      {/* Welcome Banner */}
      <div className="mb-6 rounded-xl p-6 shadow-lg" style={{ backgroundColor: 'rgba(20, 54, 104, 0.6)' }}>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Welcome to <span className="text-[#FFD700]">Virtual9jaBet</span>
            </h1>
            <p className="text-gray-300">Try your luck with our exciting spin game!</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button 
              className="btn-primary py-2 px-8 rounded-full transition transform hover:scale-105"
              onClick={() => setShowDepositModal(true)}
            >
              Play Now
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Spin Game */}
          <div className="game-container">
            <h2 className="text-xl font-bold mb-6 text-center text-white">Spin & Win</h2>
            
            <div className="flex flex-col items-center justify-center">
              <SpinWheel 
                isSpinning={isSpinning} 
                spinResult={spinResult} 
                selectedNumber={selectedNumber}
              />
              
              <div className="w-full max-w-md mt-6">
                <div className="flex flex-col space-y-4">
                  <div>
                    <Label className="block text-gray-200 mb-2">Choose a Number</Label>
                    <NumberSelector 
                      selectedNumber={selectedNumber} 
                      onSelect={setSelectedNumber} 
                      disabled={isSpinning}
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-gray-200 mb-2">Bet Amount</Label>
                    <div className="flex">
                      <div className="w-16 flex items-center justify-center rounded-l-lg" 
                        style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                        <span className="text-[#FFD700] font-semibold">₦</span>
                      </div>
                      <Input
                        type="number"
                        min="100"
                        max="500000"
                        step="100"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="flex-grow text-white rounded-r-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#FFD700]"
                        style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}
                        disabled={isSpinning}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between space-x-4">
                    <Button
                      variant="outline"
                      className="w-1/3 hover:bg-opacity-20 hover:bg-white text-white border-gray-600"
                      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                      onClick={() => handleQuickBet(500)}
                      disabled={isSpinning}
                    >
                      ₦500
                    </Button>
                    <Button
                      variant="outline"
                      className="w-1/3 hover:bg-opacity-20 hover:bg-white text-white border-gray-600"
                      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                      onClick={() => handleQuickBet(1000)}
                      disabled={isSpinning}
                    >
                      ₦1,000
                    </Button>
                    <Button
                      variant="outline"
                      className="w-1/3 hover:bg-opacity-20 hover:bg-white text-white border-gray-600"
                      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                      onClick={() => handleQuickBet(5000)}
                      disabled={isSpinning}
                    >
                      ₦5,000
                    </Button>
                  </div>
                  
                  <Button 
                    className="w-full bg-[#FFD700] hover:brightness-110 text-[#0E2E5C] font-bold py-3 px-4 rounded-lg transition transform hover:scale-105"
                    onClick={handleSpin}
                    disabled={isSpinning || !selectedNumber || betAmount <= 0}
                  >
                    {isSpinning ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-[#0E2E5C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        SPINNING...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        SPIN NOW
                      </span>
                    )}
                  </Button>
                  
                  {/* Error message display */}
                  {spinError && (
                    <div className="mt-4 bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded-md flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium">Spin Error</p>
                        <p className="text-sm">{spinError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Activity */}
          <RecentActivity />
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Withdrawals */}
          <LiveWithdrawals />
          
          {/* Leaderboard */}
          <Leaderboard />
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              className="p-4 h-auto rounded-lg flex flex-col items-center justify-center transition transform hover:scale-105 hover:opacity-90"
              style={{ backgroundColor: 'rgba(20, 54, 104, 0.6)' }}
              onClick={() => navigate("/deposit")}
            >
              <Wallet className="h-6 w-6 mb-2 text-[#FFD700]" />
              <span className="text-white">Deposit</span>
            </Button>
            <Button 
              className="p-4 h-auto rounded-lg flex flex-col items-center justify-center transition transform hover:scale-105 hover:opacity-90"
              style={{ backgroundColor: 'rgba(20, 54, 104, 0.6)' }}
              onClick={() => navigate("/withdraw")}
            >
              <CircleDollarSign className="h-6 w-6 mb-2 text-[#FFD700]" />
              <span className="text-white">Withdraw</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <WinModal 
        isOpen={showWinModal} 
        onClose={() => setShowWinModal(false)} 
        amount={winAmount || 0} 
      />
      
      <LoseModal 
        isOpen={showLoseModal} 
        onClose={() => setShowLoseModal(false)} 
      />
      
      <DepositModal 
        isOpen={showDepositModal} 
        onClose={() => setShowDepositModal(false)} 
      />
    </Layout>
  );
}
