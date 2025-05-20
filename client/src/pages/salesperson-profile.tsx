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
import { Phone, Mail } from "lucide-react";

export default function SalespersonProfile() {
  const { id } = useParams();
  
  // Get salesperson data by ID
  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/salesperson/${id}`],
  });
  
  const salesperson = data?.salesperson;
  const contractors = data?.contractors;

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

  if (error || !salesperson) {
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
                  <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Verified</Badge>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row gap-6 justify-between">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-muted-foreground mr-2" />
                    <span>{salesperson.phone || "Phone number not available"}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-muted-foreground mr-2" />
                    <span>{salesperson.email}</span>
                  </div>
                  {salesperson.nfcId && (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>ID: {salesperson.nfcId}</span>
                    </div>
                  )}
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
                    specialties={contractor.specialties}
                    rating={contractor.rating}
                    reviewCount={contractor.reviewCount}
                    hourlyRate={contractor.hourlyRate}
                    logoUrl={contractor.logoUrl}
                    onGetQuote={(id) => {
                      console.log(`Get quote from contractor ${id}`);
                    }}
                  />
                ))}
              </div>
              
              {(!contractors || contractors.length === 0) && (
                <div className="text-center p-8 bg-muted rounded-lg">
                  <p className="text-muted-foreground">No contractors available at the moment.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="about">
              <h2 className="text-2xl font-semibold mb-6">About {salesperson.fullName}</h2>
              <div className="bg-card p-6 rounded-lg">
                <p className="text-card-foreground mb-4">
                  {salesperson.fullName} is a dedicated sales representative with extensive experience in connecting homeowners with the right contractors for their home improvement projects.
                </p>
                <p className="text-card-foreground">
                  With a customer-first approach, {salesperson.fullName.split(' ')[0]} works to understand your needs and match you with qualified professionals who can bring your vision to life.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}