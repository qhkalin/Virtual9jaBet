import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Menu, X } from "lucide-react";
import { useTheme } from "@/hooks/use-dark-mode";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const { setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Change header style on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 w-full ${isScrolled ? 'shadow-lg' : ''} transition-all duration-200`}>
      <div className="bg-primary">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center">
              <span className="font-heading font-bold text-2xl">
                <span className="text-[#FFD700]">Virtual</span>
                <span className="text-white">9ja</span>
                <span className="text-[#FFD700]">Bet</span>
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-white hover:text-[#FFD700] transition-colors">
              Home
            </Link>
            <Link href="/transactions" className="text-white hover:text-[#FFD700] transition-colors">
              Transactions
            </Link>
            <Link href="/leaderboard" className="text-white hover:text-[#FFD700] transition-colors">
              Leaderboard
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden md:block">
                <div className="bg-secondary rounded-lg px-4 py-1.5 shadow-md">
                  <span className="text-sm text-gray-400">Balance:</span>
                  <span className="text-[#FFD700] font-bold">
                    {user.hiddenBalance ? "••••••" : `₦${user.balance?.toLocaleString() || 0}`}
                  </span>
                </div>
              </div>
            )}
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full bg-secondary hover:bg-gray-800 transition">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/deposit")}>
                    Deposit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/withdraw")}>
                    Withdraw
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark Mode
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-md hover:bg-gray-800 transition"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Balance Display */}
        {user && (
          <div className="md:hidden px-4 py-2 bg-primary border-t border-gray-800 shadow-inner">
            <div className="bg-secondary rounded-lg px-4 py-2 shadow-md inline-block">
              <span className="text-sm text-gray-400">Balance:</span>
              <span className="text-[#FFD700] font-bold">
                {user.hiddenBalance ? "••••••" : `₦${user.balance?.toLocaleString() || 0}`}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-secondary border-t border-gray-700 shadow-lg">
          <div className="container mx-auto px-4 py-2 space-y-2">
            <Link href="/" onClick={closeMobileMenu} className="block py-2 px-4 hover:bg-gray-800 rounded">
              Home
            </Link>
            <Link href="/transactions" onClick={closeMobileMenu} className="block py-2 px-4 hover:bg-gray-800 rounded">
              Transactions
            </Link>
            <Link href="/leaderboard" onClick={closeMobileMenu} className="block py-2 px-4 hover:bg-gray-800 rounded">
              Leaderboard
            </Link>
            <Link href="/deposit" onClick={closeMobileMenu} className="block py-2 px-4 hover:bg-gray-800 rounded">
              Deposit
            </Link>
            <Link href="/withdraw" onClick={closeMobileMenu} className="block py-2 px-4 hover:bg-gray-800 rounded">
              Withdraw
            </Link>
            <Link href="/settings" onClick={closeMobileMenu} className="block py-2 px-4 hover:bg-gray-800 rounded">
              Settings
            </Link>
            <button
              onClick={() => {
                handleLogout();
                closeMobileMenu();
              }}
              className="block w-full text-left py-2 px-4 hover:bg-gray-800 rounded text-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
