import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useSalesperson } from "@/contexts/SalespersonContext";
import BidRequestForm from "@/components/BidRequestForm";
import { ContractorVideoDisplay } from "@/components/ContractorVideoDisplay";
import { ArrowLeft, Phone, Mail, Globe, MapPin, Star, CheckCircle, Play, User } from "lucide-react";
import "../styles/ContractorProfile.css";

export default function ContractorProfileDB() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [showBidForm, setShowBidForm] = useState(false);
  const { salespersonId } = useSalesperson();

  const { data: contractorData, isLoading, error } = useQuery({
    queryKey: ['/api/contractors', id],
    queryFn: async () => {
      const response = await fetch(`/api/contractors/${id}`);
      if (!response.ok) {
        throw new Error('Contractor not found');
      }
      return response.json();
    },
    enabled: !!id
  });

  const contractor = contractorData?.contractor;

  if (isLoading) return <div>Loading contractor...</div>;
  if (error || !contractor) return <div>Contractor not found.</div>;

  const handleBack = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Header with Back Button */}
      <div className="bg-slate-800 shadow-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Services
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <div className="bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-700">
              <div className="relative h-48 bg-gradient-to-r from-blue-600 to-blue-800">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              </div>
              
              <div className="relative px-8 pb-8">
                {/* Logo */}
                <div className="absolute -top-20 left-8">
                  <div className="w-40 h-40 bg-slate-700 rounded-2xl shadow-lg p-4 flex items-center justify-center border border-slate-600">
                    <img 
                      src={contractor.logoUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'} 
                      alt={contractor.companyName} 
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                </div>

                {/* Company Info with About Services */}
                <div className="pt-24">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Left side - Company name and status */}
                    <div className="flex-shrink-0">
                      <h1 className="text-3xl font-bold text-white mb-2">{contractor.companyName}</h1>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-400" size={20} />
                        <span className="text-green-400 font-medium">Available Now</span>
                      </div>
                    </div>
                    
                    {/* Right side - About Our Services */}
                    <div className="flex-grow max-w-md">
                      <h3 className="text-lg font-bold text-white mb-2">About Our Services</h3>
                      <p className="text-slate-300 leading-relaxed text-sm mb-3">
                        {contractor.description || "Professional contractor services with years of experience delivering quality work."}
                      </p>
                      
                      {/* Specialties */}
                      {contractor.specialties && contractor.specialties.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">Specialties</h4>
                          <div className="flex flex-wrap gap-1">
                            {contractor.specialties.map((specialty: string, i: number) => (
                              <span 
                                key={i} 
                                className="bg-blue-600 text-blue-100 px-2 py-1 rounded-full text-xs font-medium"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Quote Section */}
            <div className="bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-700">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Get Your Free Quote</h2>
                <p className="text-slate-300 mb-6">
                  Ready to get started? Request a personalized quote for your project and get connected with our professional team.
                </p>
                <button 
                  onClick={() => setShowBidForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-lg"
                >
                  Request Free Quote
                </button>
              </div>
            </div>

            {/* Media and Testimonials Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Media and Testimonials</h2>
              
              {/* Flexible area for uploaded media */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Display contractor videos if available */}
                {contractor.mediaFiles && contractor.mediaFiles.filter((file: any) => file.type === 'video').length > 0 && 
                  contractor.mediaFiles
                    .filter((file: any) => file.type === 'video')
                    .map((video: any, i: number) => (
                      <div key={`video-${i}`} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <ContractorVideoDisplay
                          videoUrl={video.url}
                          contractorName={contractor.companyName}
                          className="w-full rounded-lg"
                          showControls={true}
                        />
                        {video.description && (
                          <p className="mt-3 text-sm text-slate-300">{video.description}</p>
                        )}
                      </div>
                    ))
                }
                
                {/* Display contractor images if available */}
                {contractor.mediaFiles && contractor.mediaFiles.filter((file: any) => file.type === 'image').length > 0 && 
                  contractor.mediaFiles
                    .filter((file: any) => file.type === 'image')
                    .map((image: any, i: number) => (
                      <div key={`image-${i}`} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                        <img 
                          src={image.url} 
                          alt={image.name} 
                          className="w-full h-48 object-cover"
                        />
                        {image.description && (
                          <p className="p-4 text-sm text-slate-300">{image.description}</p>
                        )}
                      </div>
                    ))
                }
                
                {/* Placeholder for when no media is available */}
                {(!contractor.mediaFiles || contractor.mediaFiles.length === 0) && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-slate-400">No media files uploaded yet. Check back soon for videos and images showcasing our work!</p>
                  </div>
                )}
              </div>
              
              {/* Future testimonials placeholder */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">Customer Testimonials</h3>
                <div className="text-center py-6">
                  <p className="text-slate-400">Customer testimonials will be displayed here once available.</p>
                </div>
              </div>
            </div>



          </div>

          {/* Sidebar - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Contact Information */}
              <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-full">
                      <Mail className="text-white" size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      <p className="font-medium text-white">{contractor.email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-full">
                      <Phone className="text-white" size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Phone Number</p>
                      <p className="font-medium text-white">{contractor.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-full">
                      <User className="text-white" size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Owner Name</p>
                      <p className="font-medium text-white">{contractor.ownerName || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  {contractor.website && (
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-full">
                        <Globe className="text-white" size={16} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Website</p>
                        <a 
                          href={contractor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-400 hover:text-blue-300"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {contractor.serviceArea && (
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-full">
                        <MapPin className="text-white" size={16} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Service Area</p>
                        <p className="font-medium text-white">{contractor.serviceArea}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bid Request Form Modal */}
      <BidRequestForm
        isOpen={showBidForm}
        onClose={() => setShowBidForm(false)}
        contractor={contractor}
      />
    </div>
  );
}