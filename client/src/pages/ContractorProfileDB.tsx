import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import BidRequestForm from "@/components/BidRequestForm";
import { ContractorVideoDisplay } from "@/components/ContractorVideoDisplay";
import "../styles/ContractorProfile.css";

export default function ContractorProfileDB() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [showBidForm, setShowBidForm] = useState(false);

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
    <div className="contractor-profile">
      <button onClick={handleBack}>&larr; Back</button>
      <div className="profile-header">
        <img 
          src={contractor.logoUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'} 
          alt={contractor.companyName} 
          className="profile-photo" 
        />
        <h2>{contractor.companyName}</h2>
        <span className={`status available`}>
          Available
        </span>
      </div>
      <div className="profile-content">
        <h3>About</h3>
        <p>{contractor.description}</p>
        
        <h4>Specialties:</h4>
        <ul>
          {contractor.specialties?.map((specialty: string, i: number) => (
            <li key={i}>{specialty}</li>
          ))}
        </ul>

        {/* Display intro video if available */}
        {contractor.videoUrl && (
          <>
            <h4>Intro Video</h4>
            <div className="intro-video-section">
              <ContractorVideoDisplay
                videoUrl={contractor.videoUrl}
                contractorName={contractor.companyName}
                className="w-full max-w-md"
                showControls={true}
              />
            </div>
          </>
        )}

        {contractor.mediaFiles && contractor.mediaFiles.length > 0 && (
          <>
            <h4>Media</h4>
            <div className="media-gallery">
              {contractor.mediaFiles
                .filter((file: any) => file.type === 'video')
                .map((video: any, i: number) => (
                  <div key={i} className="video-item">
                    <ContractorVideoDisplay
                      videoUrl={video.url}
                      contractorName={contractor.companyName}
                      className="w-full max-w-sm"
                      showControls={true}
                    />
                    {video.description && <p className="mt-2 text-sm text-gray-600">{video.description}</p>}
                  </div>
                ))}
              {contractor.mediaFiles
                .filter((file: any) => file.type === 'image')
                .map((image: any, i: number) => (
                  <div key={i} className="image-item">
                    <img src={image.url} alt={image.name} width="250" />
                    <p>{image.description}</p>
                  </div>
                ))}
            </div>
          </>
        )}

        <button 
          className="request-bid-profile-btn"
          onClick={() => setShowBidForm(true)}
        >
          Request Bid
        </button>

        <h4>Contact</h4>
        <p>Phone: {contractor.phone}</p>
        <p>Email: {contractor.email}</p>
        {contractor.website && <p>Website: {contractor.website}</p>}
        {contractor.serviceArea && <p>Service Area: {contractor.serviceArea}</p>}
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