import { useState, useEffect } from "react";
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
import { 
  QrCode, 
  Users, 
  TrendingUp, 
  Target, 
  Phone, 
  Mail, 
  ExternalLink,
  Download,
  Copy,
  Edit3,
  Plus,
  X,
  Eye,
  MapPin,
  Calendar,
  BarChart3,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { CommissionDashboard } from "@/components/CommissionDashboard";

const SalesPortalEnhanced: React.FC = () => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Style object to remove yellow coloring - Solution #2
  const antiYellowStyles = {
    backgroundColor: 'white',
    color: 'black',
    outline: 'none',
    outlineColor: 'transparent',
    outlineWidth: '0',
    outlineStyle: 'none',
    border: '1px solid #d1d5db',
    boxShadow: 'none'
  } as const;

  // Enhanced style for inputs and interactive elements
  const antiYellowInputStyles = {
    backgroundColor: 'white',
    color: 'black',
    outline: 'none',
    outlineColor: 'transparent',
    outlineWidth: '0',
    outlineStyle: 'none',
    border: '2px solid #d1d5db',
    boxShadow: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none'
  } as const;
  const [profileForm, setProfileForm] = useState({
    bio: '',
    specialties: [] as string[],
    certifications: [] as string[],
    yearsExperience: 0,
    phone: '',
    email: ''
  });
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [landingPageUrl, setLandingPageUrl] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  const { data: userData } = useQuery({
    queryKey: ['/api/users/me'],
    enabled: true
  });

  const salesperson = userData?.roleData;
  const user = userData;

  // Get salesperson analytics
  const { data: analyticsData } = useQuery({
    queryKey: [`/api/salespersons/${salesperson?.id}/analytics`],
    enabled: !!salesperson?.id
  });

  // Get salesperson bid requests
  const { data: bidRequestsData } = useQuery({
    queryKey: [`/api/salespersons/${salesperson?.id}/bid-requests`],
    enabled: !!salesperson?.id
  });

  // Get QR code data
  const { data: qrCodeResponse } = useQuery({
    queryKey: [`/api/salespersons/${salesperson?.id}/qrcode`],
    enabled: !!salesperson?.id
  });

  const analytics = analyticsData?.analytics;
  const bidRequests = bidRequestsData?.bidRequests || [];
  const recentBidRequests = analyticsData?.recentBidRequests || [];
  const visitStats = analyticsData?.visitStats;
  
  // Set QR code and landing page data
  useEffect(() => {
    if (qrCodeResponse) {
      setQrCodeData(qrCodeResponse.qrCode);
      setLandingPageUrl(qrCodeResponse.landingPageUrl);
    }
  }, [qrCodeResponse]);

  // Initialize profile form
  useEffect(() => {
    if (salesperson && user) {
      setProfileForm({
        bio: salesperson.bio || '',
        specialties: salesperson.specialties || [],
        certifications: salesperson.certifications || [],
        yearsExperience: salesperson.yearsExperience || 0,
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  }, [salesperson, user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await fetch(`/api/salespersons/${salesperson?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated!",
        description: "Your sales profile has been successfully updated.",
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
    updateProfileMutation.mutate(profileForm);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    if (salesperson && user) {
      setProfileForm({
        bio: salesperson.bio || '',
        specialties: salesperson.specialties || [],
        certifications: salesperson.certifications || [],
        yearsExperience: salesperson.yearsExperience || 0,
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  };

  // Add/remove specialties and certifications
  const addSpecialty = () => {
    if (newSpecialty.trim() && !profileForm.specialties.includes(newSpecialty.trim())) {
      setProfileForm({
        ...profileForm,
        specialties: [...profileForm.specialties, newSpecialty.trim()]
      });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setProfileForm({
      ...profileForm,
      specialties: profileForm.specialties.filter(s => s !== specialty)
    });
  };

  const addCertification = () => {
    if (newCertification.trim() && !profileForm.certifications.includes(newCertification.trim())) {
      setProfileForm({
        ...profileForm,
        certifications: [...profileForm.certifications, newCertification.trim()]
      });
      setNewCertification('');
    }
  };

  const removeCertification = (certification: string) => {
    setProfileForm({
      ...profileForm,
      certifications: profileForm.certifications.filter(c => c !== certification)
    });
  };

  // Copy QR code or profile URL to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    });
  };

  // Download QR code
  const downloadQRCode = () => {
    if (qrCodeData) {
      const link = document.createElement('a');
      link.href = qrCodeData;
      link.download = `${salesperson?.profileUrl || 'qrcode'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Calculate key metrics
  const totalVisits = analytics?.totalVisits || 0;
  const totalConversions = analytics?.conversions || 0;
  const conversionRate = totalVisits > 0 && !isNaN(totalConversions) ? ((totalConversions / totalVisits) * 100).toFixed(1) : '0.0';
  const totalLeads = salesperson?.totalLeads || 0;
  const commissionEarnings = salesperson?.commissions || 0;

  // Mock performance data for charts
  const performanceData = [
    { month: 'Jan', visits: 145, conversions: 12, leads: 28 },
    { month: 'Feb', visits: 152, conversions: 18, leads: 35 },
    { month: 'Mar', visits: 148, conversions: 15, leads: 32 },
    { month: 'Apr', visits: 161, conversions: 22, leads: 41 },
    { month: 'May', visits: 155, conversions: 19, leads: 38 },
    { month: 'Jun', visits: 167, conversions: 25, leads: 45 }
  ];

  const statusDistribution = [
    { name: 'Pending', value: bidRequests.filter((b: any) => b.status === 'pending').length, color: '#f59e0b' },
    { name: 'Contacted', value: bidRequests.filter((b: any) => b.status === 'contacted').length, color: '#3b82f6' },
    { name: 'Completed', value: bidRequests.filter((b: any) => b.status === 'completed').length, color: '#10b981' }
  ];

  const profileUrl = salesperson?.profileUrl ? 
    `${window.location.origin}/salesperson/${salesperson.profileUrl}` : '';

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{ 
        backgroundColor: 'rgb(249 250 251)', 
        outline: 'none',
        outlineColor: 'transparent'
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Sales Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Welcome back, {user?.fullName || 'Sales Representative'}
              </p>
            </div>
            <Button onClick={() => logoutMutation.mutate()} variant="outline" disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? "Logging out..." : "Back to Portals"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="qr-tools">QR & Tools</TabsTrigger>
              <TabsTrigger value="leads">My Leads</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card style={antiYellowStyles}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalVisits}</div>
                    <p className="text-xs text-muted-foreground">Profile page views</p>
                  </CardContent>
                </Card>

                <Card style={antiYellowStyles}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalConversions}</div>
                    <p className="text-xs text-muted-foreground">{conversionRate}% conversion rate</p>
                  </CardContent>
                </Card>

                <Card style={antiYellowStyles}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalLeads}</div>
                    <p className="text-xs text-muted-foreground">Generated leads</p>
                  </CardContent>
                </Card>

                <Card style={antiYellowStyles}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Commissions</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${commissionEarnings.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total earnings</p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Chart */}
              <Card style={antiYellowStyles}>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Your monthly performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="visits" fill="#3b82f6" name="Visits" />
                      <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
                      <Bar dataKey="leads" fill="#f59e0b" name="Leads" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card style={antiYellowStyles}>
                <CardHeader>
                  <CardTitle>Recent Bid Requests</CardTitle>
                  <CardDescription>Latest potential leads from your referrals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bidRequests.length > 0 ? (
                      bidRequests.slice(0, 5).map((bid: any) => (
                        <div key={bid.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{bid.fullName}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{bid.serviceRequested}</p>
                            <p className="text-xs text-gray-500">{new Date(bid.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge variant={
                            bid.status === 'completed' ? 'default' :
                            bid.status === 'contacted' ? 'secondary' : 'outline'
                          }>
                            {bid.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-gray-500">No recent bid requests</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card style={antiYellowStyles}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Sales Profile</CardTitle>
                    <CardDescription>Manage your professional information and credentials</CardDescription>
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
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Contact Information</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{user?.phone || 'No phone number'}</span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{user?.email || 'No email'}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Experience</h4>
                          <p className="text-2xl font-bold">{salesperson?.yearsExperience || 0} years</p>
                          <p className="text-sm text-gray-500">Industry experience</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Bio */}
                      <div>
                        <h4 className="font-medium mb-2">Professional Bio</h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {salesperson?.bio || 'No bio available. Add a professional bio to help customers understand your expertise.'}
                        </p>
                      </div>

                      {/* Specialties */}
                      <div>
                        <h4 className="font-medium mb-3">Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                          {salesperson?.specialties?.map((specialty: string, index: number) => (
                            <Badge key={index} variant="secondary">{specialty}</Badge>
                          )) || <span className="text-gray-500">No specialties listed</span>}
                        </div>
                      </div>

                      {/* Certifications */}
                      <div>
                        <h4 className="font-medium mb-3">Certifications</h4>
                        <div className="flex flex-wrap gap-2">
                          {salesperson?.certifications?.map((cert: string, index: number) => (
                            <Badge key={index} variant="outline">{cert}</Badge>
                          )) || <span className="text-gray-500">No certifications listed</span>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="space-y-6">
                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Phone Number</label>
                          <Input
                            style={antiYellowInputStyles}
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Years of Experience</label>
                          <Input
                            style={antiYellowInputStyles}
                            type="number"
                            value={profileForm.yearsExperience}
                            onChange={(e) => setProfileForm({...profileForm, yearsExperience: parseInt(e.target.value) || 0})}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Professional Bio</label>
                        <Textarea
                          style={antiYellowInputStyles}
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                          placeholder="Describe your experience, approach, and what makes you a great sales representative..."
                          rows={4}
                        />
                      </div>

                      {/* Specialties */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Specialties</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {profileForm.specialties.map((specialty, index) => (
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
                          <Input
                            style={antiYellowInputStyles}
                            value={newSpecialty}
                            onChange={(e) => setNewSpecialty(e.target.value)}
                            placeholder="Add specialty (e.g., Roofing, HVAC)"
                            onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                          />
                          <Button type="button" onClick={addSpecialty} size="sm" style={antiYellowInputStyles}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Certifications */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Certifications</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {profileForm.certifications.map((cert, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              {cert}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeCertification(cert)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            style={antiYellowInputStyles}
                            value={newCertification}
                            onChange={(e) => setNewCertification(e.target.value)}
                            placeholder="Add certification"
                            onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                          />
                          <Button type="button" onClick={addCertification} size="sm" style={antiYellowInputStyles}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={handleCancelEdit} style={antiYellowInputStyles}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveProfile} 
                          disabled={updateProfileMutation.isPending}
                          style={antiYellowInputStyles}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* QR Tools Tab */}
            <TabsContent value="qr-tools" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* QR Code Card */}
                <Card style={antiYellowStyles}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      Your QR Code
                    </CardTitle>
                    <CardDescription>Use this QR code for quick access to your landing page</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {qrCodeData ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="bg-white p-4 rounded-lg border">
                          <img 
                            src={qrCodeData} 
                            alt="QR Code" 
                            className="w-48 h-48"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={downloadQRCode} variant="outline" style={antiYellowInputStyles}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button 
                            onClick={() => copyToClipboard(qrCodeData, 'QR Code URL')}
                            variant="outline"
                            style={antiYellowInputStyles}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">QR Code not available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Profile URL Card */}
                <Card style={antiYellowStyles}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      Landing Page
                    </CardTitle>
                    <CardDescription>Your personalized landing page for lead generation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Profile URL</label>
                      <div className="flex gap-2">
                        <Input 
                          value={profileUrl} 
                          readOnly 
                          className="flex-1"
                          style={antiYellowInputStyles}
                        />
                        <Button 
                          onClick={() => copyToClipboard(profileUrl, 'Profile URL')}
                          variant="outline"
                          size="sm"
                          style={antiYellowInputStyles}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">NFC ID</label>
                      <div className="flex gap-2">
                        <Input 
                          value={salesperson?.nfcId || ''} 
                          readOnly 
                          className="flex-1"
                          style={antiYellowInputStyles}
                        />
                        <Button 
                          onClick={() => copyToClipboard(salesperson?.nfcId || '', 'NFC ID')}
                          variant="outline"
                          size="sm"
                          style={antiYellowInputStyles}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {profileUrl && (
                      <div className="pt-4">
                        <Button 
                          onClick={() => window.open(profileUrl, '_blank')}
                          className="w-full"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview Landing Page
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Usage Instructions */}
              <Card style={antiYellowStyles}>
                <CardHeader>
                  <CardTitle>How to Use Your Sales Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <QrCode className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                      <h4 className="font-medium mb-2">QR Code</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Print and display your QR code at events, on business cards, or marketing materials for instant access.
                      </p>
                    </div>
                    <div className="text-center">
                      <ExternalLink className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <h4 className="font-medium mb-2">Landing Page</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Share your personalized URL via text, email, or social media to direct prospects to your landing page.
                      </p>
                    </div>
                    <div className="text-center">
                      <Phone className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                      <h4 className="font-medium mb-2">NFC Technology</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Use NFC-enabled devices to instantly share your profile with prospects by simply tapping their phone.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leads Tab */}
            <TabsContent value="leads" className="space-y-6">
              <Card style={antiYellowStyles}>
                <CardHeader>
                  <CardTitle>My Generated Leads</CardTitle>
                  <CardDescription>Track all leads generated through your sales activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bidRequests.length > 0 ? (
                      bidRequests.map((bid: any) => (
                        <div key={bid.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold">{bid.fullName}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{bid.serviceRequested}</p>
                              <p className="text-xs text-gray-500 mt-1">{bid.description}</p>
                            </div>
                            <Badge variant={
                              bid.status === 'completed' ? 'default' :
                              bid.status === 'contacted' ? 'secondary' : 'outline'
                            }>
                              {bid.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{bid.phone}</span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{bid.email}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{bid.address}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{new Date(bid.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {bid.budget && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Budget:</span> {bid.budget}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No leads generated yet</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Start sharing your QR code or profile URL to generate leads
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commissions Tab */}
            <TabsContent value="commissions" className="space-y-6">
              <CommissionDashboard salespersonId={salesperson?.id} />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard userRole="salesperson" userId={salesperson?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SalesPortalEnhanced;