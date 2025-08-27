import React from 'react';
import { useRoute } from 'wouter';
import HomePage from '@/pages/HomePageNew';
import ServiceSelection from '@/pages/ServiceSelection';
import BrowseServices from '@/pages/BrowseServices';
import AboutUs from '@/pages/AboutUs';
import ContractorProfile from '@/pages/ContractorProfileDB';
import { useAuth } from '@/lib/auth-fixed';

export function UsernameRoute() {
  const { user } = useAuth();
  const [match, params] = useRoute('/:username');
  const [matchServices] = useRoute('/:username/services');
  const [matchBrowse] = useRoute('/:username/browse-services');
  const [matchAbout] = useRoute('/:username/about');
  const [matchContractor] = useRoute('/:username/contractor/:id');
  
  // Only render if the username in URL matches logged-in user
  if (!user || user.role !== 'homeowner') return null;
  
  if (matchContractor) {
    const [, contractorParams] = useRoute('/:username/contractor/:id');
    return <ContractorProfile />;
  }
  
  if (matchServices) {
    return <ServiceSelection />;
  }
  
  if (matchBrowse) {
    return <BrowseServices />;
  }
  
  if (matchAbout) {
    return <AboutUs />;
  }
  
  // Only show HomePage if the URL username matches the logged-in user
  if (match && params?.username === user.username) {
    return <HomePage />;
  }
  
  return null;
}