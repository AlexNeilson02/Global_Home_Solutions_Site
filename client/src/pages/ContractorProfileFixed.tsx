import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import contractorsData from "../sampleData/contractors";
import "../styles/ContractorProfile.css";

export default function ContractorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contractor = contractorsData.find((c: any) => c.id === Number(id));

  if (!contractor) return <div>Contractor not found.</div>;

  return (
    <div className="contractor-profile">
      <button onClick={() => navigate(-1)}>&larr; Back</button>
      <div className="profile-header">
        <img src={contractor.photo} alt={contractor.name} className="profile-photo" />
        <h2>{contractor.name}</h2>
        <span className={`status ${contractor.soldOut ? "sold-out" : "available"}`}>
          {contractor.soldOut ? "Sold Out for This Month" : "Available"}
        </span>
      </div>
      <div className="profile-content">
        <h3>About</h3>
        <p>{contractor.about}</p>
        <h4>Certifications:</h4>
        <ul>
          {contractor.certifications.map((cert: any, i: number) => <li key={i}>{cert}</li>)}
        </ul>
        <h4>Videos</h4>
        <div className="media-gallery">
          {contractor.videos.map((v: any, i: number) => (
            <video key={i} src={v} controls width="250" />
          ))}
        </div>
        <button className="request-bid-profile-btn" disabled={contractor.soldOut}>
          {contractor.soldOut ? "Sold Out for This Month" : "Request Bid"}
        </button>
        <h4>Contact</h4>
        <p>{contractor.contact}</p>
      </div>
    </div>
  );
}