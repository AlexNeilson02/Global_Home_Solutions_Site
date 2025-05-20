import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractorCard } from "@/components/contractor-card";
import { NfcBadge } from "@/components/nfc-badge";
import { getInitials } from "@/lib/utils";
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Pipette, 
  Zap, 
  Home, 
  Palmtree,
  Thermometer,
  Hammer,
  Layers,
  Video as VideoIcon,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Icon mapping for service categories
const categoryIcons: Record<string, React.ElementType> = {
  pipe: Pipette,
  zap: Zap,
  home: Home,
  palmtree: Palmtree,
  thermometer: Thermometer,
  paintbrush: MessageSquare, // Using a substitute as paintbrush isn't in lucide
  layers: Layers,
  hammer: Hammer,
};

interface Contractor {
  id: number;
  companyName: string;
  description: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number | null;
  logoUrl: string | null;
  videoUrl: string | null;
  serviceCategoryIds: number[];
}

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

interface ContractorWithVideo extends Contractor {
  showVideo: boolean;
}

export default function SalespersonProfileV2() {
  const { id } = useParams();
  const { toast } = useToast();
  const [contractorsWithVideo, setContractorsWithVideo] = useState<ContractorWithVideo[]>([]);
  const [filteredCategoryId, setFilteredCategoryId] = useState<number | null>(null);
  
  // Get salesperson data by ID
  const { data, isLoading: isLoadingSalesperson } = useQuery<{
    salesperson: {
      id: number;
      fullName: string;
      profileUrl: string;
      nfcId: string;
      avatarUrl: string | null;
      phone: string | null;
      email: string;
      lastScanned: string | null;
    };
    contractors: Contractor[];
  }>({
    queryKey: [`/api/salesperson/${id}`],
  });
  
  // Get service categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery<{
    categories: ServiceCategory[];
  }>({
    queryKey: ['/api/service-categories'],
  });

  // Combine contractors with video state
  useEffect(() => {
    if (data?.contractors) {
      setContractorsWithVideo(
        data.contractors.map(contractor => ({
          ...contractor,
          showVideo: false
        }))
      );
    }
  }, [data?.contractors]);
  
  const toggleVideo = (contractorId: number) => {
    setContractorsWithVideo(prev => 
      prev.map(c => 
        c.id === contractorId 
          ? { ...c, showVideo: !c.showVideo } 
          : c
      )
    );
  };
  
  const requestBid = (contractorId: number) => {
    toast({
      title: "Bid Request Sent",
      description: "Your bid request has been sent to the contractor.",
    });
    
    // In a real implementation, this would submit a form or make an API call
    console.log(`Requesting bid from contractor ${contractorId}`);
  };

  const isLoading = isLoadingSalesperson || isLoadingCategories;
  const salesperson = data?.salesperson;
  const contractors = contractorsWithVideo;
  const categories = categoriesData?.categories || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading salesperson profile...</p>
        </div>
      </div>
    );
  }

  if (!salesperson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-background rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-muted-foreground mb-6">
            Sorry, we couldn't find the salesperson profile you're looking for. 
            The link might be incorrect or the profile may have been removed.
          </p>
          <Button onClick={() => window.location.href = "/"}>
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  // Filter contractors by category if a category is selected
  const filteredContractors = filteredCategoryId 
    ? contractors.filter(c => c.serviceCategoryIds?.includes(filteredCategoryId))
    : contractors;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      <div className="bg-primary w-full h-32 md:h-48"></div>
      
      {/* Main Content */}
      <div className="container-custom mx-auto px-4 -mt-16 md:-mt-24 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Salesperson Contact Info Sidebar - Fixed on Desktop */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <Card className="overflow-hidden">
                <div className="bg-primary h-16"></div>
                <CardContent className="p-6 pt-0 -mt-8">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                      <AvatarImage src={salesperson.avatarUrl || ""} alt={salesperson.fullName} />
                      <AvatarFallback className="text-2xl">{getInitials(salesperson.fullName)}</AvatarFallback>
                    </Avatar>
                    
                    <h2 className="mt-4 text-xl font-bold">{salesperson.fullName}</h2>
                    <p className="text-muted-foreground">Sales Representative</p>
                    
                    <div className="flex items-center mt-2">
                      <NfcBadge size="sm" className="mr-2" />
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        Verified
                      </Badge>
                    </div>
                    
                    <div className="w-full mt-6 space-y-4">
                      {salesperson.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-primary mr-2" />
                          <span>{salesperson.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-primary mr-2" />
                        <span>{salesperson.email}</span>
                      </div>
                    </div>
                    
                    <Button className="w-full mt-6">
                      Contact Me
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-6">Find the Right Contractor</h1>
                
                {/* Service Category Filters */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4">Browse by Service</h2>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={filteredCategoryId === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilteredCategoryId(null)}
                    >
                      All Services
                    </Button>
                    
                    {categories.map(category => {
                      const IconComponent = category.icon ? categoryIcons[category.icon] : null;
                      return (
                        <Button
                          key={category.id}
                          variant={filteredCategoryId === category.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilteredCategoryId(category.id)}
                        >
                          {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
                          {category.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Contractor Listings */}
                <div className="space-y-6">
                  {filteredContractors.length > 0 ? (
                    filteredContractors.map(contractor => (
                      <Card key={contractor.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-6">
                            <div className="flex flex-col md:flex-row gap-4 items-start">
                              <div className="flex-shrink-0">
                                <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                  {contractor.logoUrl ? (
                                    <img src={contractor.logoUrl} alt={contractor.companyName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="text-xl font-bold">{getInitials(contractor.companyName)}</div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-grow">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                  <h3 className="text-xl font-bold">{contractor.companyName}</h3>
                                  <div className="flex items-center mt-2 md:mt-0">
                                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                    <span className="font-medium mr-1">{contractor.rating}</span>
                                    <span className="text-muted-foreground">({contractor.reviewCount} reviews)</span>
                                  </div>
                                </div>
                                
                                <p className="mt-2 text-muted-foreground">{contractor.description}</p>
                                
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {contractor.specialties?.map((specialty, i) => (
                                    <Badge key={i} variant="outline" className="bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                      {specialty}
                                    </Badge>
                                  ))}
                                </div>
                                
                                <div className="mt-4 flex flex-col md:flex-row gap-2">
                                  {contractor.videoUrl && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => toggleVideo(contractor.id)}
                                    >
                                      <VideoIcon className="mr-2 h-4 w-4" />
                                      {contractor.showVideo ? "Hide Video" : "Watch Video"}
                                    </Button>
                                  )}
                                  
                                  <Button 
                                    size="sm"
                                    onClick={() => requestBid(contractor.id)}
                                  >
                                    Request a Bid
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Video Area */}
                          {contractor.videoUrl && contractor.showVideo && (
                            <div className="border-t">
                              <div className="p-4 bg-muted/30">
                                <div className="aspect-video w-full">
                                  <video 
                                    className="w-full h-full object-cover rounded-md" 
                                    controls
                                    poster="https://placehold.co/600x400/png?text=Video+Preview"
                                  >
                                    <source src={contractor.videoUrl} type="video/mp4" />
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-muted rounded-lg">
                      <p className="text-muted-foreground">No contractors available for this service category.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setFilteredCategoryId(null)}
                      >
                        View All Categories
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}