import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import contractorsData from "../sampleData/contractors";
import logoPath from "@/assets/global-home-solutions-logo.png";
import "../styles/HomePage.css";

const trades = [
  "Plumbing", "Electrical", "Flooring", "Concrete", "Roofing", "HVAC"
];

export default function HomePage() {
  const [trade, setTrade] = useState("");
  const navigate = useNavigate();

  const filteredContractors = contractorsData.filter(
    (contractor) => contractor.trade.toLowerCase() === trade.toLowerCase()
  ).slice(0, 5);

  return (
    <div className="homepage-container">
      <header>
        <img src={logoPath} alt="Global Home Solutions Logo" className="logo" />
        <h1>Global Home Solutions</h1>
        <p className="culture">
          Browse by trade to view qualified contractors. Watch their videos, review completed projects, and select the professional who best matches your needs.
        </p>
      </header>
      <section className="search-section">
        <input
          type="text"
          list="trades"
          placeholder="Search for your trade (e.g., Plumbing, Roofing)"
          value={trade}
          onChange={e => setTrade(e.target.value)}
        />
        <datalist id="trades">
          {trades.map(tr => (
            <option key={tr} value={tr} />
          ))}
        </datalist>
        <button className="find-contractor-btn" onClick={() => {}}>Find a Contractor</button>
      </section>
      {trade && (
        <section className="contractors-section">
          <h2>{trade} Contractors</h2>
          <div className="contractor-list">
            {filteredContractors.length > 0 ? filteredContractors.map(c => (
              <div key={c.id} className="contractor-card">
                <img src={c.photo} alt={c.name} className="contractor-photo" />
                <h3>{c.name}</h3>
                <button onClick={() => navigate(`/contractor/${c.id}`)}>View Profile</button>
                <button className="request-bid-btn" disabled={c.soldOut}>
                  {c.soldOut ? "Sold Out for This Month" : "Request Bid"}
                </button>
                <div className="video-gallery">
                  {c.videos.slice(0,2).map((v, idx) => (
                    <video key={idx} src={v} controls width="150" />
                  ))}
                </div>
              </div>
            )) : <p>No contractors found for this trade.</p>}
          </div>
        </section>
      )}
      <section className="info-section">
        <button className="info-btn">Understanding Construction & the Bidding Process</button>
        <div className="promise-section">
          <h3>Why Homeowners Trust Global Home Solutions</h3>
          <ul>
            <li>Qualified contractors only</li>
            <li>Guaranteed 24-hour response</li>
            <li>Bids in less than 5 days</li>
            <li>Person-to-person service</li>
          </ul>
        </div>
      </section>
    </div>
  );
}