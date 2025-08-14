import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  Camera, 
  DollarSign, 
  FileText, 
  Mail, 
  MapPin, 
  Phone, 
  Star, 
  Upload,
  X,
  Plus,
  Trash2,
  Eye,
  Edit3,
  BarChart3,
  CreditCard,
  Loader2,
  Settings
} from "lucide-react";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ProjectTimeline from "@/components/ProjectTimeline";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import GmailIntegration from "@/components/GmailIntegration";

// Initialize Stripe
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

// Subscription Payment Form Component
interface SubscriptionFormProps {
  contractorId: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function SubscriptionForm({ contractorId, onSuccess, onError }: SubscriptionFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message || 'Payment form submission failed');
        return;
      }

      // Try to confirm payment first, if that fails, try setup intent
      let result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/contractor-portal-enhanced?subscription_success=true`,
        },
        redirect: 'if_required',
      });

      // If payment confirmation failed, try setup intent confirmation
      if (result.error && result.error.type === 'invalid_request_error') {
        const setupResult = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/contractor-portal-enhanced?subscription_success=true`,
          },
          redirect: 'if_required',
        });
        
        if (setupResult.error) {
          onError(setupResult.error.message || 'Payment failed');
        } else if (setupResult.setupIntent?.status === 'succeeded') {
          toast({
            title: "Payment Method Added!",
            description: "Your payment method has been successfully verified and saved.",
          });
          onSuccess();
        }
      } else if (result.error) {
        onError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        toast({
          title: "Payment Method Added!",
          description: "Your payment method has been successfully verified and saved.",
        });
        onSuccess();
      }
    } catch (err) {
      onError('An unexpected error occurred during payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          'Save Payment Method'
        )}
      </Button>
    </form>
  );
}

