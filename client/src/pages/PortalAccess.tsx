import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import logoPath from "@/assets/global-home-solutions-logo.png";
import { LoginModal } from "@/components/LoginModal";
import { useAuth } from "@/hooks/useAuth";

const PortalAccess: React.FC = () => {
  const [, navigate] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [loginModal, setLoginModal] = useState<{
    isOpen: boolean;
    portalType: "admin" | "contractor" | "salesperson";
  }>({
    isOpen: false,
    portalType: "contractor",
  });

  // Temporarily allow users to stay on portals page for testing
  // In production, this should automatically redirect authenticated users

  const handlePortalAccess = (portalType: "admin" | "contractor" | "salesperson") => {
    if (isAuthenticated && user) {
      // If user is already authenticated, check if they can access this portal
      if (user.role === portalType) {
        // Navigate to their portal
        navigateToPortal(portalType);
      } else {
        // Show login modal for different portal type
        setLoginModal({ isOpen: true, portalType });
      }
    } else {
      // Not authenticated, show login modal
      setLoginModal({ isOpen: true, portalType });
    }
  };

  const navigateToPortal = (portalType: string) => {
    switch (portalType) {
      case "admin":
        navigate("/admin-portal");
        break;
      case "contractor":
        navigate("/contractor-portal");
        break;
      case "salesperson":
        navigate("/sales-portal");
        break;
    }
  };

  const handleLoginSuccess = (redirectTo: string) => {
    navigate(redirectTo);
  };

  return (
    <div className="min-h-screen bg-slate-900" style={{ backgroundColor: '#0f172a' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Header with optional logout */}
        {isAuthenticated && user && (
          <div className="flex justify-between items-center mb-8">
            <div className="text-white">
              Currently logged in as: <span className="font-semibold">{user.username}</span> ({user.role})
            </div>
            <button
              onClick={() => logout()}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        )}
        
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <img 
              src={logoPath} 
              alt="Global Home Solutions" 
              className="h-32 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-6">
            Portal Access
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Access your dedicated portal to manage your work and track performance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center border border-slate-700">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Contractor Portal</h3>
            <p className="text-slate-300 mb-6">
              Manage projects, view leads, and connect with sales representatives.
            </p>
            <button 
              onClick={() => handlePortalAccess("contractor")}
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors w-full"
            >
              Access Portal
            </button>
          </div>

          <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center border border-slate-700">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Sales Portal</h3>
            <p className="text-slate-300 mb-6">
              Track performance, manage leads, and generate QR codes for easy access.
            </p>
            <button 
              onClick={() => handlePortalAccess("salesperson")}
              className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors w-full"
            >
              Access Portal
            </button>
          </div>

          <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center border border-slate-700">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Admin Portal</h3>
            <p className="text-slate-300 mb-6">
              Oversee operations, manage users, and access comprehensive analytics.
            </p>
            <button 
              onClick={() => handlePortalAccess("admin")}
              className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors w-full"
            >
              Access Portal
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link 
            to="/"
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <LoginModal
        isOpen={loginModal.isOpen}
        onClose={() => setLoginModal({ ...loginModal, isOpen: false })}
        portalType={loginModal.portalType}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default PortalAccess;