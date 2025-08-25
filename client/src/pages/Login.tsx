import { useState, useEffect } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Emergency JavaScript fix for input fields
  useEffect(() => {
    const fixInputs = () => {
      const inputs = document.querySelectorAll('input[name="fullName"], input[name="username"]');
      inputs.forEach((input) => {
        const element = input as HTMLInputElement;
        // Force enable text selection and input
        element.style.webkitUserSelect = 'text';
        element.style.userSelect = 'text';
        element.style.pointerEvents = 'auto';
        element.style.backgroundColor = '#ffffff';
        element.style.color = '#000000';
        element.style.caretColor = '#3b82f6';
        element.readOnly = false;
        element.disabled = false;
        
        // Add event listeners to ensure input works
        element.addEventListener('click', (e) => {
          e.stopPropagation();
          element.focus();
        });
        
        element.addEventListener('focus', () => {
          element.style.borderColor = '#3b82f6';
          element.style.outline = '2px solid #3b82f6';
        });
        
        console.log('Fixed input:', element.name || element.placeholder);
      });
    };

    // Run fix immediately and on form changes
    fixInputs();
    const timer = setInterval(fixInputs, 100);
    
    return () => clearInterval(timer);
  }, [isRegistering]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Login failed");
      }

      const result = await response.json();
      
      // Store the authentication token
      localStorage.setItem("auth-token", result.token);
      
      toast({
        title: "Login Successful!",
        description: `Welcome back, ${result.user.fullName}!`,
      });

      // Redirect based on user role
      switch (result.user.role) {
        case "contractor":
          setLocation("/contractor-portal");
          break;
        case "salesperson":
          setLocation("/sales-portal");
          break;
        case "admin":
          setLocation("/admin-portal");
          break;
        case "homeowner":
          setLocation("/homeowner-portal");
          break;
        default:
          setLocation("/");
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
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
        body: JSON.stringify({
          ...registerData,
          role: "homeowner", // Set role to homeowner
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Registration failed");
      }

      toast({
        title: "Account Created Successfully!",
        description: "You can now sign in with your new account.",
      });

      // Switch to login form after successful registration
      setIsRegistering(false);
      registerForm.reset();
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
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
                  <FormField
                    control={registerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your full name" 
                            autoComplete="name"
                            autoFocus={false}
                            value={field.value || ''}
                            onChange={(e) => {
                              console.log('Full Name input change:', e.target.value);
                              field.onChange(e);
                            }}
                            onFocus={() => console.log('Full Name focused')}
                            onClick={() => console.log('Full Name clicked')}
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
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a username" 
                            autoComplete="username"
                            autoFocus={false}
                            value={field.value || ''}
                            onChange={(e) => {
                              console.log('Username input change:', e.target.value);
                              field.onChange(e);
                            }}
                            onFocus={() => console.log('Username focused')}
                            onClick={() => console.log('Username clicked')}
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