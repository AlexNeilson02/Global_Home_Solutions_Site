import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useSalesperson } from "@/contexts/SalespersonContext";
import { useSalespersonNavigation } from "@/hooks/useSalespersonNavigation";
import BidRequestForm from "@/components/BidRequestForm";
import HomeownerBottomNav from "@/components/mobile/HomeownerBottomNav";
import { TouchOptimizedButton } from "@/components/mobile/TouchOptimizations";
import { useAuth } from "@/lib/auth-fixed";
import ServiceSelection from "@/pages/ServiceSelection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  FileText,
  Loader2,
  DollarSign,
  Settings,
  ChevronLeft,
  Heart,
  Download,
  ChevronRight
} from "lucide-react";
import logoPath from "@/assets/global-home-solutions-logo.png";
import heroBackgroundImage from "@/assets/ghs-office-front.png";
import mobileHeroImage from "@assets/global home mobile 1_1754514857525.png";
import "../styles/HomePage.css";

interface HomePageProps {
  isHomeownerLoggedIn?: boolean;
  homeownerData?: any;
}

export default function HomePage({ isHomeownerLoggedIn = false, homeownerData }: HomePageProps = {}) {
  const { navigateWithSalesperson } = useSalespersonNavigation();
  const { salespersonId } = useSalesperson();
  const authContext = useAuth();
  const { user, logout, isLoading } = authContext;
  
  const [isMobile, setIsMobile] = useState(false);
  const [trackingComplete, setTrackingComplete] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('contractors');
  
  // Handle hash-based navigation for mobile tabs
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove the # symbol
    if (hash && ['contractors', 'services', 'bids', 'profile'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Page visit tracking for ?ref=username
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    
    // Only track if we have ref parameter and haven't tracked yet
    if (refParam && !trackingComplete && !trackingLoading) {
      setTrackingLoading(true);
      console.log('🔄 Starting page visit tracking for ref:', refParam);
      
      const trackVisit = async (retryCount = 0) => {
        try {
          console.log(`📡 Attempt ${retryCount + 1}: Making track-visit API call...`);
          
          const response = await apiRequest('POST', '/api/track-visit', {
            salespersonProfileUrl: refParam,
            userAgent: navigator.userAgent,
            referrer: document.referrer
          });
          
          if (response.ok) {
            console.log('✅ Page visit tracked successfully for ref:', refParam);
            setTrackingComplete(true);
          } else {
            throw new Error(`Track visit failed with status: ${response.status}`);
          }
        } catch (error) {
          console.error(`❌ Track visit attempt ${retryCount + 1} failed:`, error);
          
          // Retry up to 2 times with exponential backoff
          if (retryCount < 2) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`🔄 Retrying in ${delay}ms...`);
            setTimeout(() => trackVisit(retryCount + 1), delay);
          } else {
            console.error('❌ All tracking attempts failed for ref:', refParam);
            setTrackingComplete(true); // Allow page to work without tracking
            setTrackingLoading(false); // Clear loading state when all attempts fail
          }
        } finally {
          if (retryCount === 0) {
            setTrackingLoading(false);
          }
        }
      };
      
      trackVisit();
    } else if (!refParam) {
      // No ref parameter, mark tracking as complete
      console.log('ℹ️ No ref parameter found - no visit tracking needed');
      setTrackingComplete(true);
    }
  }, [trackingComplete, trackingLoading]);

  // Fetch homeowner's bid requests
  const { data: bidRequestsData, isLoading: bidsLoading } = useQuery<{bidRequests: any[]}>({
    queryKey: ['/api/homeowners/bid-requests'],
    enabled: !!user && user.role === 'homeowner'
  });

  const bidRequests = bidRequestsData?.bidRequests || [];

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest("PATCH", "/api/homeowners/profile", profileData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
        duration: 2000,
      });
      setIsEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  // Initialize form with user data
  useEffect(() => {
    if (user && !isEditingProfile) {
      setProfileForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user, isEditingProfile]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate(profileForm);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'contacted': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'declined': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const currentHeroImage = isMobile ? mobileHeroImage : heroBackgroundImage;

  // Render Profile Content (Mobile Only)
  const renderProfileContent = () => (
    <div className="fixed inset-0 bg-white z-40 overflow-y-auto block sm:hidden">
      <div className="min-h-screen flex flex-col pb-24">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('contractors')}
            className="p-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">My Profile</h1>
          <button className="p-2">
            <Settings className="h-6 w-6" />
          </button>
        </div>

        {!isEditingProfile ? (
          <>
            {/* Profile Card */}
            <div className="p-4">
              <Card className="border-gray-200">
                <CardContent className="pt-8 pb-6">
                  <div className="flex flex-col items-center">
                    {/* Avatar */}
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <User className="h-10 w-10 text-gray-500" />
                    </div>
                    
                    {/* Name and Email */}
                    <h2 className="text-xl font-semibold mb-1">
                      {user?.fullName || user?.username || 'User'}
                    </h2>
                    <p className="text-gray-500 text-sm mb-6">
                      {user?.email || 'email@example.com'}
                    </p>
                    
                    {/* Edit Profile Button */}
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Menu Items */}
            <div className="px-4 space-y-2">
              <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-gray-600" />
                  <span className="text-base">Favourites</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
              
              <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Download className="h-5 w-5 text-gray-600" />
                  <span className="text-base">Downloads</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </>
        ) : (
          <div className="p-4">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    disabled={profileMutation.isPending}
                  >
                    {profileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileForm({
                        fullName: user?.fullName || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        address: user?.address || ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          </div>
        )}
      </div>
    </div>
  );

  // Render Bids Content (Mobile Only)
  const renderBidsContent = () => (
    <div className="fixed inset-0 bg-white z-40 overflow-y-auto block sm:hidden">
      <div className="min-h-screen flex flex-col pb-24">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">My Bid Requests</h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4">
          {bidsLoading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : bidRequests.length > 0 ? (
              <div className="space-y-4">
                {bidRequests.map((bid: any) => (
                  <div key={bid.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-5 w-5 text-gray-500" />
                          <h3 className="font-semibold text-lg">
                            {bid.contractor?.companyName || 'Contractor'}
                          </h3>
                        </div>
                        <Badge className={`${getStatusColor(bid.status)} flex items-center space-x-1 w-fit`}>
                          {getStatusIcon(bid.status)}
                          <span className="capitalize">{bid.status}</span>
                        </Badge>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>Requested: {new Date(bid.createdAt).toLocaleDateString()}</p>
                        {bid.lastUpdated && (
                          <p>Updated: {new Date(bid.lastUpdated).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Services Requested</p>
                        <p className="text-gray-900">{bid.servicesRequested?.join(', ') || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Timeline</p>
                        <p className="text-gray-900">{bid.timeline || 'N/A'}</p>
                      </div>
                      {bid.budget && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Budget</p>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <p className="text-gray-900">{bid.budget}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Project Description</p>
                      <p className="text-gray-900 text-sm">{bid.description || 'No description provided'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No bid requests yet</h3>
                <p className="text-gray-500 text-center">
                  Submit your first bid request to get started with finding contractors.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );

  // Check if we should show tab content instead of main page
  const shouldShowTabContent = user && user.role === 'homeowner' && 
    ['contractors', 'services', 'profile', 'bids'].includes(activeTab);

  // Redirect to services page when services tab is active
  useEffect(() => {
    if (user && user.role === 'homeowner' && activeTab === 'services') {
      navigateWithSalesperson('/services');
    }
  }, [activeTab, user]);

  return (
    <div className="homepage-container full-height smooth-scroll" style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Only show main content if not viewing tabs */}
      {!shouldShowTabContent && (
        <>
      {/* About Us Link */}
      <Link 
        href="/about"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: 'white',
          textDecoration: 'none',
          fontSize: '16px',
          fontWeight: '600',
          zIndex: 20,
          padding: '12px 20px',
          borderRadius: '25px',
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}
        className="hover:bg-blue-600/80 hover:scale-105 hover:shadow-lg"
      >
        About Us
      </Link>

      {/* Logout Button - Only show when user is logged in */}
      {user && (
        <button
          onClick={async () => {
            console.log('[HOME] Logging out user...');
            await logout();
            queryClient.clear();
            toast({
              title: "Logged Out",
              description: "You have been logged out successfully.",
            });
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            color: 'white',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '600',
            zIndex: 20,
            padding: '12px 20px',
            borderRadius: '25px',
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer'
          }}
          className="hover:bg-red-600/90 hover:scale-105 hover:shadow-lg"
        >
          Logout ({user.username})
        </button>
      )}

      
      <header className="hero-header">
        <div className="hero-image-container">
          <img 
            src={currentHeroImage} 
            alt="Home Construction Background" 
            className="hero-background-image"
          />
        </div>
      </header>
      <div style={{ 
        position: 'absolute', 
        bottom: isMobile ? '12%' : '8%', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 10,
        textAlign: 'center'
      }}>
        {isMobile ? (
          <TouchOptimizedButton
            onClick={() => navigateWithSalesperson('/services')}
            size="lg"
            className="find-contractor-btn touch-target no-select tap-highlight"
            style={{ backgroundColor: '#00adee', borderColor: '#00adee' }}
          >
            Find a Contractor
          </TouchOptimizedButton>
        ) : (
          <button 
            onClick={() => navigateWithSalesperson('/services')}
            className="find-contractor-btn"
          >
            Find a Contractor
          </button>
        )}
        
        {/* Login text under button */}
        {!user && (
          <div style={{ marginTop: '16px' }}>
            <span 
              onClick={() => navigateWithSalesperson('/login')}
              style={{
                color: 'white',
                fontSize: isMobile ? '14px' : '12px',
                cursor: 'pointer',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                textDecoration: 'underline'
              }}
              className="hover:text-blue-200 transition-colors touch-target"
            >
              Have an account? Log in
            </span>
          </div>
        )}

        {/* Logout text for logged in users */}
        {user && (
          <div style={{ marginTop: '16px' }}>
            <span 
              onClick={logout}
              style={{
                color: 'white',
                fontSize: isMobile ? '14px' : '12px',
                cursor: 'pointer',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                textDecoration: 'underline'
              }}
              className="hover:text-blue-200 transition-colors touch-target"
            >
              Logout
            </span>
          </div>
        )}
      </div>
      </>
      )}

      {/* Render tab content for homeowners */}
      {user && user.role === 'homeowner' && activeTab === 'profile' && renderProfileContent()}
      {user && user.role === 'homeowner' && activeTab === 'bids' && renderBidsContent()}
      {user && user.role === 'homeowner' && activeTab === 'contractors' && (
        <ServiceSelection />
      )}

      {/* Show bottom navigation only for homeowners on mobile */}
      {user && user.role === 'homeowner' && (
        <HomeownerBottomNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
}