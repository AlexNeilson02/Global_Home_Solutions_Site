import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { usePlatform } from "@/contexts/PlatformContext";
import { Home, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";

const homeownerRegistrationSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "Password must contain at least one letter and one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type HomeownerRegistrationForm = z.infer<typeof homeownerRegistrationSchema>;

export default function HomeownerRegistration() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isMobileApp, isMobileWeb } = usePlatform();

  const form = useForm<HomeownerRegistrationForm>({
    resolver: zodResolver(homeownerRegistrationSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: HomeownerRegistrationForm) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registrationData } = data;
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...registrationData,
          role: "homeowner",
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Registration failed");
      }

      const result = await response.json();
      
      // Check for retroactive attribution - link this email to salesperson from previous bid requests
      try {
        console.log('🔍 Checking for retroactive attribution for email:', data.email);
        
        const attributionResponse = await fetch("/api/customer-attribution/retroactive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: data.email
          }),
        });
        
        if (attributionResponse.ok) {
          const attributionResult = await attributionResponse.json();
          if (attributionResult.attributionCreated) {
            console.log('✅ Retroactive attribution created:', attributionResult);
            toast({
              title: "Registration Successful!",
              description: "Your account has been created and linked to your previous bid requests.",
            });
          } else {
            console.log('ℹ️ No retroactive attribution needed');
            toast({
              title: "Registration Successful!",
              description: "Your homeowner account has been created. Please log in.",
            });
          }
        } else {
          // Attribution failed but registration succeeded - continue with normal flow
          console.warn('⚠️ Retroactive attribution check failed, but registration succeeded');
          toast({
            title: "Registration Successful!",
            description: "Your homeowner account has been created. Please log in.",
          });
        }
      } catch (attributionError) {
        // Attribution failed but registration succeeded - continue with normal flow
        console.warn('⚠️ Retroactive attribution error:', attributionError);
        toast({
          title: "Registration Successful!",
          description: "Your homeowner account has been created. Please log in.",
        });
      }

      // Redirect to login
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isMobile = isMobileApp || isMobileWeb;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className={`w-full space-y-6 ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Home className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-900">
              Join as Homeowner
            </CardTitle>
            <CardDescription className="text-base">
              Create your account to request home services
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Enter your full name" 
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="email"
                            placeholder="Enter your email" 
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="tel"
                            placeholder="Enter your phone number" 
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Choose a username" 
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password" 
                            className="pl-10 pr-10"
                            {...field} 
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password" 
                            className="pl-10 pr-10"
                            {...field} 
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>

                <div className="text-center space-y-3 pt-4">
                  <p className="text-sm text-gray-600">
                    Already have an account?
                  </p>
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Sign In Instead
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}