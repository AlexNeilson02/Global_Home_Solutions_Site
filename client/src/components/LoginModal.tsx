import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type LoginCredentials } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalType: "admin" | "contractor" | "salesperson";
  onLoginSuccess: (redirectTo: string) => void;
}

export function LoginModal({ isOpen, onClose, portalType, onLoginSuccess }: LoginModalProps) {
  const { login, isLoggingIn } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>("");

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const getPortalTitle = () => {
    switch (portalType) {
      case "admin":
        return "Admin Portal Login";
      case "contractor":
        return "Contractor Portal Login";
      case "salesperson":
        return "Sales Representative Login";
      default:
        return "Login";
    }
  };

  const onSubmit = async (data: LoginCredentials) => {
    setError("");
    
    try {
      // Call the login mutation directly
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      
      const result = await response.json();
      
      // Check if user has correct role for portal (admin can access any portal)
      if (result.user.role !== portalType && result.user.role !== 'admin') {
        setError(`Access denied. This portal is for ${portalType} users only.`);
        return;
      }
      
      // Invalidate auth queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Small delay to allow queries to update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      onLoginSuccess(result.redirectTo);
      onClose();
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">{getPortalTitle()}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              {...form.register("username")}
              disabled={isLoggingIn}
            />
            {form.formState.errors.username && (
              <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...form.register("password")}
              disabled={isLoggingIn}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-red-600 text-center">{error}</div>
          )}
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoggingIn}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}