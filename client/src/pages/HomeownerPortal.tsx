import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Calendar, DollarSign, Search, Plus, Edit2, Save, X, Building2, Wrench } from 'lucide-react';
import { useLocation } from 'wouter';

interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
}

interface BidRequest {
  id: number;
  serviceType: string;
  description: string;
  status: string;
  createdAt: string;
  budget?: string;
}

interface Contractor {
  id: number;
  companyName: string;
  logoUrl?: string;
  description: string;
  services: string[];
  rating?: number;
  location?: string;
}

interface ServiceCategory {
  category: string;
  services: string[];
}

export default function HomeownerPortal() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: ''
  });
  const [bidRequests, setBidRequests] = useState<BidRequest[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
    fetchBidRequests();
    fetchContractors();
    fetchServices();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/user', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setFormData({
          fullName: data.fullName || '',
          phone: data.phone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBidRequests = async () => {
    try {
      const response = await fetch('/api/homeowner/bid-requests', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setBidRequests(data);
      }
    } catch (error) {
      console.error('Error fetching bid requests:', error);
    }
  };

  const fetchContractors = async () => {
    try {
      const response = await fetch('/api/contractors', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setContractors(data.contractors || []);
      }
    } catch (error) {
      console.error('Error fetching contractors:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/service-categories', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        // Group services by category
        const grouped = groupServicesByCategory(data.services || []);
        setServices(grouped);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const groupServicesByCategory = (serviceList: any[]) => {
    const categories: { [key: string]: string[] } = {
      'Construction & Remodeling': [],
      'Electrical & Plumbing': [],
      'Outdoor & Landscaping': [],
      'Interior Services': [],
      'Maintenance & Repair': [],
      'Specialty Services': []
    };

    serviceList.forEach(service => {
      const name = service.name;
      if (name.includes('Kitchen') || name.includes('Bath') || name.includes('Room Addition') || name.includes('Remodel')) {
        categories['Construction & Remodeling'].push(name);
      } else if (name.includes('Electrical') || name.includes('Plumbing') || name.includes('HVAC')) {
        categories['Electrical & Plumbing'].push(name);
      } else if (name.includes('Landscape') || name.includes('Pool') || name.includes('Fence') || name.includes('Deck') || name.includes('Patio')) {
        categories['Outdoor & Landscaping'].push(name);
      } else if (name.includes('Floor') || name.includes('Paint') || name.includes('Window') || name.includes('Door')) {
        categories['Interior Services'].push(name);
      } else if (name.includes('Repair') || name.includes('Maintenance') || name.includes('Clean')) {
        categories['Maintenance & Repair'].push(name);
      } else {
        categories['Specialty Services'].push(name);
      }
    });

    return Object.entries(categories)
      .filter(([_, services]) => services.length > 0)
      .map(([category, services]) => ({ category, services }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditMode(false);
        toast({
          title: "Success",
          description: "Profile updated successfully"
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">🏠 NEW HOMEOWNER PORTAL 🏠</h1>
              <span className="text-red-100">Welcome, {user?.fullName || user?.username}</span>
            </div>
            <Button onClick={handleLogout} className="bg-white text-red-600 hover:bg-gray-100">
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="requests">My Requests</TabsTrigger>
            <TabsTrigger value="contractors">Contractors</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Profile Picture Section */}
                  <div className="flex items-center gap-6 pb-6 border-b">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{user?.fullName}</h3>
                      <p className="text-gray-500">@{user?.username}</p>
                      <p className="text-gray-500">{user?.email}</p>
                    </div>
                  </div>

                  {/* Editable Fields */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium">Personal Information</h4>
                      {!editMode ? (
                        <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button onClick={handleSaveProfile} size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button onClick={() => {
                            setEditMode(false);
                            setFormData({
                              fullName: user?.fullName || '',
                              phone: user?.phone || ''
                            });
                          }} variant="outline" size="sm">
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        {editMode ? (
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900">{user?.fullName || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        {editMode ? (
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900">{user?.phone || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <Label>Email</Label>
                        <p className="mt-1 text-gray-900">{user?.email}</p>
                      </div>

                      <div>
                        <Label>Username</Label>
                        <p className="mt-1 text-gray-900">{user?.username}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bid Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>My Service Requests</CardTitle>
                    <CardDescription>Track your submitted service requests</CardDescription>
                  </div>
                  <Button onClick={() => setLocation('/homeowner/request-service')} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Request
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bidRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No service requests yet</p>
                    <Button onClick={() => setLocation('/homeowner/request-service')}>
                      Create Your First Request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bidRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{request.serviceType}</h4>
                            <p className="text-gray-600 text-sm mt-1">{request.description}</p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(request.createdAt).toLocaleDateString()}
                              </span>
                              {request.budget && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  {request.budget}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contractors Tab */}
          <TabsContent value="contractors">
            <Card>
              <CardHeader>
                <CardTitle>Browse Contractors</CardTitle>
                <CardDescription>Find trusted contractors for your projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {contractors.map((contractor) => (
                    <div key={contractor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                         onClick={() => setLocation(`/contractor/${contractor.id}`)}>
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {contractor.logoUrl ? (
                            <img src={contractor.logoUrl} alt={contractor.companyName} className="w-full h-full object-contain rounded-lg" />
                          ) : (
                            <Building2 className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{contractor.companyName}</h4>
                          {contractor.location && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {contractor.location}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{contractor.description}</p>
                          <div className="flex flex-wrap gap-1 mt-3">
                            {contractor.services.slice(0, 3).map((service, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                            {contractor.services.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{contractor.services.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Available Services</CardTitle>
                <CardDescription>Browse our comprehensive list of home services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {services.map((category) => (
                    <div key={category.category}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-blue-600" />
                        {category.category}
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {category.services.map((service, idx) => (
                          <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                               onClick={() => setLocation('/homeowner/request-service')}>
                            <p className="text-sm font-medium text-gray-700">{service}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}