import React from 'react';
import { useRoute } from 'wouter';
import HomePage from '@/pages/HomePageNew';
import ServiceSelection from '@/pages/ServiceSelection';
import BrowseServices from '@/pages/BrowseServices';
import AboutUs from '@/pages/AboutUs';
import ContractorProfile from '@/pages/ContractorProfileDB';
import { useAuth } from '@/lib/auth-fixed';

export function UsernameRoute() {
  const { user, isLoading } = useAuth();
  const [matchContractor, contractorParams] = useRoute('/:username/contractor/:id');
  const [matchServices, servicesParams] = useRoute('/:username/services');
  const [matchBrowse, browseParams] = useRoute('/:username/browse-services');
  const [matchAbout, aboutParams] = useRoute('/:username/about');
  const [match, params] = useRoute('/:username');
  
  // Wait for auth to load
  if (isLoading) return null;
  
  // Only render for authenticated homeowners
  if (!user || user.role !== 'homeowner') return null;
  
  // Check if any username route matches
  if (matchContractor && contractorParams?.username === user.username) {
    return <ContractorProfile />;
  }
  
  if (matchServices && servicesParams?.username === user.username) {
    return <ServiceSelection />;
  }
  
  if (matchBrowse && browseParams?.username === user.username) {
    return <BrowseServices />;
  }
  
  if (matchAbout && aboutParams?.username === user.username) {
    return <AboutUs />;
  }
  
  // Show HomePage for the base username route
  if (match && params?.username === user.username) {
    return <HomePage />;
  }
  
  return null;
}