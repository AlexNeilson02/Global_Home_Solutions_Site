import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { 
  CreditCard,
  Upload,
  X,
  Play,
  Image as ImageIcon,
  FileVideo,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Edit,
  Save,
  Building
} from "lucide-react";

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "$0";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface MediaFile {
  url: string;
  type: 'image' | 'video';
  name: string;
}

// Sample bid requests data
const sampleBidRequests = [
  {
    id: 1,
    customer: "John Smith",
    contact: "john.smith@email.com | (555) 123-4567",
    details: "Kitchen renovation - full remodel with new cabinets and countertops",
    status: "pending"
  },
  {
    id: 2,
    customer: "Sarah Johnson",
    contact: "sarah.j@email.com | (555) 987-6543",
    details: "Bathroom upgrade - new tile, vanity, and lighting fixtures",
    status: "contacted"
  },
  {
    id: 3,
    customer: "Mike Davis",
    contact: "mike.davis@email.com | (555) 456-7890",
    details: "Basement finishing - flooring, drywall, and electrical work",
    status: "quoted"
  }
];

function ContractorDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImageRef = useRef<HTMLInputElement>(null);
  
  const [spendCap, setSpendCap] = useState([1000]);
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);
  const [paymentMethodAdded, setPaymentMethodAdded] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    companyName: '',
    description: '',
    specialties: [] as string[],
    logoUrl: '',
    hourlyRate: 0
  });

  // Get contractor data
  const { data: userData, isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ["/api/users/me"],
  });

  const contractorData = userData?.roleData;

  // Populate form when contractor data loads
  useEffect(() => {
    if (contractorData) {
      setProfileForm({
        companyName: contractorData.companyName || '',
        description: contractorData.description || '',
        specialties: contractorData.specialties || [],
        logoUrl: contractorData.logoUrl || '',
        hourlyRate: contractorData.hourlyRate || 0
      });
      setSpendCap([contractorData.monthlySpendCap || 1000]);
      setPaymentMethodAdded(contractorData.paymentMethodAdded || false);
      if (contractorData.mediaFiles) {
        setUploadedFiles(contractorData.mediaFiles);
      }
    }
  }, [contractorData]);

  // Get bid requests for this contractor
  const { data: bidRequestsData, isLoading: isLoadingBids } = useQuery<any>({
    queryKey: ["/api/salespersons", contractorData?.id, "bid-requests"],
    enabled: !!contractorData?.id
  });

  // Update spend cap mutation
  const updateSpendCapMutation = useMutation({
    mutationFn: async (newSpendCap: number) => {
      return apiRequest("PATCH", `/api/contractors/${contractorData.id}`, {
        monthlySpendCap: newSpendCap
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({
        title: "Spend cap updated",
        description: "Your monthly spend cap has been successfully updated.",
      });
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      if (!contractorData?.id) {
        throw new Error("Contractor ID not found");
      }
      return apiRequest("PATCH", `/api/contractors/${contractorData.id}`, {
        ...profileData,
        mediaFiles: uploadedFiles
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      setIsEditingProfile(false);
      toast({
        title: "Profile updated",
        description: "Your company profile has been successfully updated.",
      });
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSpendCapChange = (value: number[]) => {
    setSpendCap(value);
    updateSpendCapMutation.mutate(value[0]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select files smaller than 50MB.",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        
        setUploadedFiles(prev => [...prev, {
          url,
          type,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setProfileForm(prev => ({ ...prev, logoUrl: imageUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddSpecialty = (specialty: string) => {
    if (specialty && !profileForm.specialties.includes(specialty)) {
      setProfileForm(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty]
      }));
    }
  };

  const removeSpecialty = (index: number) => {
    setProfileForm(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handleAddPaymentMethod = () => {
    setPaymentMethodAdded(true);
    toast({
      title: "Payment method setup",
      description: "Payment method setup would be integrated here.",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'contacted': return 'default';
      case 'quoted': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">CONTRACTOR PORTAL</h1>
            <Button 
              variant="outline" 
              onClick={() => logout()}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              LOG OUT
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Company Profile Section */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-center flex-1">COMPANY PROFILE</CardTitle>
              <Button
                variant={isEditingProfile ? "default" : "outline"}
                onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                disabled={updateProfileMutation.isPending}
                className="flex items-center gap-2"
              >
                {isEditingProfile ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                {isEditingProfile ? "SAVE" : "EDIT"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Photo */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold">PROFILE PHOTO</Label>
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileForm.logoUrl} alt="Company Logo" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      <Building className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  {isEditingProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => profileImageRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </Button>
                  )}
                  <input
                    ref={profileImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Company Details */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">COMPANY NAME</Label>
                    {isEditingProfile ? (
                      <Input
                        value={profileForm.companyName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Enter company name"
                      />
                    ) : (
                      <p className="text-lg font-medium">{profileForm.companyName || "Not set"}</p>
                    )}
                  </div>

                  {/* Hourly Rate */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">HOURLY RATE</Label>
                    {isEditingProfile ? (
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={profileForm.hourlyRate}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                          placeholder="0"
                          className="pl-8"
                        />
                      </div>
                    ) : (
                      <p className="text-lg font-medium">{formatCurrency(profileForm.hourlyRate)}/hour</p>
                    )}
                  </div>
                </div>

                {/* Services/Specialties */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">SERVICES</Label>
                  {isEditingProfile ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a service (e.g., Kitchen Renovation)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddSpecialty(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(e) => {
                            const input = e.currentTarget.previousSibling as HTMLInputElement;
                            handleAddSpecialty(input.value);
                            input.value = '';
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profileForm.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {specialty}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeSpecialty(index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profileForm.specialties.length > 0 ? (
                        profileForm.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline">
                            {specialty}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No services added</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bio/Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">BIO</Label>
                  {isEditingProfile ? (
                    <Textarea
                      value={profileForm.description}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Tell customers about your company, experience, and what makes you special..."
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {profileForm.description || "No bio added"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contractor Dashboard Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">CONTRACTOR DASHBOARD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Monthly Spend Cap Slider */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">MONTHLY SPEND CAP</Label>
              <div className="px-4">
                <Slider
                  value={spendCap}
                  onValueChange={handleSpendCapChange}
                  max={10000}
                  min={100}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>$100</span>
                  <span className="font-semibold text-primary">{formatCurrency(spendCap[0])}</span>
                  <span>$10,000</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bid Requests Table */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">BID REQUESTS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-border">
                    <TableHead className="font-bold text-base">CUSTOMER</TableHead>
                    <TableHead className="font-bold text-base">CONTACT</TableHead>
                    <TableHead className="font-bold text-base">DETAILS</TableHead>
                    <TableHead className="font-bold text-base">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleBidRequests.map((request) => (
                    <TableRow key={request.id} className="border-b border-border">
                      <TableCell className="font-medium">{request.customer}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="text-sm">{request.contact.split(' | ')[0]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">{request.contact.split(' | ')[1]}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm">{request.details}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(request.status)} className="capitalize">
                          {request.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Row - Payment Setup and Upload Media */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Setup */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center">PAYMENT SETUP</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              {!paymentMethodAdded ? (
                <Button 
                  onClick={handleAddPaymentMethod}
                  className="flex items-center gap-2 text-lg px-8 py-3"
                  size="lg"
                >
                  <CreditCard className="h-5 w-5" />
                  ADD PAYMENT METHOD
                </Button>
              ) : (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                    <CreditCard className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-lg font-semibold text-green-600">Payment Method Added</p>
                  <Button variant="outline" onClick={() => setPaymentMethodAdded(false)}>
                    Update Payment Method
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Media */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center">UPLOAD MEDIA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">UPLOAD</p>
                <p className="text-sm text-muted-foreground">
                  Click to upload images or videos (up to 50MB each)
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Uploaded Files Preview */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-sm font-semibold">Uploaded Files:</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative border border-border rounded-lg overflow-hidden">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 z-10 h-6 w-6 p-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        
                        {file.type === 'image' ? (
                          <div className="relative">
                            <img 
                              src={file.url} 
                              alt={file.name}
                              className="w-full h-24 object-cover"
                            />
                            <div className="absolute bottom-1 left-1 bg-black/50 text-white px-1 rounded text-xs flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              IMG
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <video 
                              src={file.url}
                              className="w-full h-24 object-cover"
                              controls={false}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Play className="h-8 w-8 text-white" />
                            </div>
                            <div className="absolute bottom-1 left-1 bg-black/50 text-white px-1 rounded text-xs flex items-center gap-1">
                              <FileVideo className="h-3 w-3" />
                              VID
                            </div>
                          </div>
                        )}
                        
                        <div className="p-2">
                          <p className="text-xs truncate">{file.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ContractorDashboard;