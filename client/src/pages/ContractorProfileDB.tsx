import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import "../styles/ContractorProfile.css";

export default function ContractorProfileDB() {
  const { id } = useParams();
  const navigate = useNavigate();

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
    navigate('/');
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

        {contractor.mediaFiles && contractor.mediaFiles.length > 0 && (
          <>
            <h4>Media</h4>
            <div className="media-gallery">
              {contractor.mediaFiles
                .filter((file: any) => file.type === 'video')
                .map((video: any, i: number) => (
                  <div key={i} className="video-item">
                    <p>📹 {video.name}</p>
                    <p>{video.description}</p>
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

        <button className="request-bid-profile-btn">
          Request Bid
        </button>

        <h4>Contact</h4>
        <p>Phone: {contractor.phone}</p>
        <p>Email: {contractor.email}</p>
        {contractor.website && <p>Website: {contractor.website}</p>}
        {contractor.serviceArea && <p>Service Area: {contractor.serviceArea}</p>}
      </div>
    </div>
  );
}