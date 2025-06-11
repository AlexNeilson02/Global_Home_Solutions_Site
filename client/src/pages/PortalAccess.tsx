import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import logoPath from "@/assets/global-home-solutions-logo.png";
import { LoginModal } from "@/components/LoginModal";
import { useAuth, User } from "@/hooks/useAuth";

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
      if ((user as User).role === portalType) {
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 px-4">
            <div className="text-white text-sm sm:text-base">
              Currently logged in as: <span className="font-semibold">{(user as User).username}</span> ({(user as User).role})
            </div>
            <button
              onClick={() => logout()}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              Logout
            </button>
          </div>
        )}
        
        <div className="text-center mb-12 sm:mb-16 lg:mb-20 px-4">
          <div className="flex justify-center mb-6 sm:mb-8">
            <img 
              src={logoPath} 
              alt="Global Home Solutions" 
              className="h-24 sm:h-32 lg:h-36 w-auto"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Portal Access
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto">
            Access your dedicated portal to manage your work and track performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 sm:p-8 text-center border border-slate-700">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Contractor Portal</h3>
            <p className="text-slate-300 mb-6 text-sm sm:text-base">
              Manage projects, view leads, and connect with sales representatives.
            </p>
            <button 
              onClick={() => handlePortalAccess("contractor")}
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors w-full text-sm sm:text-base"
            >
              Access Portal
            </button>
          </div>

          <div className="bg-slate-800 rounded-lg shadow-lg p-6 sm:p-8 text-center border border-slate-700">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Sales Portal</h3>
            <p className="text-slate-300 mb-6 text-sm sm:text-base">
              Track performance, manage leads, and generate QR codes for easy access.
            </p>
            <button 
              onClick={() => handlePortalAccess("salesperson")}
              className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors w-full text-sm sm:text-base"
            >
              Access Portal
            </button>
          </div>

          <div className="bg-slate-800 rounded-lg shadow-lg p-6 sm:p-8 text-center border border-slate-700">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Admin Portal</h3>
            <p className="text-slate-300 mb-6 text-sm sm:text-base">
              Oversee operations, manage users, and access comprehensive analytics.
            </p>
            <button 
              onClick={() => handlePortalAccess("admin")}
              className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors w-full text-sm sm:text-base"
            >
              Access Portal
            </button>
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-12 px-4">
          <Link 
            to="/"
            className="text-slate-400 hover:text-slate-200 transition-colors text-sm sm:text-base"
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