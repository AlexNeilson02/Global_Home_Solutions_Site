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
import { Edit, User, Mail, Phone, Save, Upload, Camera } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const profileEditSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number").optional().or(z.literal("")),
  avatarUrl: z.string().optional(),
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  // Debug user data
  console.log('🔍 HomeownerProfileEdit - Current user:', user);
  console.log('🔍 User fullName:', user?.fullName);
  console.log('🔍 User phone:', user?.phone);
  console.log('🔍 User email:', user?.email);

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
      fullName: "",
      phone: "",
      avatarUrl: "",
    },
  });

  // Reset form when user data changes or dialog opens
  useEffect(() => {
    if (user) {
      console.log('🔄 Current user data:', user);
      console.log('🔄 Setting form values with user data:', { fullName: user.fullName, phone: user.phone, avatarUrl: user.avatarUrl });
      
      const formData = {
        fullName: user.fullName || "",
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
      };
      
      console.log('📝 Form data being set:', formData);
      
      // Set individual form values instead of reset
      form.setValue('fullName', formData.fullName);
      form.setValue('phone', formData.phone);
      form.setValue('avatarUrl', formData.avatarUrl);
      
      setPreviewAvatar(user.avatarUrl || null);
    }
  }, [user, form]);
  
  // Additional effect to ensure form is populated when dialog opens
  useEffect(() => {
    if (open && user) {
      console.log('🚀 Dialog opened - ensuring form is populated');
      form.setValue('fullName', user.fullName || "");
      form.setValue('phone', user.phone || "");
      form.setValue('avatarUrl', user.avatarUrl || "");
    }
  }, [open, user, form]);

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileEditForm) => {
      if (!user) throw new Error("User not found");
      
      console.log('🔄 Updating profile with data:', data);
      console.log('📞 Making API call to:', `/api/users/${user.id}`);
      
      const response = await apiRequest('PATCH', `/api/users/${user.id}`, { 
        fullName: data.fullName, 
        phone: data.phone 
      });
      const result = await response.json();
      
      console.log('✅ Profile update successful:', result);
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Update localStorage with the updated user data
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      setPreviewAvatar(null);
      
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

  const handleGetUploadParameters = async () => {
    const response = await fetch('/api/objects/upload', {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (!result.successful.length) {
      toast({
        title: "Upload Failed",
        description: "No files were uploaded successfully",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploadedFile = result.successful[0];
      const avatarUrl = uploadedFile.uploadURL;
      
      // Update avatar in database
      const avatarResponse = await apiRequest('PUT', `/api/users/${user?.id}/avatar`, { avatarUrl });
      const response = await avatarResponse.json();
      
      if (response.success) {
        form.setValue('avatarUrl', response.avatarUrl);
        setPreviewAvatar(response.avatarUrl);
        
        // Update localStorage with the new user data
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        
        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been updated successfully.",
        });
        
        // Refresh cached user data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast({
        title: "Avatar Update Failed",
        description: error.message || "Failed to update profile picture",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

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
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <FormLabel className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Profile Picture
              </FormLabel>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {previewAvatar || user?.avatarUrl ? (
                    <img
                      src={previewAvatar || user?.avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB limit for profile pictures
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <div className="flex items-center gap-2">
                      {uploadingAvatar ? (
                        <>
                          <Upload className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload Picture</span>
                        </>
                      )}
                    </div>
                  </ObjectUploader>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG or GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>

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
                    <Input 
                      placeholder="Enter your full name" 
                      {...field} 
                      value={field.value || user?.fullName || ""} 
                    />
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
                      value={field.value || user?.phone || ""}
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