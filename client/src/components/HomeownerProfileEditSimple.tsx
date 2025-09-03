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
import { apiRequest } from "@/lib/queryClient";
import { Edit, User, Mail, Phone, Save } from "lucide-react";

const profileEditSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number").optional().or(z.literal("")),
});

type ProfileEditForm = z.infer<typeof profileEditSchema>;

export function HomeownerProfileEditSimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileEditForm>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      fullName: "",
      phone: "",
    },
  });

  // Fetch user data when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch('/api/auth/user', {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          console.log('Fetched user data:', data);
          setUserData(data);
          // Immediately set form values
          form.setValue('fullName', data.fullName || '');
          form.setValue('phone', data.phone || '');
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching user:', err);
          setLoading(false);
          toast({
            title: "Error",
            description: "Failed to load user data",
            variant: "destructive"
          });
        });
    }
  }, [open, form, toast]);

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileEditForm) => {
      if (!userData) throw new Error("User data not loaded");
      
      const response = await apiRequest('PATCH', `/api/users/${userData.id}`, { 
        fullName: data.fullName, 
        phone: data.phone 
      });
      const result = await response.json();
      
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
      
      setOpen(false);
      
      // Refresh any cached user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Reload the page to show updated data
      window.location.reload();
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
    try {
      await updateProfile.mutateAsync(data);
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          style={{ 
            backgroundColor: '#10b981', 
            color: 'white', 
            border: '2px solid #10b981' 
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile (NEW VERSION!)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your personal information and contact details.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-sm text-gray-600">Loading your information...</p>
          </div>
        ) : (
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
                      <Input 
                        placeholder="Enter your full name" 
                        {...field} 
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
                  value={userData?.email || ""} 
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
                  onClick={() => setOpen(false)}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
// Force rebuild
