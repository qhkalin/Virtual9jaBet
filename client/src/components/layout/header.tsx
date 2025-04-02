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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Safely use theme, with fallback if context is not available
  let themeContext;
  try {
    themeContext = useTheme();
  } catch (error) {
    themeContext = { theme: 'dark', setTheme: () => {} };
  }
  const { setTheme } = themeContext;

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
    <header className={`sticky top-0 z-50 w-full ${isScrolled ? 'shadow-lg' : ''} transition-all duration-200`} style={{ height: '100%' }}>
      <div style={{ backgroundColor: '#0E2E5C', height: '100%' }}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center">
              <img src="/logo.svg" alt="Virtual9jaBet Logo" className="h-10 mr-2" />
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
                <div className="rounded-lg px-4 py-1.5 shadow-sm" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <span className="text-sm text-gray-300">Balance:</span>
                  <span className="text-[#FFD700] font-bold ml-1">
                    {user.hiddenBalance ? "••••••" : `₦${user.balance?.toLocaleString() || 0}`}
                  </span>
                </div>
              </div>
            )}
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" className="rounded-full bg-[#FFD700] hover:brightness-110 transition p-0 h-9 w-9">
                    <User className="h-5 w-5 text-[#0E2E5C]" />
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
              className="md:hidden rounded-full bg-[#FFD700] hover:brightness-110 transition p-0 h-9 w-9"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? 
                <X className="h-5 w-5 text-[#0E2E5C]" /> : 
                <Menu className="h-5 w-5 text-[#0E2E5C]" />
              }
            </Button>
          </div>
        </div>
        
        {/* Mobile Balance Display */}
        {user && (
          <div className="md:hidden px-4 py-2" style={{ backgroundColor: '#0E2E5C', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="rounded-lg px-4 py-2 shadow-sm inline-block" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <span className="text-sm text-gray-300">Balance:</span>
              <span className="text-[#FFD700] font-bold ml-1">
                {user.hiddenBalance ? "••••••" : `₦${user.balance?.toLocaleString() || 0}`}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" style={{ backgroundColor: '#071834', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="container mx-auto px-4 py-2 space-y-2">
            <Link href="/" onClick={closeMobileMenu} className="block py-2 px-4 hover:bg-opacity-20 hover:bg-white text-white rounded">
              Home
            </Link>
            <Link href="/transactions" onClick={closeMobileMenu} className="block py-2 px-4 hover:bg-opacity-20 hover:bg-white text-white rounded">
              Transactions
            </Link>
            <Link href="/leaderboard" onClick={closeMobileMenu} className="block py-2 px-4 hover:bg-opacity-20 hover:bg-white text-white rounded">
              Leaderboard
            </Link>
            <Link href="/deposit" onClick={closeMobileMenu} className="block py-2 px-4 hover:bg-opacity-20 hover:bg-white text-white rounded">
              Deposit
            </Link>
            <Link href="/withdraw" onClick={closeMobileMenu} className="block py-2 px-4 hover:bg-opacity-20 hover:bg-white text-white rounded">
              Withdraw
            </Link>
            <Link href="/settings" onClick={closeMobileMenu} className="block py-2 px-4 hover:bg-opacity-20 hover:bg-white text-white rounded">
              Settings
            </Link>
            <button
              onClick={() => {
                handleLogout();
                closeMobileMenu();
              }}
              className="block w-full text-left py-2 px-4 hover:bg-opacity-20 hover:bg-white rounded text-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
