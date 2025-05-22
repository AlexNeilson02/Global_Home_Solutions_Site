import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PhoneIcon, MailIcon, MessageSquare, Award, Shield, Check, Calendar, Clock, FileText, Video } from "lucide-react";
import logoPng from "@assets/GLOBAL HOME SOLUTIONS LOGO-01.png";

export default function SalespersonLanding() {
  const params = useParams();
  const profileUrl = params.profileUrl;
  const [, setLocation] = useLocation();

  // Fetch salesperson data
  const { data: salespersonData, isLoading, error } = useQuery<any>({
    queryKey: [`/api/salesperson/${profileUrl}`],
  });
  
  // Track page visit
  useEffect(() => {
    const createPageVisit = async () => {
      try {
        await fetch('/api/page-visits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            salespersonId: salespersonData?.salesperson?.id,
            path: `/sales/${profileUrl}`,
            referrer: document.referrer
          })
        });
      } catch (error) {
        console.error('Failed to record page visit', error);
      }
    };

    if (salespersonData?.salesperson?.id) {
      createPageVisit();
    }
  }, [profileUrl, salespersonData?.salesperson?.id]);

  // Fetch service categories and contractors
  const { data: serviceCategoriesData } = useQuery<any>({
    queryKey: ["/api/service-categories"],
  });

  const { data: contractorsData } = useQuery<any>({
    queryKey: ["/api/contractors"],
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !salespersonData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Sales Representative Not Found</h1>
        <p className="mb-6 text-muted-foreground">
          The sales representative profile you're looking for cannot be found. 
          The link might be incorrect or the profile has been removed.
        </p>
        <Button onClick={() => window.location.href = "/"}>
          Return to Home
        </Button>
      </div>
    );
  }

  const { user, salesperson } = salespersonData;

  const handleRequestBid = (contractorId?: number) => {
    setLocation(`/request-quote/${profileUrl}${contractorId ? `?contractor=${contractorId}` : ''}`);
  };

  // Group contractors by service category
  const contractorsByCategory = serviceCategoriesData?.categories?.map((category: any) => ({
    ...category,
    contractors: contractorsData?.contractors?.filter((contractor: any) => 
      contractor.serviceCategoryIds?.includes(category.id)
    ) || []
  })) || [];

  return (
    <>
      <Helmet>
        <title>{user.fullName} | Global Home Solutions</title>
        <meta name="description" content={`${user.fullName} is a verified sales representative for Global Home Solutions, specializing in home improvement services.`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img src={logoPng} alt="Global Home Solutions" className="h-10 w-auto" />
              <div className="hidden md:block text-lg font-semibold">Global Home Solutions</div>
            </div>
            <div>
              <Button variant="secondary" onClick={() => handleRequestBid()}>
                Request a Quote
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto py-8 px-4">
          {/* Salesperson Profile Card */}
          <Card className="mb-8 overflow-hidden">
            <div className="h-36 bg-gradient-to-r from-primary/90 to-primary/50"></div>
            <CardContent className="pt-0 relative">
              <div className="flex flex-col md:flex-row gap-6 -mt-12">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background ring-2 ring-primary/20">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="text-2xl bg-primary/20">
                    {user.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2 mt-4 md:mt-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{user.fullName}</h1>
                    <Badge className="w-fit" variant="outline">
                      <Shield className="h-3 w-3 mr-1" /> Verified Sales Representative
                    </Badge>
                  </div>
                  
                  <div className="text-muted-foreground flex flex-wrap gap-y-1 gap-x-4">
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      <span>{user.phone || "Contact via email"}</span>
                    </div>
                    <div className="flex items-center">
                      <MailIcon className="h-4 w-4 mr-2" />
                      <span>{user.email}</span>
                    </div>
                  </div>

                  {salesperson.bio && (
                    <p className="text-sm md:text-base max-w-2xl mt-2">
                      {salesperson.bio}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-4 md:absolute md:top-4 md:right-4">
                <Button onClick={() => handleRequestBid()} className="w-full md:w-auto">
                  Request a Quote
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Services and Contractors by Category */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-center">Our Expert Contractors</h2>
            
            {contractorsByCategory.map((category: any) => (
              category.contractors.length > 0 && (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{category.name}</h3>
                    <Badge variant="secondary">{category.contractors.length} Contractors</Badge>
                  </div>
                  <p className="text-muted-foreground">{category.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.contractors.map((contractor: any) => (
                      <Card key={contractor.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            {contractor.logoUrl && (
                              <img 
                                src={contractor.logoUrl} 
                                alt={contractor.companyName}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <CardTitle className="text-lg">{contractor.companyName}</CardTitle>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Award className="h-3 w-3" />
                                {contractor.rating ? `${contractor.rating}/5` : 'New'} 
                                {contractor.reviewCount > 0 && `(${contractor.reviewCount} reviews)`}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {contractor.description}
                          </p>
                          
                          {contractor.specialties && contractor.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {contractor.specialties.slice(0, 3).map((specialty: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {contractor.specialties.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{contractor.specialties.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {contractor.videoUrl && (
                            <div className="flex items-center gap-2 text-sm text-primary">
                              <Video className="h-4 w-4" />
                              <span>Introduction Video Available</span>
                            </div>
                          )}

                          {contractor.hourlyRate && (
                            <div className="text-sm font-medium">
                              Starting at ${contractor.hourlyRate}/hour
                            </div>
                          )}
                        </CardContent>
                        
                        <CardFooter className="pt-3 border-t">
                          <Button 
                            onClick={() => handleRequestBid(contractor.id)} 
                            className="w-full"
                          >
                            Request Bid
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* How It Works Section */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Simple steps to get your home improvement project started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-shrink-0 bg-primary text-white rounded-full h-10 w-10 flex items-center justify-center font-bold">1</div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Request a Quote</h3>
                  <p className="text-muted-foreground">Fill out our simple form with your project details. It takes less than 5 minutes.</p>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-shrink-0 bg-primary text-white rounded-full h-10 w-10 flex items-center justify-center font-bold">2</div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Free Consultation</h3>
                  <p className="text-muted-foreground">A contractor will contact you to discuss your needs and provide expert advice.</p>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-shrink-0 bg-primary text-white rounded-full h-10 w-10 flex items-center justify-center font-bold">3</div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Detailed Proposal</h3>
                  <p className="text-muted-foreground">Receive a comprehensive quote with transparent pricing and timeline.</p>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-shrink-0 bg-primary text-white rounded-full h-10 w-10 flex items-center justify-center font-bold">4</div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Quality Work</h3>
                  <p className="text-muted-foreground">Our verified contractors complete your project to the highest standards.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleRequestBid()} className="w-full">
                Get Started Today
              </Button>
            </CardFooter>
          </Card>
        </main>

        <footer className="bg-muted py-8 px-4 mt-12">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <img src={logoPng} alt="Global Home Solutions" className="h-8 w-auto mr-2" />
                <span className="text-sm">© 2025 Global Home Solutions. All rights reserved.</span>
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" size="sm">
                  Privacy Policy
                </Button>
                <Button variant="ghost" size="sm">
                  Terms of Service
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}