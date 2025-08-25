import { useState, useEffect } from "react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-fixed";
import { useQueryClient } from "@tanstack/react-query";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Custom state for problematic fields
  const [customFullName, setCustomFullName] = useState("");
  const [customUsername, setCustomUsername] = useState("");

  // Robust JavaScript fix for input fields
  useEffect(() => {
    const fixInputs = () => {
      const inputs = document.querySelectorAll('input[name="fullName"], input[name="username"]');
      inputs.forEach((input) => {
        const element = input as HTMLInputElement;
        // Apply visual fixes without touching input values
        element.style.webkitUserSelect = 'text';
        element.style.userSelect = 'text';
        element.style.pointerEvents = 'auto';
        element.style.backgroundColor = '#ffffff';
        element.style.color = '#000000 !important';
        element.style.caretColor = '#3b82f6';
        element.style.fontSize = '16px';
        element.style.fontFamily = 'inherit';
        element.style.opacity = '1';
        element.style.visibility = 'visible';
        element.style.textIndent = '0px';
        element.style.textShadow = 'none';
        element.style.webkitTextFillColor = '#000000 !important';
        element.style.display = 'block';
        element.readOnly = false;
        element.disabled = false;
      });
    };

    // Apply fixes regularly but don't interfere with input values
    fixInputs();
    const timer = setInterval(fixInputs, 200);
    
    return () => clearInterval(timer);
  }, [isRegistering]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit", // Only validate on submit, not while typing
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit", // Only validate on submit, not while typing
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Sync custom values with form
  const syncFormValues = () => {
    registerForm.setValue('fullName', customFullName);
    registerForm.setValue('username', customUsername);
  };
  
  // Update form values when custom values change
  React.useEffect(() => {
    syncFormValues();
  }, [customFullName, customUsername]);

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data);
      
      toast({
        title: "Login Successful!",
        description: `Welcome back!`,
        duration: 2000,
      });

      // Small delay to let authentication context update, then redirect all users to home
      setTimeout(() => {
        setLocation("/");
      }, 100);
      
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      // Exclude confirmPassword from the API call
      const { confirmPassword, ...registerData } = data;
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({
          ...registerData,
          role: "homeowner", // Set role to homeowner
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Registration failed");
      }

      const result = await response.json();
      
      if (result.autoLogin) {
        // User was automatically logged in
        toast({
          title: "Welcome to Global Home Solutions!",
          description: "Your account has been created and you're now logged in.",
          duration: 2000,
        });
        
        // Force auth context to refresh
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          setLocation("/");
        }, 100);
      } else {
        // Need to manually login
        toast({
          title: "Account Created Successfully!",
          description: "Please sign in with your new account.",
          duration: 2000,
        });
        
        // Switch to login form
        setIsRegistering(false);
        registerForm.reset();
        
        // Pre-fill the login form with the username
        loginForm.setValue('username', registerData.username);
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back Arrow */}
      <Link href="/">
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-6 left-6 z-10 bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Link>
      
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-900">
              {isRegistering ? "Create Homeowner Account" : "Portal Login"}
            </CardTitle>
            <CardDescription className="text-lg">
              {isRegistering ? "Sign up to track your home improvement projects" : "Sign in to access your dashboard"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!isRegistering ? (
              // Login Form
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            ) : (
              // Registration Form
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={customFullName}
                      onChange={(e) => {
                        const value = e.target.value;
                        console.log('Full Name input change:', value);
                        setCustomFullName(value);
                      }}
                      onFocus={() => console.log('Full Name focused')}
                      onClick={() => console.log('Full Name clicked')}
                      className="flex h-12 w-full rounded-apple border-2 border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-2"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        fontSize: '16px',
                        fontFamily: 'inherit',
                        WebkitTextFillColor: '#000000',
                        opacity: 1,
                        visibility: 'visible'
                      }}
                    />
                    {registerForm.formState.errors.fullName && (
                      <p className="text-sm font-medium text-destructive">
                        {registerForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="Choose a username"
                      value={customUsername}
                      onChange={(e) => {
                        const value = e.target.value;
                        console.log('Username input change:', value);
                        setCustomUsername(value);
                      }}
                      onFocus={() => console.log('Username focused')}
                      onClick={() => console.log('Username clicked')}
                      className="flex h-12 w-full rounded-apple border-2 border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-2"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        fontSize: '16px',
                        fontFamily: 'inherit',
                        WebkitTextFillColor: '#000000',
                        opacity: 1,
                        visibility: 'visible'
                      }}
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-sm font-medium text-destructive">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email address" 
                            autoComplete="email"
                            value={field.value || ''}
                            onChange={(e) => {
                              console.log('Email input change:', e.target.value);
                              field.onChange(e);
                            }}
                            style={{ 
                              backgroundColor: '#ffffff',
                              color: '#000000',
                              pointerEvents: 'auto',
                              userSelect: 'text'
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password (min 6 characters)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            )}

            {/* Toggle between Login and Registration */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isRegistering ? "Already have an account?" : "New homeowner?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="font-medium text-blue-600 hover:text-blue-500 underline"
                >
                  {isRegistering ? "Sign in here" : "Create an account"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}