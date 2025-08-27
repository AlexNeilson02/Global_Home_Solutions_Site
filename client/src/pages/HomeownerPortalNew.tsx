import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-fixed';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import HomeownerBottomNav from '@/components/mobile/HomeownerBottomNav';
import ServiceSelection from '@/pages/ServiceSelection';
import BrowseServices from '@/pages/BrowseServices';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Edit2, Save, X, LogOut, User, Phone, Mail, MapPin, Calendar, ClipboardList } from 'lucide-react';
import BidRequestForm from '@/components/BidRequestForm';

export default function HomeownerPortalNew() {
  const { user, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('contractors');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const { toast } = useToast();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize profile form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  // Redirect if not a homeowner - but wait for auth to load first
  useEffect(() => {
    // Only redirect if authentication has finished loading and user is not a homeowner
    if (!isLoading && (!user || user.role !== 'homeowner')) {
      setLocation('/login');
    }
  }, [user, setLocation, isLoading]);

  // Fetch homeowner's bid requests
  const { data: bidRequestsData, isLoading: bidsLoading } = useQuery<{bidRequests: any[]}>({
    queryKey: ['/api/homeowners/bid-requests'],
    enabled: !!user && user.role === 'homeowner'
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', '/api/auth/update-profile', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Your profile has been updated successfully"
      });
      setIsEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleProfileSubmit = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  // Render Profile tab content
  const renderProfileContent = () => {
    if (!user) return null;

    return (
      <div className="min-h-screen flex flex-col pb-24">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button 
            onClick={() => handleTabChange('contractors')}
            className="p-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Profile</h1>
          <div className="w-10" />
        </div>

        {/* Profile Content */}
        <div className="flex-1 p-4 space-y-6">
          {/* Avatar and Name Section */}
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="h-24 w-24 border-2 border-gray-200">
              <AvatarImage src={user.avatarUrl || ''} />
              <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold">{user.fullName || 'User'}</h2>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>

          {/* Profile Information Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Personal Information</h3>
              {!isEditingProfile ? (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4 text-gray-600" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleProfileSubmit}
                    disabled={updateProfileMutation.isPending}
                    className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4 text-green-600" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileForm({
                        fullName: user.fullName || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        address: user.address || ''
                      });
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <User className="h-4 w-4" />
                  <span>Full Name</span>
                </div>
                {isEditingProfile ? (
                  <Input
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="font-medium">{user.fullName || 'Not set'}</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                {isEditingProfile ? (
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                ) : (
                  <p className="font-medium">{user.email}</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Phone className="h-4 w-4" />
                  <span>Phone</span>
                </div>
                {isEditingProfile ? (
                  <Input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="font-medium">{user.phone || 'Not set'}</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span>Address</span>
                </div>
                {isEditingProfile ? (
                  <Input
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="Enter your address"
                  />
                ) : (
                  <p className="font-medium">{user.address || 'Not set'}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Account Actions */}
          <div className="space-y-3">
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-3"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render Bids tab content
  const renderBidsContent = () => {
    return (
      <div className="min-h-screen flex flex-col pb-24">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button 
            onClick={() => handleTabChange('contractors')}
            className="p-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">My Bid Requests</h1>
          <div className="w-10" />
        </div>

        {/* Bids Content */}
        <div className="flex-1 p-4">
          {bidsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading bid requests...</div>
            </div>
          ) : bidRequestsData?.bidRequests && bidRequestsData.bidRequests.length > 0 ? (
            <div className="space-y-4">
              {bidRequestsData.bidRequests.map((bid: any) => (
                <Card key={bid.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{bid.serviceCategory?.name || 'Service Request'}</h3>
                      <p className="text-sm text-gray-500">
                        Submitted {new Date(bid.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      bid.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                      bid.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {bid.status}
                    </span>
                  </div>
                  
                  {bid.description && (
                    <p className="text-sm text-gray-600 mb-2">{bid.description}</p>
                  )}
                  
                  {bid.contractor && (
                    <div className="text-sm text-gray-500">
                      Assigned to: {bid.contractor.companyName}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ClipboardList className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 mb-1">No bid requests yet</p>
              <p className="text-sm text-gray-400">
                Request bids from contractors to see them here
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Show loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Mobile view with tabs
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Render different content based on active tab */}
        {activeTab === 'profile' && renderProfileContent()}
        {activeTab === 'bids' && renderBidsContent()}
        {activeTab === 'contractors' && <ServiceSelection />}
        {activeTab === 'services' && <BrowseServices />}

        {/* Bottom Navigation */}
        <HomeownerBottomNav 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
        />
      </div>
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome, {user.fullName || user.username}!</h2>
            <div className="space-y-2 text-sm">
              <p>Email: {user.email}</p>
              <p>Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="mt-4 w-full">
              Log Out
            </Button>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation('/browse-services')} 
                className="w-full"
              >
                Browse Services
              </Button>
              <Button 
                onClick={() => setLocation('/services')} 
                variant="outline"
                className="w-full"
              >
                Find Contractors
              </Button>
            </div>
          </Card>

          {/* Recent Bids */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Bid Requests</h3>
            {bidRequestsData?.bidRequests && bidRequestsData.bidRequests.length > 0 ? (
              <div className="space-y-2">
                {bidRequestsData.bidRequests.slice(0, 3).map((bid: any) => (
                  <div key={bid.id} className="text-sm">
                    <p className="font-medium">{bid.serviceCategory?.name}</p>
                    <p className="text-gray-500">{new Date(bid.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No bid requests yet</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}