import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ContractorCard } from "@/components/contractor-card";
import { ProjectCard } from "@/components/project-card";
import { TestimonialCard } from "@/components/testimonial-card";
import { NfcBadge } from "@/components/nfc-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  FileScan, 
  Building,
  Star
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("homeowners");
  
  // Fetch featured contractors
  const { data: contractorsData, isLoading: isLoadingContractors } = useQuery({
    queryKey: ["/api/contractors/featured"],
  });
  
  // Fetch recent projects
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects/recent"],
  });
  
  // Fetch testimonials
  const { data: testimonialsData, isLoading: isLoadingTestimonials } = useQuery({
    queryKey: ["/api/testimonials/recent"],
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-primary text-white">
        <div className="container-custom py-12 md:py-24">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-semibold mb-6">Connect with trusted contractors in your area</h1>
              <p className="text-lg md:text-xl mb-8 opacity-90">Find verified professionals for your home improvement projects through our network of certified door-to-door representatives.</p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-white text-primary hover:bg-gray-100">
                  Find Contractors
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-primary/80">
                  Become a Contractor
                </Button>
              </div>
              
              <div className="mt-8 flex items-center">
                <div className="flex -space-x-2">
                  {/* Customer avatars shown as placeholders */}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-300"></div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-300"></div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-300"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm">Trusted by <span className="font-semibold">10,000+</span> homeowners</p>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="ml-1 text-sm">4.8/5</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 md:pl-12">
              {/* Placeholder for contractor image */}
              <div className="rounded-lg shadow-lg w-full h-80 md:h-96 bg-primary-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-white opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="bg-white dark:bg-card py-16">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12">How ContractConnect Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-box">
              <div className="feature-icon">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Meet Our Representatives</h3>
              <p className="text-muted-foreground">Our trusted door-to-door representatives visit your neighborhood with NFC-enabled identification.</p>
            </div>
            
            <div className="feature-box">
              <div className="feature-icon">
                <FileScan className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Tap or Scan Their ID</h3>
              <p className="text-muted-foreground">Use your phone to scan their NFC bracelet or tap it to instantly access their verified profile.</p>
            </div>
            
            <div className="feature-box">
              <div className="feature-icon">
                <Building className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Connect With Contractors</h3>
              <p className="text-muted-foreground">Browse contractor profiles, request quotes, and manage your home improvement projects.</p>
            </div>
          </div>
          
          {/* NFC Demo */}
          <div className="mt-16 bg-muted rounded-lg p-6 md:p-8 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-center">
              <div className="mb-6 md:mb-0 md:mr-8">
                <NfcBadge size="lg" />
                <p className="text-center mt-4 text-sm text-muted-foreground">NFC-Enabled Identification</p>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4">Experience Contactless Verification</h3>
                <p className="mb-4 text-muted-foreground">Our representatives wear secure NFC bracelets that instantly connect you to their verified profiles and the contractors they represent.</p>
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Avatar className="w-12 h-12 mr-4">
                        <AvatarFallback>JW</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">James Wilson</h4>
                        <p className="text-sm text-muted-foreground">Verified Sales Representative</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Verified</span>
                          <span className="text-xs text-muted-foreground ml-2">ID: #38291</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Button className="w-full bg-primary text-white hover:bg-primary/90">
                  Learn More About NFC Verification
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Featured Contractors Section */}
      <div className="py-16 bg-background">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold">Featured Contractors</h2>
            <Link href="/" className="text-primary font-medium flex items-center">
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          
          <div className="card-grid">
            {isLoadingContractors ? (
              // Loading skeleton
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="h-60">
                  <CardContent className="p-6 flex flex-col animate-pulse">
                    <div className="flex items-start mb-4">
                      <div className="bg-muted w-16 h-16 rounded-lg mr-4" />
                      <div className="flex-1">
                        <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                        <div className="h-3 bg-muted rounded w-3/4" />
                      </div>
                    </div>
                    <div className="h-12 bg-muted rounded mb-4" />
                    <div className="flex justify-between items-center mt-auto">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-8 bg-muted rounded w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              contractorsData?.contractors.map((contractor: any) => (
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
                  onGetQuote={() => {}}
                />
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Recently Completed Projects Section */}
      <div className="py-16 bg-white dark:bg-card">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12">Recently Completed Projects</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoadingProjects ? (
              // Loading skeleton
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full h-48 bg-muted rounded-lg mb-4" />
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="flex items-center mb-3">
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-16 ml-auto" />
                  </div>
                  <div className="h-12 bg-muted rounded" />
                </div>
              ))
            ) : (
              projectsData?.projects.map((project: any) => (
                <ProjectCard
                  key={project.id}
                  title={project.title}
                  description={project.description}
                  contractorName={project.contractorName}
                  status={project.status}
                  date={project.completedAt || project.createdAt}
                  imageUrl={project.imageUrl}
                />
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Testimonials Section */}
      <div className="py-16 bg-primary-50 dark:bg-primary-950">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12">What Our Customers Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoadingTestimonials ? (
              // Loading skeleton
              Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6 animate-pulse">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-muted mr-3" />
                      <div>
                        <div className="h-4 bg-muted rounded w-24 mb-2" />
                        <div className="h-3 bg-muted rounded w-16" />
                      </div>
                    </div>
                    <div className="h-24 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))
            ) : (
              testimonialsData?.testimonials.map((testimonial: any) => (
                <TestimonialCard
                  key={testimonial.id}
                  fullName={testimonial.fullName}
                  rating={testimonial.rating}
                  content={testimonial.content}
                  avatarUrl={testimonial.avatarUrl}
                />
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16 bg-primary text-white">
        <div className="container-custom text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Ready to start your home improvement project?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-3xl mx-auto">Connect with trusted contractors in your area today and transform your home with confidence.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-white text-primary hover:bg-gray-100">
              Find Contractors
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-primary/80">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
