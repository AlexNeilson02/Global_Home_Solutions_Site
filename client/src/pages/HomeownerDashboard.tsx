import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { usePlatform } from "@/contexts/PlatformContext";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { HomeownerProfileEdit } from "@/components/HomeownerProfileEdit";
import HomeownerBottomNav from "@/components/mobile/HomeownerBottomNav";
import { 
  Home, 
  Plus, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Mail,
  Phone,
  MapPin,
  Edit
} from "lucide-react";

interface BidRequest {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  servicesRequested: string[];
  description: string;
  timeline: string;
  budget?: string;
  status: string;
  createdAt: string;
  contractorId: number;
}

export default function HomeownerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { isMobileApp, isMobileWeb } = usePlatform();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("requests");

  // Fetch homeowner's bid requests
  const { data: bidRequests, isLoading } = useQuery<BidRequest[]>({
    queryKey: ['/api/homeowner/bid-requests'],
    retry: false,
    queryFn: async () => {
      const response = await fetch('/api/homeowner/bid-requests', {
        credentials: 'include' // Important for session-based auth
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Please log in again');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    }
  });

  const isMobile = isMobileApp || isMobileWeb;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'contacted':
      case 'sent':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'contacted':
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Welcome back!
                </h1>
                <p className="text-sm text-gray-500">Homeowner Dashboard</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="text-gray-600"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {!isMobile && (
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                My Requests
              </TabsTrigger>
              <TabsTrigger value="new-request" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Request
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
            </TabsList>
          )}

          {/* My Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Service Requests</h2>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : bidRequests && bidRequests.length > 0 ? (
                <div className="space-y-4">
                  {bidRequests.map((request) => (
                    <Card key={request.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {request.servicesRequested.join(", ")}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(request.status)}
                              <Badge className={getStatusColor(request.status)}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(request.createdAt)}
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {request.address}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Timeline: {request.timeline}
                          </div>
                          {request.budget && (
                            <div className="text-sm">
                              Budget: {request.budget}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{request.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No service requests yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Get started by creating your first service request.
                    </p>
                    <Button 
                      onClick={() => setLocation('/homeowner/request-service')}
                      className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Request
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {!isMobile && (
            <TabsContent value="new-request">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Request Home Services</h2>
                <Card>
                  <CardContent className="p-8 text-center">
                    <Plus className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Create New Service Request
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Find contractors for your home improvement needs.
                    </p>
                    <Button 
                      className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                      onClick={() => setLocation('/homeowner/request-service')}
                    >
                      Request Services
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Manage your account details and contact information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">{user?.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Username</label>
                      <p className="mt-1 text-sm text-gray-900">{user?.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{user?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <HomeownerProfileEdit />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <>
          <HomeownerBottomNav 
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (tab === 'contractors') {
                setLocation('/homeowner/contractors');
              } else if (tab === 'services') {
                setLocation('/homeowner/services');
              } else {
                setActiveTab(tab);
              }
            }}
          />
          {/* Floating Action Button for Creating Requests */}
          <div className="fixed bottom-20 right-4 z-40">
            <Button 
              size="lg"
              className="bg-[#2563eb] hover:bg-[#1d4ed8] rounded-full h-14 w-14 shadow-lg"
              onClick={() => setLocation('/homeowner/request-service')}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}