import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Edit, User, Mail, Phone, Save } from "lucide-react";

const profileEditSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number").optional().or(z.literal("")),
});

type ProfileEditForm = z.infer<typeof profileEditSchema>;

interface HomeownerProfileEditProps {
  trigger?: React.ReactNode;
}

export function HomeownerProfileEdit({ trigger }: HomeownerProfileEditProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Keyboard navigation support for profile edit dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  // Handle dialog trigger click with proper event handling
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  // Handle overlay click - close dialog
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  };

  // Handle content click - prevent closing
  const handleContentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const form = useForm<ProfileEditForm>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
    },
  });

  // Reset form when user data changes or dialog opens
  useEffect(() => {
    if (open && user) {
      console.log('🔄 Resetting form with user data:', { fullName: user.fullName, phone: user.phone });
      form.reset({
        fullName: user.fullName || "",
        phone: user.phone || "",
      });
    }
  }, [open, user, form]);

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileEditForm) => {
      if (!user) throw new Error("User not found");
      
      console.log('🔄 Updating profile with data:', data);
      console.log('📞 Making API call to:', `/api/users/${user.id}`);
      
      const result = await apiRequest(`/api/users/${user.id}`, 'PATCH', data);
      
      console.log('✅ Profile update successful:', result);
      return result;
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Update localStorage and close modal
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      setOpen(false);
      
      // Refresh any cached user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ProfileEditForm) => {
    console.log('📝 Form submitted with data:', data);
    console.log('👤 Current user:', user);
    console.log('🔍 Form errors:', form.formState.errors);
    console.log('✅ Form is valid:', form.formState.isValid);
    
    try {
      await updateProfile.mutateAsync(data);
    } catch (error) {
      console.error('❌ Profile update failed:', error);
    }
  };

  const defaultTrigger = (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleTriggerClick}
      type="button"
    >
      <Edit className="w-4 h-4 mr-2" />
      Edit Profile
    </Button>
  );

  return (
    <div data-component="profile-edit-modal" className="profile-edit-overlay">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div onClick={handleTriggerClick}>
            {trigger || defaultTrigger}
          </div>
        </DialogTrigger>
        <DialogContent 
          className="sm:max-w-md" 
          onClick={handleContentClick}
          data-component="profile-edit-modal"
        >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your personal information and contact details.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <Input 
                value={user?.email || ""} 
                disabled 
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email address cannot be changed
              </p>
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="Enter your phone number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}