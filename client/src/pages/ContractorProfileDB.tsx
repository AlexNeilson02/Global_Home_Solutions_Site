import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useSalesperson } from "@/contexts/SalespersonContext";
import BidRequestForm from "@/components/BidRequestForm";
import { ContractorVideoDisplay } from "@/components/ContractorVideoDisplay";
import { ArrowLeft, Phone, Mail, Globe, MapPin, Star, CheckCircle, Play, User, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import "../styles/ContractorProfile.css";

export default function ContractorProfileDB() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [showBidForm, setShowBidForm] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
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

  const handleBack = () => {
    setLocation('/services');
  };

  // Get all images from mediaFiles
  const getImages = () => {
    return contractor?.mediaFiles?.filter((file: any) => file.type === 'image') || [];
  };

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
  };

  const handlePreviousImage = () => {
    const images = getImages();
    setSelectedImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
  };

  const handleNextImage = () => {
    const images = getImages();
    setSelectedImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
  };

  // Keyboard navigation for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImageModalOpen) return;
      
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setIsImageModalOpen(false);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePreviousImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextImage();
          break;
      }
    };

    if (isImageModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isImageModalOpen, handlePreviousImage, handleNextImage]);

  if (isLoading) return <div>Loading contractor...</div>;
  if (error || !contractor) return <div>Contractor not found.</div>;

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
                  <div className="flex items-start gap-6 mb-6">
                    {/* Company name and status next to logo area */}
                    <div className="flex-shrink-0">
                      <h1 className="text-3xl font-bold text-white mb-2">{contractor.companyName}</h1>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-400" size={20} />
                        <span className="text-green-400 font-medium">Available Now</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* About Our Services - Below company name */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-3">About Our Services</h3>
                    <p className="text-slate-300 leading-relaxed text-sm mb-4">
                      {contractor.description || "Professional contractor services with years of experience delivering quality work."}
                    </p>
                    
                    {/* Specialties */}
                    {contractor.specialties && contractor.specialties.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Specialties</h4>
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowBidForm(true);
                  }}
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
                      <div key={`image-${i}`} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 cursor-pointer group relative"
                           onClick={(e) => handleImageClick(e, i)}>
                        <img 
                          src={image.url} 
                          alt={image.name} 
                          className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white rounded-full p-2">
                              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
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

      {/* Image Enlargement Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsImageModalOpen(false);
        }
      }}>
        <DialogContent 
          className="max-w-4xl w-full p-0 bg-black border-0"
          aria-labelledby="image-modal-title"
          aria-describedby="image-modal-description"
        >
          {(() => {
            const images = getImages();
            const currentImage = images[selectedImageIndex];
            
            if (!currentImage) return null;
            
            return (
              <div className="relative">
                {/* Hidden accessibility elements */}
                <div id="image-modal-title" className="sr-only">
                  Image Gallery - {currentImage.name}
                </div>
                <div id="image-modal-description" className="sr-only">
                  View enlarged image {selectedImageIndex + 1} of {images.length}. Use arrow keys or navigation buttons to browse images.
                </div>
                
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsImageModalOpen(false);
                  }}
                  className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all"
                  aria-label="Close image modal"
                >
                  <X size={24} />
                </button>

                {/* Navigation buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePreviousImage();
                      }}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all"
                      aria-label="Next image"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {/* Image */}
                <img
                  src={currentImage.url}
                  alt={currentImage.name}
                  className="w-full h-auto max-h-[90vh] object-contain"
                />

                {/* Image info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                  <p className="text-white font-medium">{currentImage.name}</p>
                  {images.length > 1 && (
                    <p className="text-slate-300 text-sm mt-1">
                      {selectedImageIndex + 1} of {images.length}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Bid Request Form Modal */}
      <BidRequestForm
        isOpen={showBidForm}
        onClose={() => setShowBidForm(false)}
        contractor={contractor}
      />
    </div>
  );
}