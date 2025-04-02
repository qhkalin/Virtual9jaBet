import { ReactNode } from "react";
import Header from "./header";
import Footer from "./footer";
import Sidebar from "./sidebar";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  // Determine if sidebar should be shown
  const showSidebar = user && location !== "/auth";

  return (
    <div className="app-container flex flex-col min-h-screen text-foreground">
      <Header />
      
      <div className={`flex-grow flex ${showSidebar ? 'md:ml-0' : ''}`}>
        {showSidebar && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}
        
        <main className="flex-grow px-4 py-3 md:px-8">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
