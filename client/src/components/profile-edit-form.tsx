import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Form validation schema
const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional(),
  avatarUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type ProfileEditFormProps = {
  userData: any;
  roleData?: any;
  userType: 'admin' | 'salesperson' | 'contractor';
  onSuccess?: () => void;
};

export default function ProfileEditForm({ userData, roleData, userType, onSuccess }: ProfileEditFormProps) {
  const queryClient = useQueryClient();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userData?.avatarUrl || null);
  
  // Form setup with default values - preserving existing data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: userData?.fullName || "",
      email: userData?.email || "",
      phone: roleData?.phone || userData?.phone || "",
      bio: roleData?.bio || "",
      avatarUrl: userData?.avatarUrl || "",
    },
  });
  
  // Handle avatar upload
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB.",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file.",
          variant: "destructive",
        });
        return;
      }

      // Create a preview
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const result = e.target?.result as string;
            setAvatarPreview(result);
            // Store the data URL in a hidden form field
            form.setValue('avatarUrl', result);
            console.log("Image loaded successfully");
          } catch (err) {
            console.error("Error processing image result:", err);
            toast({
              title: "Error loading image",
              description: "There was a problem processing your image. Please try a different one.",
              variant: "destructive",
            });
          }
        };
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          toast({
            title: "Error reading file",
            description: "There was a problem reading your image file. Please try again.",
            variant: "destructive",
          });
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("FileReader setup error:", err);
        toast({
          title: "Error setting up file reader",
          description: "There was a problem with your browser's file reading capabilities.",
          variant: "destructive",
        });
      }
    }
  };
  
  // API endpoint based on user type
  const getApiEndpoint = () => {
    switch (userType) {
      case 'salesperson':
        return `/api/salespersons/${roleData?.id}`;
      case 'contractor':
        return `/api/contractors/${roleData?.id}`;
      case 'admin':
      default:
        return `/api/users/${userData?.id}`;
    }
  };
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const endpoint = getApiEndpoint();
      return apiRequest(endpoint, "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      if (onSuccess) onSuccess();
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
    // The avatarUrl field is already updated by the handleAvatarChange function
    // We only need to include it if there's a preview available
    if (!data.avatarUrl && avatarPreview) {
      data.avatarUrl = avatarPreview;
    }
    
    // Remove unnecessarily large data URLs if they're too long to prevent API issues
    if (data.avatarUrl && data.avatarUrl.length > 500000) {
      toast({
        title: "Image too large",
        description: "Please select a smaller image for your profile picture.",
        variant: "destructive",
      });
      return;
    }
    
    updateProfileMutation.mutate(data);
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>
          Update your personal information and how others see you on the platform.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Avatar section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24 border-2 border-muted">
                <AvatarImage src={avatarPreview || ""} />
                <AvatarFallback className="text-xl">{userData?.fullName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex flex-col items-center">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" type="button" className="mt-2">
                      Change Photo
                    </Button>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  {avatarPreview && avatarPreview !== userData?.avatarUrl && (
                    <p className="text-xs text-green-600 mt-1">New photo selected</p>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Basic information */}
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
            
            {/* Bio section - only for salespeople and contractors */}
            {(userType === 'salesperson' || userType === 'contractor') && (
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell others about your experience, qualifications, and how you can help them..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This will appear on your public profile page.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              type="button"
              onClick={onSuccess}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}