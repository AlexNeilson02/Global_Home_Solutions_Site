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
import { useAuth } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { login, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      // Use the AuthProvider's login method
      const user = await login(data);
      
      // Show success message
      if (user && user.fullName) {
        toast({
          title: "Login Successful!",
          description: `Welcome back, ${user.fullName}!`,
        });
      } else {
        toast({
          title: "Login Successful!",
          description: "Welcome back!",
        });
      }

      // Small delay for toast to show before redirect
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect based on user role
      switch (user?.role) {
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
          setLocation("/homeowner-dashboard");
          break;
        default:
          setLocation("/");
      }
      
    } catch (error) {
      console.error("Login error:", error);
      
      // Provide specific error messages based on error type
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
        } else if (error.message.includes("401") || error.message.includes("Invalid")) {
          errorMessage = "Invalid username or password. Please check your credentials and try again.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again in a few moments.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-900">
              Portal Login
            </CardTitle>
            <CardDescription className="text-lg">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                  disabled={isLoading || authLoading}
                >
                  {(isLoading || authLoading) ? "Signing in..." : "Sign In"}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Don't have an account?
                  </p>
                  <div className="space-y-2">
                    <Link href="/homeowner-registration">
                      <Button variant="outline" className="w-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                        Register as Homeowner
                      </Button>
                    </Link>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}