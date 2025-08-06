import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useSalesperson } from "@/contexts/SalespersonContext";
import BidRequestForm from "@/components/BidRequestForm";
import { ContractorVideoDisplay } from "@/components/ContractorVideoDisplay";
import { ArrowLeft, Phone, Mail, Globe, MapPin, Star, CheckCircle, Play } from "lucide-react";
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

                {/* Company Info */}
                <div className="pt-24">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">{contractor.companyName}</h1>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-400" size={20} />
                        <span className="text-green-400 font-medium">Available Now</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-100 px-3 py-2 rounded-full">
                      <Star className="text-yellow-500 fill-current" size={16} />
                      <span className="text-yellow-700 font-medium">4.9</span>
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



            {/* Video Section */}
            {contractor.videoUrl && (
              <div className="bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <Play className="text-blue-400" size={24} />
                  <h2 className="text-2xl font-bold text-white">Introduction Video</h2>
                </div>
                <div className="rounded-xl overflow-hidden">
                  <ContractorVideoDisplay
                    videoUrl={contractor.videoUrl}
                    contractorName={contractor.companyName}
                    className="w-full"
                    showControls={true}
                  />
                </div>
              </div>
            )}

            {/* Media Gallery */}
            {contractor.mediaFiles && contractor.mediaFiles.length > 0 && (
              <div className="bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-6">Project Gallery</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contractor.mediaFiles
                    .filter((file: any) => file.type === 'video')
                    .map((video: any, i: number) => (
                      <div key={i} className="bg-slate-700 rounded-xl p-4 border border-slate-600">
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
                    ))}
                  {contractor.mediaFiles
                    .filter((file: any) => file.type === 'image')
                    .map((image: any, i: number) => (
                      <div key={i} className="bg-slate-700 rounded-xl overflow-hidden border border-slate-600">
                        <img 
                          src={image.url} 
                          alt={image.name} 
                          className="w-full h-48 object-cover"
                        />
                        {image.description && (
                          <p className="p-4 text-sm text-slate-300">{image.description}</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* About Services */}
              <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">About Our Services</h3>
                <p className="text-slate-300 leading-relaxed mb-4 text-sm">
                  {contractor.description || "Professional contractor services with years of experience delivering quality work."}
                </p>
                
                {/* Specialties */}
                {contractor.specialties && contractor.specialties.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
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

              {/* Contact Information */}
              <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
                <div className="space-y-4">
                  {contractor.phone && (
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-full">
                        <Phone className="text-white" size={16} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Phone</p>
                        <p className="font-medium text-white">{contractor.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {contractor.email && (
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-full">
                        <Mail className="text-white" size={16} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Email</p>
                        <p className="font-medium text-white">{contractor.email}</p>
                      </div>
                    </div>
                  )}
                  
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

              {/* Trust Indicators */}
              <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">Why Choose Us</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-400" size={20} />
                    <span className="text-slate-300">Licensed & Insured</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-400" size={20} />
                    <span className="text-slate-300">Free Estimates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-400" size={20} />
                    <span className="text-slate-300">Quality Guaranteed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-400" size={20} />
                    <span className="text-slate-300">Local Experts</span>
                  </div>
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
        salespersonId={salespersonId}
      />
    </div>
  );
}