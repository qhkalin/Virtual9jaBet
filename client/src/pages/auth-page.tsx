import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerSchema, loginSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Check URL for tab parameter
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'register' ? 'register' : 'login');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      referralCode: "",
    },
  });

  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4" style={{
      backgroundColor: "#0E2E5C",
      backgroundImage: "linear-gradient(to bottom, #0E2E5C, #071834)",
      backgroundAttachment: "fixed"
    }}>
      {/* Header */}
      <header className="w-full py-4 px-6">
        <div className="text-center sm:text-left">
          <img src="/logo.svg" alt="Virtual9jaBet Logo" className="h-14 inline-block" />
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow flex items-center justify-center">
        <div className="flex items-center justify-center">
          <Tabs 
            defaultValue={activeTab} 
            onValueChange={setActiveTab}
            className="w-full max-w-md"
          >
            <TabsList className="grid w-full grid-cols-2" style={{ backgroundColor: "#143668" }}>
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0E2E5C] data-[state=active]:font-bold"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0E2E5C] data-[state=active]:font-bold"
              >
                Register
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-[#FFD700] border-2 bg-[#0E2E5C]/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Login to your account</CardTitle>
                  <CardDescription className="text-gray-300">
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white">Username</Label>
                      <Input
                        id="username"
                        placeholder="Enter your username"
                        className="bg-[#143668] text-white border-[#2D5599] focus:border-[#FFD700] focus:ring-[#FFD700]"
                        {...loginForm.register("username")}
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-[#FFD700]">{loginForm.formState.errors.username.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="bg-[#143668] text-white border-[#2D5599] focus:border-[#FFD700] focus:ring-[#FFD700]"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-[#FFD700]">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-[#FFD700] hover:bg-[#E6C200] text-[#0E2E5C] font-bold"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card className="border-[#FFD700] border-2 bg-[#0E2E5C]/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Create an account</CardTitle>
                  <CardDescription className="text-gray-300">
                    Join Virtual9jaBet and get ₦2,000 signup bonus
                  </CardDescription>
                </CardHeader>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        className="bg-[#143668] text-white border-[#2D5599] focus:border-[#FFD700] focus:ring-[#FFD700]"
                        {...registerForm.register("fullName")}
                      />
                      {registerForm.formState.errors.fullName && (
                        <p className="text-sm text-[#FFD700]">{registerForm.formState.errors.fullName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white">Username</Label>
                      <Input
                        id="username"
                        placeholder="Choose a username"
                        className="bg-[#143668] text-white border-[#2D5599] focus:border-[#FFD700] focus:ring-[#FFD700]"
                        {...registerForm.register("username")}
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-[#FFD700]">{registerForm.formState.errors.username.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="bg-[#143668] text-white border-[#2D5599] focus:border-[#FFD700] focus:ring-[#FFD700]"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-[#FFD700]">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        className="bg-[#143668] text-white border-[#2D5599] focus:border-[#FFD700] focus:ring-[#FFD700]"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-[#FFD700]">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        className="bg-[#143668] text-white border-[#2D5599] focus:border-[#FFD700] focus:ring-[#FFD700]"
                        {...registerForm.register("confirmPassword")}
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-[#FFD700]">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referralCode" className="text-white">Referral Code (Optional)</Label>
                      <Input
                        id="referralCode"
                        placeholder="Enter referral code if you have one"
                        className="bg-[#143668] text-white border-[#2D5599] focus:border-[#FFD700] focus:ring-[#FFD700]"
                        {...registerForm.register("referralCode")}
                      />
                      {registerForm.formState.errors.referralCode && (
                        <p className="text-sm text-[#FFD700]">{registerForm.formState.errors.referralCode.message}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-[#FFD700] hover:bg-[#E6C200] text-[#0E2E5C] font-bold"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="hidden md:flex flex-col justify-center p-6 bg-[#143668] rounded-lg border-[#FFD700] border-2">
          <div className="space-y-6 text-white">
            <h1 className="text-5xl font-bold font-heading">
              <span className="text-[#FFD700]">Virtual</span>9ja
              <span className="text-[#FFD700]">Bet</span>
            </h1>
            <p className="text-xl">The premier online betting platform in Nigeria.</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-[#FFD700] p-2 rounded-full text-[#0E2E5C]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[#FFD700]">₦2,000 Signup Bonus</h3>
                  <p className="text-sm text-gray-300">Start playing with your welcome bonus</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-[#FFD700] p-2 rounded-full text-[#0E2E5C]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[#FFD700]">Refer & Earn</h3>
                  <p className="text-sm text-gray-300">Get ₦1,500 for every friend you refer</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-[#FFD700] p-2 rounded-full text-[#0E2E5C]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[#FFD700]">Spin & Win</h3>
                  <p className="text-sm text-gray-300">Bet on numbers 2-8 and win big</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="w-full py-6 mt-8 border-t border-[#2D5599]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <img src="/logo.svg" alt="Virtual9jaBet Logo" className="h-8 mb-3" />
              <p className="text-gray-300 text-sm">The premier online betting platform in Nigeria.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/auth" className="text-gray-300 hover:text-[#FFD700]">Login</a></li>
                <li><a href="/auth?tab=register" className="text-gray-300 hover:text-[#FFD700]">Register</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#FFD700]">Terms of Service</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#FFD700]">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm">
                <li className="text-gray-300">Email: support@virtual9jabet.com</li>
                <li className="text-gray-300">Phone: +234 800 VIRTUAL</li>
                <li className="text-gray-300">Address: Lagos, Nigeria</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Virtual9jaBet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
