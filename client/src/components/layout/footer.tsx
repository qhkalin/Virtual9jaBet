import { Link } from "wouter";
import { useEffect, useState } from "react";

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-primary py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#FFD700]">Virtual9jaBet</h3>
            <p className="text-gray-400 text-sm">The premier online betting platform in Nigeria. Test your luck and win big with our exciting games!</p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#FFD700]">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white text-sm">Home</Link></li>
              <li><Link href="/deposit" className="text-gray-400 hover:text-white text-sm">Deposit</Link></li>
              <li><Link href="/withdraw" className="text-gray-400 hover:text-white text-sm">Withdraw</Link></li>
              <li><Link href="/transactions" className="text-gray-400 hover:text-white text-sm">Transactions</Link></li>
              <li><Link href="/leaderboard" className="text-gray-400 hover:text-white text-sm">Leaderboard</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#FFD700]">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Terms & Conditions</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-[#FFD700]">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-[#FFD700] hover:text-black transition">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-[#FFD700] hover:text-black transition">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-[#FFD700] hover:text-black transition">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-[#FFD700] hover:text-black transition">
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
            <p className="text-gray-400 text-sm">Email: support@virtual9jabet.com</p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} Virtual9jaBet. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
