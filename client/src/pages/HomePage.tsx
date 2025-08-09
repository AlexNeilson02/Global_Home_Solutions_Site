import React from "react";
import { Link } from "react-router-dom";
import logoPath from "@/assets/global-home-solutions-logo.png";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900" style={{ backgroundColor: '#0f172a' }}>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <img 
              src={logoPath} 
              alt="Global Home Solutions" 
              className="h-32 w-auto"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            Find a contractor for your project
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Global Home Solutions is bringing things back to a person-to-person contact, 
            where our sales team knows you and you know the sales team, a team in helping you to.
          </p>
        </div>

        {/* Big Find a Contractor Button */}
        <div className="max-w-2xl mx-auto mb-16 text-center">
          <button 
            onClick={() => window.location.href = '/services'}
            className="big-contractor-btn"
            style={{
              background: '#00aeef',
              padding: window.innerWidth <= 768 ? '20px 40px' : '35px 80px',
              fontSize: window.innerWidth <= 768 ? '24px' : '36px',
              fontWeight: 'bold',
              borderRadius: '20px',
              color: 'white',
              minWidth: window.innerWidth <= 768 ? '280px' : '350px',
              textAlign: 'center',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 12px 30px rgba(0,174,239,0.4)',
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#0098d4';
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 16px 40px rgba(0,174,239,0.5)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#00aeef';
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 12px 30px rgba(0,174,239,0.4)';
            }}
          >
            Find a Contractor
          </button>
        </div>

        {/* Contractor Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Find the right contractor for your project
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-video bg-gray-200 relative">
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Plumber</h3>
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors">
                  REQUEST BID
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-video bg-gray-200 relative">
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Electrician</h3>
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors">
                  REQUEST BID
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-video bg-gray-200 relative">
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Flooring</h3>
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors">
                  REQUEST BID
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-video bg-gray-200 relative">
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Concrete</h3>
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors">
                  REQUEST BID
                </button>
              </div>
            </div>
          </div>
        </div>



        {/* Our Culture Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Our Culture</h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Global Home Solutions is bringing things back to a person-to-person contact, 
            where our sales team knows you and you know the sales team, a team in helping you to.
          </p>
          <button className="px-8 py-3 border-2 border-slate-400 text-white hover:bg-slate-700 rounded-lg transition-colors">
            Understanding Construction and the Bidding Process →
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;