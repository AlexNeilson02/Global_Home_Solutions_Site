import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useSalesperson } from "@/contexts/SalespersonContext";
import BidRequestForm from "@/components/BidRequestForm";
import { ContractorVideoDisplay } from "@/components/ContractorVideoDisplay";
import { ArrowLeft, Phone, Mail, Globe, MapPin, Star, CheckCircle, Play, User, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

  const getBackNavigationInfo = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    
    if (from === 'homeowner-contractors') {
      return { path: '/homeowner/contractors', label: 'Back to Contractors' };
    } else if (from === 'homeowner-dashboard') {
      return { path: '/homeowner-dashboard', label: 'Back to Dashboard' };
    } else {
      return { path: '/services', label: 'Back to Services' };
    }
  };

  const handleBack = () => {
    const backInfo = getBackNavigationInfo();
    setLocation(backInfo.path);
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
            {getBackNavigationInfo().label}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <div className="bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-700">
              <div 
                className="relative h-48"
                style={{
                  backgroundImage: contractor.bannerImageUrl 
                    ? `url(${contractor.bannerImageUrl})`
                    : 'linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216))',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
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
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 break-words leading-tight">{contractor.companyName}</h1>
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
                          href={contractor.website.startsWith('http') ? contractor.website : `https://${contractor.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-400 hover:text-blue-300"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Social Media Links */}
                  {(contractor.instagram || contractor.facebook || contractor.twitter) && (
                    <div>
                      <p className="text-sm text-slate-400 mb-3">Social Media</p>
                      <div className="space-y-2">
                        {contractor.instagram && (
                          <a 
                            href={contractor.instagram.startsWith('http') ? contractor.instagram : `https://instagram.com/${contractor.instagram}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                          >
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-full">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                            </div>
                            <span className="text-white">Instagram</span>
                          </a>
                        )}
                        {contractor.facebook && (
                          <a 
                            href={contractor.facebook.startsWith('http') ? contractor.facebook : `https://facebook.com/${contractor.facebook}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                          >
                            <div className="bg-blue-600 p-2 rounded-full">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </div>
                            <span className="text-white">Facebook</span>
                          </a>
                        )}
                        {contractor.twitter && (
                          <a 
                            href={contractor.twitter.startsWith('http') ? contractor.twitter : `https://twitter.com/${contractor.twitter}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                          >
                            <div className="bg-blue-400 p-2 rounded-full">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                              </svg>
                            </div>
                            <span className="text-white">Twitter</span>
                          </a>
                        )}
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
          data-component="image-modal"
        >
          {(() => {
            const images = getImages();
            const currentImage = images[selectedImageIndex];
            
            if (!currentImage) return null;
            
            return (
              <>
                <DialogTitle className="sr-only">
                  Image Gallery - {currentImage.name}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  View enlarged image {selectedImageIndex + 1} of {images.length}. Use arrow keys or navigation buttons to browse images.
                </DialogDescription>
                <div className="relative">
                
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
              </>
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