import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Form validation schema
const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  bio: z.string().min(10, "Bio must be at least 10 characters.").max(500, "Bio cannot exceed 500 characters."),
  avatarUrl: z.string().optional(),
  profileUrl: z.string()
    .min(3, "Profile URL must be at least 3 characters.")
    .max(30, "Profile URL cannot exceed 30 characters.")
    .regex(/^[a-z0-9\-]+$/, "Profile URL can only contain lowercase letters, numbers, and hyphens."),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions to continue."
  })
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SalespersonOnboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Fetch existing salesperson data if available
  const { data: userData, isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ["/api/users/me"],
  });

  // Get associated salesperson data
  const salespersonData = userData?.roleData;
  
  // Form setup with default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: "",
      avatarUrl: user?.avatarUrl || "",
      profileUrl: salespersonData?.profileUrl || (user?.username ? user.username.toLowerCase().replace(/[^a-z0-9-]/g, '-') : ''),
      termsAccepted: false
    },
  });
  
  // Handle avatar upload
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simple preview for now
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // In a full implementation, we would upload this file to a storage service
      // and then update the avatarUrl field with the URL from the storage service
    }
  };
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      return apiRequest(`/api/salespersons/${salespersonData?.id}`, "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      navigate("/sales-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: ProfileFormValues) => {
    // If we had a real avatar upload, we would include the URL here
    if (avatarPreview) {
      // In a real implementation, this would be the URL returned from the storage service
      data.avatarUrl = avatarPreview;
    }
    
    updateProfileMutation.mutate(data);
  };
  
  if (isLoadingUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Sales Profile</h1>
          <p className="text-muted-foreground">
            Set up your professional profile to create your personalized landing page for customers.
          </p>
          
          {/* Step indicator */}
          <div className="flex justify-center mt-6 mb-8">
            <div className="flex space-x-2">
              <div className={`w-12 h-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`w-12 h-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`w-12 h-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
            </div>
          </div>
        </div>
        
        <Card className="shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Add your contact information so customers can reach you.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="your.email@example.com" {...field} />
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
                              <Input placeholder="(123) 456-7890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={() => navigate("/sales-dashboard")} type="button">
                      Skip for Now
                    </Button>
                    <Button onClick={() => setStep(2)} type="button">Continue</Button>
                  </CardFooter>
                </>
              )}
              
              {/* Step 2: Profile Details */}
              {step === 2 && (
                <>
                  <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>
                      Add a professional photo and description to build trust with customers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-24 w-24 border-2 border-muted">
                        <AvatarImage src={avatarPreview || user?.avatarUrl || ""} />
                        <AvatarFallback className="text-xl">{user?.fullName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                          <Button variant="outline" size="sm" type="button" className="mt-2">
                            Upload Photo
                          </Button>
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </label>
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professional Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell potential customers about your experience, qualifications, and how you can help them..."
                              className="min-h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This will appear on your landing page to help build trust with customers.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)} type="button">Back</Button>
                    <Button onClick={() => setStep(3)} type="button">Continue</Button>
                  </CardFooter>
                </>
              )}
              
              {/* Step 3: URL and Terms */}
              {step === 3 && (
                <>
                  <CardHeader>
                    <CardTitle>Customize Your Landing Page</CardTitle>
                    <CardDescription>
                      Set your unique profile URL and review our terms.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="profileUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Profile URL</FormLabel>
                          <div className="flex items-center space-x-2">
                            <div className="flex-shrink-0 text-muted-foreground">
                              {window.location.origin}/s/
                            </div>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </div>
                          <FormDescription>
                            Choose a simple, memorable URL for your landing page.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="termsAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the Terms of Service and Privacy Policy
                            </FormLabel>
                            <FormDescription>
                              By continuing, you agree to our terms regarding customer data handling and sales practices.
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(2)} type="button">Back</Button>
                    <Button 
                      type="submit"
                      disabled={updateProfileMutation.isPending || !form.getValues().termsAccepted}
                    >
                      {updateProfileMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent"></div>
                          Saving...
                        </div>
                      ) : (
                        "Finish & Go to Dashboard"
                      )}
                    </Button>
                  </CardFooter>
                </>
              )}
            </form>
          </Form>
        </Card>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            This profile information will be displayed on your personal landing page for customers.
            You can update it anytime from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}