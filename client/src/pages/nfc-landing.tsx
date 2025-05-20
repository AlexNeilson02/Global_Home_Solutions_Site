import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractorCard } from "@/components/contractor-card";
import { NfcBadge } from "@/components/nfc-badge";
import { getInitials, timeAgo } from "@/lib/utils";

export default function NfcLanding() {
  const { profileUrl } = useParams();
  
  // Get salesperson data
  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/nfc/${profileUrl}`],
  });
  
  const salesperson = data?.salesperson;
  const contractors = data?.contractors;

  // If loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If error
  if (error || !salesperson) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-destructive mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-2xl font-bold mb-2">Representative Not Found</h1>
        <p className="text-center text-muted-foreground mb-6">
          The profile you're looking for doesn't exist or may have been deactivated.
        </p>
        <Button onClick={() => window.location.href = "/"}>
          Go to Homepage
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      <div className="bg-primary w-full h-32 md:h-48"></div>
      
      {/* Profile Section */}
      <div className="container-custom -mt-16 md:-mt-24">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={salesperson.avatarUrl || ""} alt={salesperson.fullName} />
                  <AvatarFallback className="text-4xl">{getInitials(salesperson.fullName)}</AvatarFallback>
                </Avatar>
                
                <div className="mt-4 flex flex-col items-center md:items-start">
                  <h1 className="text-2xl font-bold">{salesperson.fullName}</h1>
                  <p className="text-muted-foreground">Sales Representative</p>
                  <Badge variant="success" className="mt-2">Verified</Badge>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row gap-6 justify-between">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{salesperson.phone || "Contact through platform"}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{salesperson.email}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    <span>ID: {salesperson.nfcId}</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="text-center md:text-right">
                    <div className="flex items-center justify-center md:justify-end gap-3 mb-4">
                      <NfcBadge size="md" />
                      <div className="text-left">
                        <p className="font-semibold">NFC Verified</p>
                        <p className="text-xs text-muted-foreground">
                          Last active {salesperson.lastScanned ? timeAgo(salesperson.lastScanned) : "recently"}
                        </p>
                      </div>
                    </div>
                    <Button size="lg" className="w-full md:w-auto">
                      Connect Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for Contractors and Info */}
        <div className="mt-8 mb-16">
          <Tabs defaultValue="contractors">
            <TabsList className="mb-6">
              <TabsTrigger value="contractors">Contractors</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            <TabsContent value="contractors">
              <h2 className="text-2xl font-semibold mb-6">Represented Contractors</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contractors?.map((contractor: any) => (
                  <ContractorCard
                    key={contractor.id}
                    id={contractor.id}
                    companyName={contractor.companyName}
                    description={contractor.description}
                    specialties={contractor.specialties || []}
                    rating={contractor.rating || 0}
                    reviewCount={contractor.reviewCount || 0}
                    hourlyRate={contractor.hourlyRate}
                    logoUrl={contractor.logoUrl}
                    onGetQuote={(id) => window.location.href = `/contractors/${id}`}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="about">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-semibold mb-4">About {salesperson.fullName}</h2>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">What is an NFC-Verified Representative?</h3>
                        <p className="text-muted-foreground">
                          Our representatives are equipped with secure NFC-enabled identification that allows homeowners to instantly verify their credentials and access their profile. This technology ensures transparency and trust when connecting with contractors through our door-to-door sales network.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">How It Works</h3>
                        <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                          <li>Our representative visits your home with an NFC-enabled ID bracelet</li>
                          <li>You can tap or scan their ID with your smartphone</li>
                          <li>You're instantly connected to their verified profile (this page)</li>
                          <li>Browse contractors they represent and request quotes</li>
                          <li>Manage your projects through our secure platform</li>
                        </ol>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Security & Trust</h3>
                        <p className="text-muted-foreground">
                          Every representative undergoes background checks and professional training before joining our network. The NFC verification system adds an additional layer of security, ensuring that you're working with trusted professionals every step of the way.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
