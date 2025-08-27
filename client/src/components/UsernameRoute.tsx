import React from 'react';
import { useLocation } from 'wouter';
import HomePage from '@/pages/HomePageNew';
import ServiceSelection from '@/pages/ServiceSelection';
import BrowseServices from '@/pages/BrowseServices';
import AboutUs from '@/pages/AboutUs';
import ContractorProfile from '@/pages/ContractorProfileDB';
import { useAuth } from '@/lib/auth-fixed';

export function UsernameRoute() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Wait for auth to load
  if (isLoading) return null;
  
  // Only render for authenticated homeowners
  if (!user || user.role !== 'homeowner') return null;
  
  // Parse the path
  const pathParts = location.split('/').filter(Boolean);
  const username = pathParts[0];
  
  // Verify the username matches
  if (username !== user.username) return null;
  
  // Handle different routes
  if (pathParts.length === 1) {
    // Just /:username
    return <HomePage />;
  }
  
  if (pathParts[1] === 'services') {
    return <ServiceSelection />;
  }
  
  if (pathParts[1] === 'browse-services') {
    return <BrowseServices />;
  }
  
  if (pathParts[1] === 'about') {
    return <AboutUs />;
  }
  
  if (pathParts[1] === 'contractor' && pathParts[2]) {
    return <ContractorProfile />;
  }
  
  // No matching route
  return null;
}