const ContractorPortalEnhanced: React.FC = () => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [pendingContactEmail, setPendingContactEmail] = useState<any>(null);
  
  // Style object to remove yellow coloring with subtle borders - Solution #2
  const antiYellowStyles = {
    backgroundColor: 'white',
    color: 'black',
    outline: 'none',
    outlineColor: 'transparent',
    outlineWidth: '0',
    outlineStyle: 'none',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  } as const;

  // Enhanced style for inputs and interactive elements with subtle borders
  const antiYellowInputStyles = {
    backgroundColor: 'white',
    color: 'black',
    outline: 'none',
    outlineColor: 'transparent',
    outlineWidth: '0',
    outlineStyle: 'none',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none'
  } as const;
  const [editForm, setEditForm] = useState({
    companyName: '',
    description: '',
    specialties: [] as string[],
    serviceAreas: [] as string[],
    licenseNumber: '',
    phone: '',
    email: '',
    logoUrl: '',
    hourlyRate: 0,
    videoUrl: '',
    ownerName: '',
    instagram: '',
    facebook: '',
    twitter: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [mediaFiles, setMediaFiles] = useState<{url: string, type: 'image' | 'video', name: string}[]>([]);

  const [viewingBidDetails, setViewingBidDetails] = useState<any | null>(null);
  const [viewingMedia, setViewingMedia] = useState<{url: string, type: 'image' | 'video', index: number, allMedia: any[]} | null>(null);
  const [newServiceArea, setNewServiceArea] = useState('');
  
  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'inactive' | 'loading'>('loading');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [monthlySpendCap, setMonthlySpendCap] = useState(1000);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      navigate('/portals');
    }
  });

  // Get current user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/me'],
    enabled: true
  });

  const contractor = (userData as any)?.roleData;

  // Initialize monthlySpendCap from contractor data when loaded
  useEffect(() => {
    if (contractor?.monthlySpendCap !== undefined) {
      setMonthlySpendCap(contractor.monthlySpendCap);
    }
  }, [contractor?.monthlySpendCap]);

  // Handle Stripe checkout results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('setup_success') === 'true' && contractor?.id) {
      // Mark payment method as added and refresh data
      const markPaymentMethodAdded = async () => {
        try {
          await apiRequest('POST', '/api/mark-payment-method-added', {
            contractorId: contractor?.id
          });
          
          // Refresh user data to get updated payment status
          queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
          
          toast({
            title: "Payment Method Added!",
            description: "Your payment method has been successfully verified and saved. The $1 verification charge will be refunded.",
          });
        } catch (error) {
          toast({
            title: "Payment Method Added!",
            description: "Your payment method has been successfully verified and saved.",
          });
        }
      };
      
      markPaymentMethodAdded();
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Switch to subscription tab if not already there
      setActiveTab("subscription");
    } else if (urlParams.get('setup_cancelled') === 'true') {
      toast({
        title: "Setup Cancelled",
        description: "Payment method setup was cancelled. You can try again anytime.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('gmail_connected') === 'true') {
      toast({
        title: "Gmail Connected Successfully!",
        description: "You can now send professional emails to clients directly from your contractor portal.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Switch to email tab
      setActiveTab("email");
    }
  }, [toast, contractor?.id, queryClient]);

  // Add contractor-portal class to body for CSS targeting
  useEffect(() => {
    document.body.classList.add('contractor-portal');
    return () => {
      document.body.classList.remove('contractor-portal');
    };
  }, []);

  // Get contractor's projects
  const { data: projectsData } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!contractor?.id
  });

  const projects = (projectsData as any)?.projects || [];

  // Get contractor's bid requests
  const { data: bidRequestsData } = useQuery({
    queryKey: [`/api/contractors/${contractor?.id}/bid-requests`],
    enabled: !!contractor?.id
  });

  const bidRequests = (bidRequestsData as any)?.bidRequests || [];

  // Get service categories for specialties dropdown
  const { data: servicesData, error: servicesError, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/service-categories"],
  });
  
  const serviceCategories = (servicesData as any)?.services || [];
  
  // Get contractor analytics data
  const { data: contractorAnalytics } = useQuery({
    queryKey: [`/api/contractors/${contractor?.id}/analytics`],
    enabled: !!contractor?.id
  });
  
  // Calculate bid response time data
  const analytics = contractorAnalytics as any;
  const bidResponseTimeData = analytics?.responseTimeBreakdown ? [
    { timeRange: "< 24h", count: analytics.responseTimeBreakdown.under24h },
    { timeRange: "24-48h", count: analytics.responseTimeBreakdown.day1to2 },
    { timeRange: "2-3 days", count: analytics.responseTimeBreakdown.day2to3 },
    { timeRange: "3-7 days", count: analytics.responseTimeBreakdown.day3to7 },
    { timeRange: "> 7 days", count: analytics.responseTimeBreakdown.over7days }
  ] : [
    { timeRange: "< 24h", count: 0 },
    { timeRange: "24-48h", count: 0 },
    { timeRange: "2-3 days", count: 0 },
    { timeRange: "3-7 days", count: 0 },
    { timeRange: "> 7 days", count: 0 }
  ];
  
  // Log any errors for debugging
  if (servicesError) {
    console.error('Error fetching service categories:', servicesError);
  }

  // Handle contact customer - switches to email tab and prepares email
  const handleContactCustomer = (bidRequest: any) => {
    console.log('🎯 ContractorPortalEnhanced - handleContactCustomer called for bid request:', bidRequest.id);
    
    // Prepare email data for the Gmail component
    const emailData = {
      id: bidRequest.id,
      email: bidRequest.email,
      customerName: bidRequest.fullName,
      fullName: bidRequest.fullName,
      serviceType: bidRequest.serviceRequested,
      description: bidRequest.description,
      servicesRequested: [bidRequest.serviceRequested]
    };
    
    console.log('🎯 ContractorPortalEnhanced - Switching to email tab for bid request:', bidRequest.id);
    // Switch to email tab first
    setActiveTab("email");
    
    // Set the pending contact email data with a slight delay to ensure tab switch
    setTimeout(() => {
      console.log('🎯 ContractorPortalEnhanced - Setting pending contact email for bid request:', bidRequest.id);
      setPendingContactEmail(emailData);
    }, 100);
  };

  // Contact customer mutation - REMOVED: This should only be called after email is sent
  const contactCustomerMutation = useMutation({
    mutationFn: async (requestId: number) => {
      console.log('🔴 ContractorPortalEnhanced - contactCustomerMutation called for bid ID:', requestId);
      console.trace('🔴 ContractorPortalEnhanced - Call stack for contactCustomerMutation');
      const response = await fetch(`/api/bid-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'contacted' })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contractors/${contractor?.id}/bid-requests`] });
      toast({
        title: "Customer Contacted",
        description: "Status updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  });

  // Send bid mutation
  const sendBidMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await fetch(`/api/bid-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'bid_sent' })
      });
      if (!response.ok) throw new Error('Failed to send bid');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contractors/${contractor?.id}/bid-requests`] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Bid Sent",
        description: "Request moved to projects tab"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send bid",
        variant: "destructive"
      });
    }
  });

  // Update project status mutation
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number, status: string }) => {
      const response = await fetch(`/api/bid-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update project status');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/contractors/${contractor?.id}/bid-requests`] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project Updated",
        description: `Project marked as ${variables.status.replace('_', ' ')}`
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive"
      });
    }
  });

  // Delete bid request mutation
  const deleteBidRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await fetch(`/api/bid-requests/${requestId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete bid request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contractors/${contractor?.id}/bid-requests`] });
      toast({
        title: "Request Removed",
        description: "Bid request deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bid request",
        variant: "destructive"
      });
    }
  });

  // Initialize edit form with contractor data
  useEffect(() => {
    if (contractor) {
      setEditForm({
        companyName: contractor.companyName || '',
        description: contractor.description || '',
        specialties: contractor.specialties || [],
        serviceAreas: contractor.serviceAreas || [],
        licenseNumber: contractor.licenseNumber || '',
        phone: contractor.phone || '',
        email: contractor.email || '',
        logoUrl: contractor.logoUrl || '',
        hourlyRate: contractor.hourlyRate || 0,
        videoUrl: contractor.videoUrl || '',
        ownerName: contractor.ownerName || '',
        instagram: contractor.instagram || '',
        facebook: contractor.facebook || '',
        twitter: contractor.twitter || ''
      });
      setLogoPreview(contractor.logoUrl || '');
      setMediaFiles(contractor.mediaFiles || []);
    }
  }, [contractor]);

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (5MB limit for logo)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Logo must be smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setEditForm({...editForm, logoUrl: result});
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle media files upload
  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      // Check file size (50MB limit for videos to accommodate 30-second clips, 10MB for images)
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum size is ${file.type.startsWith('video/') ? '50MB for videos (up to 30 seconds)' : '10MB for images'}.`,
          variant: "destructive"
        });
        return;
      }

      // Check file type
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
      
      if (!allowedImageTypes.includes(file.type) && !allowedVideoTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Please use images (JPG, PNG, GIF, WebP) or videos (MP4, WebM, MOV, AVI).`,
          variant: "destructive"
        });
        return;
      }

      // For videos, check duration before processing
      if (file.type.startsWith('video/')) {
        const videoElement = document.createElement('video');
        const videoUrl = URL.createObjectURL(file);
        
        videoElement.onloadedmetadata = () => {
          const duration = videoElement.duration;
          URL.revokeObjectURL(videoUrl);
          
          if (duration > 30) {
            toast({
              title: "Video too long",
              description: `${file.name} is ${Math.round(duration)} seconds long. Please upload videos up to 30 seconds only.`,
              variant: "destructive"
            });
            return;
          }
          
          // Process the video if duration is valid
          processMediaFile(file);
        };
        
        videoElement.onerror = () => {
          URL.revokeObjectURL(videoUrl);
          toast({
            title: "Invalid video",
            description: `${file.name} could not be processed. Please ensure it's a valid video file.`,
            variant: "destructive"
          });
        };
        
        videoElement.src = videoUrl;
      } else {
        // Process images immediately
        processMediaFile(file);
      }
    });
    
    // Reset input
    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  };

  // Process media file (images and validated videos)
  const processMediaFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';
      
      setMediaFiles(prev => [...prev, {
        url: result,
        type: fileType as 'image' | 'video',
        name: file.name
      }]);
      
      toast({
        title: "Media uploaded",
        description: `${file.name} has been added to your portfolio.`,
      });
    };
    
    reader.onerror = () => {
      console.error('Failed to read file:', file.name);
      toast({
        title: "Upload failed",
        description: `Failed to process ${file.name}. Please try again.`,
        variant: "destructive"
      });
    };
    
    reader.readAsDataURL(file);
  };

  // Remove media file
  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };



  // Remove specialty
  const removeSpecialty = (specialty: string) => {
    try {
      const currentSpecialties = Array.isArray(editForm.specialties) ? editForm.specialties : [];
      setEditForm(prev => ({
        ...prev,
        specialties: currentSpecialties.filter(s => s !== specialty)
      }));
    } catch (error) {
      console.error('Error removing specialty:', error);
    }
  };

  // Add service area
  const addServiceArea = () => {
    try {
      if (newServiceArea.trim()) {
        const currentServiceAreas = Array.isArray(editForm.serviceAreas) ? editForm.serviceAreas : [];
        if (!currentServiceAreas.includes(newServiceArea.trim())) {
          setEditForm(prev => ({
            ...prev,
            serviceAreas: [...currentServiceAreas, newServiceArea.trim()]
          }));
          setNewServiceArea('');
        }
      }
    } catch (error) {
      console.error('Error adding service area:', error);
    }
  };

  // Remove service area
  const removeServiceArea = (area: string) => {
    try {
      const currentServiceAreas = Array.isArray(editForm.serviceAreas) ? editForm.serviceAreas : [];
      setEditForm(prev => ({
        ...prev,
        serviceAreas: currentServiceAreas.filter(a => a !== area)
      }));
    } catch (error) {
      console.error('Error removing service area:', error);
    }
  };

  // Update contractor profile mutation
  const updateContractorMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await fetch(`/api/contractors/${contractor?.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...updatedData,
          mediaFiles: mediaFiles || [],
          isActive: true
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update contractor profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated!",
        description: "Your company profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateContractorMutation.mutate(editForm);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Reset form to original values
    if (contractor) {
      setEditForm({
        companyName: contractor.companyName || '',
        description: contractor.description || '',
        specialties: contractor.specialties || [],
        serviceAreas: contractor.serviceAreas || [],
        licenseNumber: contractor.licenseNumber || '',
        phone: contractor.phone || '',
        email: contractor.email || '',
        logoUrl: contractor.logoUrl || '',
        hourlyRate: contractor.hourlyRate || 0,
        videoUrl: contractor.videoUrl || ''
      });
      setLogoPreview(contractor.logoUrl || '');
      setMediaFiles(contractor.mediaFiles || []);
    }
  };

  // Performance data calculations
  const completedProjects = projects.filter((p: any) => p.status === 'completed').length;
  const activeProjects = projects.filter((p: any) => p.status === 'in_progress').length;
  const pendingBids = bidRequests.filter((b: any) => b.status === 'pending').length;
  const totalRevenue = projects
    .filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + (p.budget || 0), 0);

  // Chart data
  const projectData = [
    { month: 'Jan', completed: 8, active: 12, revenue: 45000 },
    { month: 'Feb', completed: 12, active: 15, revenue: 62000 },
    { month: 'Mar', completed: 10, active: 18, revenue: 58000 },
    { month: 'Apr', completed: 15, active: 20, revenue: 75000 },
    { month: 'May', completed: 18, active: 16, revenue: 89000 },
    { month: 'Jun', completed: 22, active: 14, revenue: 95000 }
  ];

  const statusDistribution = [
    { name: 'Completed', value: completedProjects, color: '#10b981' },
    { name: 'Active', value: activeProjects, color: '#3b82f6' },
    { name: 'Pending', value: pendingBids, color: '#f59e0b' }
  ];

  // Subscription management functions
  const handleSubscriptionPayment = async () => {
    setIsProcessingPayment(true);
    try {
      // Create Stripe Checkout session for payment method setup
      const response = await apiRequest('POST', '/api/create-checkout-session', {
        contractorId: contractor?.id
      });
      const data = await response.json();
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error setting up payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to set up payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSubscriptionStatus('active');
    setClientSecret('');
    setIsProcessingPayment(false);
    queryClient.invalidateQueries({ queryKey: [`/api/subscription-status/${contractor?.id}`] });
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
    setIsProcessingPayment(false);
  };

  const cancelSubscription = async () => {
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractorId: contractor?.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      setSubscriptionStatus('inactive');
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
      
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check subscription status on load
  useEffect(() => {
    if (contractor?.id) {
      fetch(`/api/subscription-status/${contractor.id}`)
        .then(response => response.json())
        .then(data => {
          setSubscriptionStatus(data.status === 'active' ? 'active' : 'inactive');
        })
        .catch(() => {
          setSubscriptionStatus('inactive');
        });
    }
  }, [contractor?.id]);

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 contractor-portal-main no-yellow-border"
      style={{
        backgroundColor: '#f9fafb',
        border: 'none',
        outline: 'none',
        outlineColor: 'transparent',
        boxShadow: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none'
      }}
    >
      <div 
        className="container mx-auto px-4 py-8 contractor-portal-container no-yellow-border"
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          outlineColor: 'transparent',
          boxShadow: 'none'
        }}
      >
        <div 
          className="max-w-7xl mx-auto contractor-portal-content no-yellow-border"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            outlineColor: 'transparent',
            boxShadow: 'none'
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Contractor Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Welcome back, {contractor?.companyName || 'Contractor'}
              </p>
            </div>
            <Button onClick={() => logoutMutation.mutate()} variant="outline" disabled={logoutMutation.isPending} style={antiYellowInputStyles}>
              {logoutMutation.isPending ? "Logging out..." : "Back to Portals"}
            </Button>
          </div>

          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="space-y-6 pb-20 sm:pb-0 contractor-portal-tabs no-yellow-border"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              outlineColor: 'transparent',
              boxShadow: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
          >
            {/* Desktop/Tablet Navigation - Hidden on mobile */}
            <TabsList className="hidden sm:grid w-full grid-cols-7">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="profile">Company Profile</TabsTrigger>
              <TabsTrigger value="projects">Sent Bids</TabsTrigger>
              <TabsTrigger value="bids">Bid Requests</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Mobile Navigation - Fixed bottom bar, shown only on mobile */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
              <div className="flex h-16 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex flex-col items-center justify-center gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 px-4 min-w-[80px] flex-shrink-0 ${
                    activeTab === "dashboard" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex flex-col items-center justify-center gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 px-4 min-w-[80px] flex-shrink-0 ${
                    activeTab === "profile" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                >
                  <Edit3 className="h-5 w-5" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab("projects")}
                  className={`flex flex-col items-center justify-center gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 px-4 min-w-[80px] flex-shrink-0 ${
                    activeTab === "projects" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span>Sent Bids</span>
                </button>
                <button
                  onClick={() => setActiveTab("bids")}
                  className={`flex flex-col items-center justify-center gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 px-4 min-w-[80px] flex-shrink-0 ${
                    activeTab === "bids" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                >
                  <Mail className="h-5 w-5" />
                  <span>Bids</span>
                </button>

                <button
                  onClick={() => setActiveTab("email")}
                  className={`flex flex-col items-center justify-center gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 px-4 min-w-[80px] flex-shrink-0 ${
                    activeTab === "email" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </button>
                <button
                  onClick={() => setActiveTab("subscription")}
                  className={`flex flex-col items-center justify-center gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 px-4 min-w-[80px] flex-shrink-0 ${
                    activeTab === "subscription" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Subscription</span>
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`flex flex-col items-center justify-center gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 px-4 min-w-[80px] flex-shrink-0 ${
                    activeTab === "analytics" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" : ""
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </button>
              </div>
            </div>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-4 gap-3 sm:gap-6">
                <Card style={antiYellowStyles}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                    <CardTitle className="text-xs sm:text-sm font-medium truncate">Won Bids</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                    <div className="text-lg sm:text-2xl font-bold">{bidRequests.filter((b: any) => b.status === 'won').length}</div>
                    <p className="text-xs text-muted-foreground">Successful bids</p>
                  </CardContent>
                </Card>

                <Card style={antiYellowStyles}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                    <CardTitle className="text-xs sm:text-sm font-medium truncate">Bids Sent</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                    <div className="text-lg sm:text-2xl font-bold">{bidRequests.filter((b: any) => b.status === 'bid_sent' || b.status === 'won' || b.status === 'lost').length}</div>
                    <p className="text-xs text-muted-foreground">Total bids submitted</p>
                  </CardContent>
                </Card>

                <Card style={antiYellowStyles}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                    <CardTitle className="text-xs sm:text-sm font-medium truncate">Pending Bids</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                    <div className="text-lg sm:text-2xl font-bold">{pendingBids}</div>
                    <p className="text-xs text-muted-foreground">Awaiting response</p>
                  </CardContent>
                </Card>

                <Card style={antiYellowStyles}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                    <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                    <div className="text-lg sm:text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+8% from last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card style={antiYellowStyles}>
                  <CardHeader>
                    <CardTitle>Bid Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={projectData}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="completed" fill="#10b981" name="Won Bids" />
                        <Bar dataKey="active" fill="#3b82f6" name="Sent Bids" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card style={antiYellowStyles}>
                  <CardHeader>
                    <CardTitle>Bid Response Time</CardTitle>
                    <CardDescription>Time taken to respond to bid requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={bidResponseTimeData}>
                        <XAxis 
                          dataKey="timeRange" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [value, 'Requests']}
                          labelStyle={{ color: '#000' }}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px'
                          }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600">
                        Average response time: <span className="font-medium">{analytics?.averageResponseTime?.toFixed(1) || '0.0'}h</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card style={antiYellowStyles}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Company Profile</CardTitle>
                    <CardDescription>Manage your company information and media</CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    variant={isEditingProfile ? "outline" : "default"}
                    style={antiYellowInputStyles}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {isEditingProfile ? "Cancel" : "Edit Profile"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isEditingProfile ? (
                    // Display Mode
                    <div className="space-y-6">
                      {/* Company Logo and Basic Info */}
                      <div className="flex items-start space-x-6">
                        <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                          {contractor?.logoUrl ? (
                            <img src={contractor.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="h-16 w-16 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{contractor?.companyName || 'Company Name'}</h3>
                          <p className="text-gray-600 dark:text-gray-300 mt-2">{contractor?.description || 'No description available'}</p>
                          <div className="flex items-center space-x-4 mt-4">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{contractor?.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{contractor?.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                              <span>${contractor?.hourlyRate || 0}/hr</span>
                            </div>
                          </div>
                          {contractor?.ownerName && (
                            <div className="mt-2">
                              <span className="text-sm text-gray-600">Owner: {contractor.ownerName}</span>
                            </div>
                          )}
                          {(contractor?.instagram || contractor?.facebook || contractor?.twitter) && (
                            <div className="flex items-center space-x-4 mt-3">
                              {contractor?.instagram && (
                                <a href={contractor.instagram.startsWith('http') ? contractor.instagram : `https://instagram.com/${contractor.instagram}`} 
                                   target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                  Instagram
                                </a>
                              )}
                              {contractor?.facebook && (
                                <a href={contractor.facebook.startsWith('http') ? contractor.facebook : `https://facebook.com/${contractor.facebook}`} 
                                   target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                  Facebook
                                </a>
                              )}
                              {contractor?.twitter && (
                                <a href={contractor.twitter.startsWith('http') ? contractor.twitter : `https://twitter.com/${contractor.twitter}`} 
                                   target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                  Twitter
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator 
                        className="contractor-separator no-yellow-border"
                        style={{
                          backgroundColor: '#e5e7eb',
                          border: 'none',
                          borderTop: '1px solid #e5e7eb',
                          outline: 'none',
                          outlineColor: 'transparent',
                          height: '1px',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          appearance: 'none'
                        }}
                      />

                      {/* Specialties */}
                      <div>
                        <h4 className="font-medium mb-3">Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                          {contractor?.specialties?.map((specialty: string, index: number) => (
                            <Badge key={index} variant="secondary">{specialty}</Badge>
                          )) || <span className="text-gray-500">No specialties listed</span>}
                        </div>
                      </div>

                      {/* Service Areas */}
                      <div>
                        <h4 className="font-medium mb-3">Service Areas</h4>
                        <div className="flex flex-wrap gap-2">
                          {contractor?.serviceAreas?.map((area: string, index: number) => (
                            <Badge key={index} variant="outline">{area}</Badge>
                          )) || <span className="text-gray-500">No service areas listed</span>}
                        </div>
                      </div>

                      {/* Media Gallery */}
                      <div>
                        <h4 className="font-medium mb-3">Portfolio Media</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {contractor?.mediaFiles?.map((media: any, index: number) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square cursor-pointer"
                                 onClick={() => setViewingMedia({url: media.url, type: media.type, index, allMedia: contractor.mediaFiles})}>
                              {media.type === 'image' ? (
                                <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="relative w-full h-full">
                                  <video 
                                    src={media.url} 
                                    className="w-full h-full object-cover"
                                    muted
                                    preload="metadata"
                                  />
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <div className="bg-white/90 rounded-full p-2">
                                      <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          )) || <p className="text-gray-500 col-span-full">No media files uploaded</p>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="space-y-6">
                      {/* Company Logo Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Company Logo</label>
                        <div className="flex items-start space-x-4">
                          <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => logoInputRef.current?.click()}
                              style={antiYellowInputStyles}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Logo
                            </Button>
                            <input
                              ref={logoInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG</p>
                          </div>
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Company Name</label>
                          <Input
                            value={editForm.companyName}
                            onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
                            placeholder="Enter company name"
                            style={antiYellowInputStyles}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Hourly Rate ($)</label>
                          <Input
                            type="number"
                            value={editForm.hourlyRate}
                            onChange={(e) => setEditForm({...editForm, hourlyRate: parseFloat(e.target.value)})}
                            placeholder="0"
                            style={antiYellowInputStyles}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Phone</label>
                          <Input
                            value={editForm.phone}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            placeholder="Enter phone number"
                            style={antiYellowInputStyles}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Email</label>
                          <Input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            placeholder="Enter email address"
                            style={antiYellowInputStyles}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Owner Name</label>
                          <Input
                            value={editForm.ownerName}
                            onChange={(e) => setEditForm({...editForm, ownerName: e.target.value})}
                            placeholder="Enter owner name"
                            style={antiYellowInputStyles}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Instagram</label>
                          <Input
                            value={editForm.instagram}
                            onChange={(e) => setEditForm({...editForm, instagram: e.target.value})}
                            placeholder="Instagram username or URL"
                            style={antiYellowInputStyles}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Facebook</label>
                          <Input
                            value={editForm.facebook}
                            onChange={(e) => setEditForm({...editForm, facebook: e.target.value})}
                            placeholder="Facebook page URL"
                            style={antiYellowInputStyles}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Twitter</label>
                          <Input
                            value={editForm.twitter}
                            onChange={(e) => setEditForm({...editForm, twitter: e.target.value})}
                            placeholder="Twitter username or URL"
                            style={antiYellowInputStyles}
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Company Description</label>
                        <Textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          placeholder="Describe your company and services..."
                          rows={4}
                          style={antiYellowInputStyles}
                        />
                      </div>

                      {/* Specialties */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Specialties</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(editForm.specialties || []).map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {specialty}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeSpecialty(specialty)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {servicesLoading ? (
                            <div className="flex-1 p-2 text-sm text-gray-500 border rounded">
                              Loading service categories...
                            </div>
                          ) : servicesError ? (
                            <div className="flex-1 p-2 text-sm text-red-500 border rounded">
                              Error loading categories
                            </div>
                          ) : (
                            <select
                              className="flex-1 p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
                              style={antiYellowInputStyles}
                              value=""
                              onChange={(e) => {
                                try {
                                  const value = e.target.value;
                                  if (value && typeof value === 'string') {
                                    const currentSpecialties = Array.isArray(editForm.specialties) ? editForm.specialties : [];
                                    if (!currentSpecialties.includes(value)) {
                                      setEditForm(prev => ({
                                        ...prev,
                                        specialties: [...currentSpecialties, value]
                                      }));
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error adding specialty:', error);
                                }
                              }}
                            >
                              <option value="" disabled>Select specialty from service categories</option>
                              {Array.isArray(serviceCategories) && serviceCategories.length > 0 ? (
                                serviceCategories
                                  .filter((category: any) => {
                                    const currentSpecialties = Array.isArray(editForm.specialties) ? editForm.specialties : [];
                                    return category?.name && typeof category.name === 'string' && !currentSpecialties.includes(category.name);
                                  })
                                  .map((category: any) => (
                                    <option key={category.id || category.name} value={category.name}>
                                      {category.name}
                                    </option>
                                  ))
                              ) : (
                                <option value="" disabled>No categories available</option>
                              )}
                            </select>
                          )}
                        </div>
                        {serviceCategories.length === 0 && (
                          <p className="text-sm text-gray-500 mt-2">Loading service categories...</p>
                        )}
                      </div>

                      {/* Service Areas */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Service Areas</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {editForm.serviceAreas.map((area, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              {area}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeServiceArea(area)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newServiceArea}
                            onChange={(e) => setNewServiceArea(e.target.value)}
                            placeholder="Add service area"
                            onKeyPress={(e) => e.key === 'Enter' && addServiceArea()}
                            style={antiYellowInputStyles}
                          />
                          <Button type="button" onClick={addServiceArea} size="sm" style={antiYellowInputStyles}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Media Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Portfolio Media ({mediaFiles.length} files)</label>
                        {mediaFiles.length === 0 && (
                          <p className="text-sm text-gray-500 mb-2">No media files uploaded yet.</p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {mediaFiles.map((media, index) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square">
                              {media.type === 'image' ? (
                                <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                              ) : (
                                <video src={media.url} className="w-full h-full object-cover" />
                              )}
                              <div className="absolute top-2 right-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeMediaFile(index)}
                                  className="h-6 w-6 p-0"
                                  style={antiYellowInputStyles}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div 
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg aspect-square flex items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                            onClick={() => mediaInputRef.current?.click()}
                          >
                            <div className="text-center">
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Add Media</p>
                            </div>
                          </div>
                        </div>
                        <input
                          ref={mediaInputRef}
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handleMediaUpload}
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500">
                          <strong>Images:</strong> Max 10MB (JPG, PNG, GIF, WebP)<br/>
                          <strong>Videos:</strong> Max 50MB (MP4, WebM, MOV, AVI) - Up to 30 seconds recommended
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={handleCancelEdit} style={antiYellowInputStyles}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveProfile} 
                          disabled={updateContractorMutation.isPending}
                          style={antiYellowInputStyles}
                        >
                          {updateContractorMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sent Bids Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card style={antiYellowStyles}>
                <CardHeader>
                  <CardTitle>Sent Bids</CardTitle>
                  <CardDescription>View and manage all bids you've submitted to customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bidRequests.filter((bid: any) => bid.status === 'bid_sent' || bid.status === 'won' || bid.status === 'lost').length > 0 ? (
                      bidRequests.filter((bid: any) => bid.status === 'bid_sent' || bid.status === 'won' || bid.status === 'lost').map((project: any) => (
                        <div key={project.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{project.fullName}</h4>
                                <Badge variant={
                                  project.status === 'won' ? 'default' :
                                  project.status === 'bid_sent' ? 'secondary' : 
                                  project.status === 'lost' ? 'destructive' : 'outline'
                                }>
                                  {project.status === 'bid_sent' ? 'Bid Sent' : project.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-500" />
                                  <span>{project.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-500" />
                                  <span>{project.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                  <span>{project.address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-500" />
                                  <span>{project.serviceRequested}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <p className="text-sm"><span className="font-medium">Project Description:</span></p>
                            <p className="text-sm mt-1">{project.description}</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-300">
                              <span><strong>Timeline:</strong> {project.timeline}</span>
                              {project.budget && <span><strong>Budget:</strong> ${project.budget}</span>}
                              <span><strong>Bid Sent:</strong> {new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingBidDetails(project)}
                              style={antiYellowInputStyles}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            
                            {project.status === 'bid_sent' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => updateProjectStatusMutation.mutate({ requestId: project.id, status: 'won' })}
                                  disabled={updateProjectStatusMutation.isPending}
                                  style={antiYellowInputStyles}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Won Project
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                  onClick={() => updateProjectStatusMutation.mutate({ requestId: project.id, status: 'lost' })}
                                  disabled={updateProjectStatusMutation.isPending}
                                  style={antiYellowInputStyles}
                                >
                                  Lost Project
                                </Button>
                              </>
                            )}
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteBidRequestMutation.mutate(project.id)}
                              disabled={deleteBidRequestMutation.isPending}
                              style={antiYellowInputStyles}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 text-lg">No sent bids yet</p>
                        <p className="text-gray-400 text-sm">Bids you submit will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bids Tab */}
            <TabsContent value="bids" className="space-y-6">
              <Card style={antiYellowStyles}>
                <CardHeader>
                  <CardTitle>Bid Requests</CardTitle>
                  <CardDescription>Manage incoming bid requests and opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bidRequests.length > 0 ? (
                      bidRequests.filter((bid: any) => bid.status === 'pending' || bid.status === 'contacted').map((bid: any) => (
                        <div key={bid.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{bid.fullName}</h4>
                                <Badge variant={
                                  bid.status === 'pending' ? 'outline' :
                                  bid.status === 'contacted' ? 'secondary' : 'default'
                                }>
                                  {bid.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-500" />
                                  <span>{bid.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-500" />
                                  <span>{bid.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                  <span>{bid.address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-500" />
                                  <span>{bid.serviceRequested}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <p className="text-sm"><span className="font-medium">Project Description:</span></p>
                            <p className="text-sm mt-1">{bid.description}</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-300">
                              <span><strong>Timeline:</strong> {bid.timeline}</span>
                              {bid.budget && <span><strong>Budget:</strong> ${bid.budget}</span>}
                              <span><strong>Submitted:</strong> {new Date(bid.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingBidDetails(bid)}
                              style={antiYellowInputStyles}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            
                            {bid.status === 'pending' && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleContactCustomer(bid)}
                                style={antiYellowInputStyles}
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                Contact Customer
                              </Button>
                            )}
                            
                            {(bid.status === 'contacted' || bid.status === 'pending') && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => sendBidMutation.mutate(bid.id)}
                                disabled={sendBidMutation.isPending}
                                style={antiYellowInputStyles}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Send Bid
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteBidRequestMutation.mutate(bid.id)}
                              disabled={deleteBidRequestMutation.isPending}
                              style={antiYellowInputStyles}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 text-lg">No pending bid requests</p>
                        <p className="text-gray-400 text-sm">New customer requests will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>



            {/* Email Tab */}
            <TabsContent value="email" className="space-y-6">
              <Card style={antiYellowStyles}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Gmail Integration
                  </CardTitle>
                  <CardDescription>
                    Connect your Gmail account to send professional emails to potential clients directly from your contractor portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GmailIntegration 
                    contractorId={contractor?.id}
                    pendingContactEmail={pendingContactEmail}
                    onEmailSent={() => setPendingContactEmail(null)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-6">
              {/* Monthly Spending Cap Section */}
              <Card style={antiYellowStyles}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Monthly Referral Spending Cap
                  </CardTitle>
                  <CardDescription>
                    Set your maximum monthly budget for referral commission payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Current Cap:</span>
                      <span className="text-2xl font-bold text-blue-600">${monthlySpendCap}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>$0</span>
                        <span>$10,000</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={monthlySpendCap}
                        onChange={(e) => {
                          setMonthlySpendCap(parseInt(e.target.value));
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(monthlySpendCap / 10000) * 100}%, #e5e7eb ${(monthlySpendCap / 10000) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-500">Conservative</div>
                        <div className="text-sm font-medium">$500</div>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <div className="text-xs text-blue-500">Recommended</div>
                        <div className="text-sm font-medium">$2,500</div>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <div className="text-xs text-green-500">Aggressive</div>
                        <div className="text-sm font-medium">$5,000+</div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={async () => {
                        try {
                          await apiRequest('PATCH', `/api/contractors/${contractor?.id}`, {
                            monthlySpendCap: monthlySpendCap
                          });
                          toast({
                            title: "Spending Cap Updated",
                            description: `Monthly referral budget set to $${monthlySpendCap}`,
                          });
                        } catch (error) {
                          toast({
                            title: "Update Failed",
                            description: "Could not update spending cap. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="w-full"
                    >
                      Update Spending Cap
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Section */}
              <Card style={antiYellowStyles}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>
                    Add and verify your payment method for subscription billing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {contractor?.paymentMethodAdded ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-12 h-8 rounded text-white text-sm font-bold ${
                              contractor.cardBrand?.toLowerCase() === 'visa' ? 'bg-blue-600' :
                              contractor.cardBrand?.toLowerCase() === 'mastercard' ? 'bg-red-600' :
                              contractor.cardBrand?.toLowerCase() === 'amex' ? 'bg-green-600' :
                              contractor.cardBrand?.toLowerCase() === 'discover' ? 'bg-orange-600' :
                              'bg-gray-600'
                            }`}>
                              {contractor.cardBrand?.toUpperCase() || 'CARD'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {contractor.cardBrand ? 
                                  `${contractor.cardBrand.charAt(0).toUpperCase() + contractor.cardBrand.slice(1)} ••••${contractor.cardLast4 || '0000'}` :
                                  'Payment Method Verified'
                                }
                              </p>
                              <p className="text-sm text-gray-500">
                                {contractor.cardExpMonth && contractor.cardExpYear ?
                                  `${contractor.cardExpMonth.toString().padStart(2, '0')}/${contractor.cardExpYear}` :
                                  'Expires: --/--'
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleSubscriptionPayment}
                        disabled={isProcessingPayment}
                        variant="outline"
                        className="w-full"
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redirecting to Stripe...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Update Payment Method
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-8 w-8 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">Secure Payment Setup</p>
                            <p className="text-sm text-gray-600">Add your payment method through Stripe's secure checkout</p>
                          </div>
                        </div>
                      </div>
                  
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-blue-900">Secure Payment Verification</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              You'll be redirected to Stripe's secure payment page for a $1 verification charge. 
                              This amount will be automatically refunded once your payment method is verified. 
                              Your card information is encrypted and never stored on our servers.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleSubscriptionPayment}
                        disabled={isProcessingPayment}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redirecting to Stripe...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Add Payment Method Securely
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subscription Management Section */}
              <Card style={antiYellowStyles}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Subscription Management
                  </CardTitle>
                  <CardDescription>
                    Manage your active subscription
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-green-900">Active Subscription</h3>
                      <p className="text-sm text-green-700">Your account is active with full access to all features.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Plan:</span>
                        <span className="text-sm font-medium">Professional</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Next Billing:</span>
                        <span className="text-sm">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Commission Processing:</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">Automated</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Lead Priority:</span>
                        <span className="text-sm font-medium">High</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Profile Visibility:</span>
                        <span className="text-sm font-medium">Enhanced</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Button 
                      variant="destructive" 
                      onClick={cancelSubscription}
                      className="w-full"
                    >
                      Cancel Subscription
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Canceling will disable automated commission processing and reduce profile visibility.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard userRole="contractor" userId={contractor?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bid Details Modal */}
      {viewingBidDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Bid Request Details</h2>
                  <p className="text-gray-600">Customer: {viewingBidDetails.customerInfo?.name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingBidDetails(null)}
                  style={antiYellowInputStyles}
                >
                  Close
                </Button>
              </div>
              
              {/* Display bid details here */}
              <div className="space-y-4">
                <h4 className="font-semibold">Service: {viewingBidDetails.serviceCategory}</h4>
                <p><strong>Details:</strong> {viewingBidDetails.description}</p>
                <p><strong>Budget:</strong> {viewingBidDetails.budget}</p>
                <p><strong>Timeline:</strong> {viewingBidDetails.timeline}</p>
                <p><strong>Status:</strong> <Badge variant="outline">{viewingBidDetails.status}</Badge></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Viewer Modal */}
      {viewingMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingMedia(null)}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4">
              {viewingMedia.type === 'image' ? (
                <img 
                  src={viewingMedia.url} 
                  alt="Portfolio item" 
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              ) : (
                <div className="relative">
                  <video 
                    src={viewingMedia.url} 
                    controls
                    autoPlay
                    className="w-full h-auto max-h-[80vh] object-contain"
                    style={{ maxHeight: '80vh' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Tip:</strong> This video is limited to 30 seconds to showcase the contractor's work efficiently.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Navigation for multiple media */}
              {viewingMedia.allMedia && viewingMedia.allMedia.length > 1 && (
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const prevIndex = viewingMedia.index > 0 ? viewingMedia.index - 1 : viewingMedia.allMedia.length - 1;
                      const prevMedia = viewingMedia.allMedia[prevIndex];
                      setViewingMedia({
                        url: prevMedia.url,
                        type: prevMedia.type,
                        index: prevIndex,
                        allMedia: viewingMedia.allMedia
                      });
                    }}
                    disabled={viewingMedia.allMedia.length <= 1}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {viewingMedia.index + 1} of {viewingMedia.allMedia.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextIndex = viewingMedia.index < viewingMedia.allMedia.length - 1 ? viewingMedia.index + 1 : 0;
                      const nextMedia = viewingMedia.allMedia[nextIndex];
                      setViewingMedia({
                        url: nextMedia.url,
                        type: nextMedia.type,
                        index: nextIndex,
                        allMedia: viewingMedia.allMedia
                      });
                    }}
                    disabled={viewingMedia.allMedia.length <= 1}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorPortalEnhanced;