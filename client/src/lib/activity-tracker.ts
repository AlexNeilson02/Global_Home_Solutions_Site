// Activity tracking utility for logged-in users
import { apiRequest } from './queryClient';

export type ActivityType = 
  | 'page_view' 
  | 'bid_request_sent' 
  | 'contractor_viewed' 
  | 'login' 
  | 'logout'
  | 'profile_updated'
  | 'service_browsed';

interface ActivityMetadata {
  contractorId?: number;
  bidRequestId?: number;
  serviceName?: string;
  searchQuery?: string;
  [key: string]: any;
}

const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return 'mobile';
  }
  if (/iPad|Android/i.test(userAgent) && !/Mobile/i.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
};

export const trackActivity = async (
  activityType: ActivityType, 
  path: string,
  metadata?: ActivityMetadata
) => {
  try {
    // Only track if user is logged in
    const authResponse = await fetch('/api/auth/user', { credentials: 'include' });
    if (!authResponse.ok) {
      return; // User not logged in, don't track
    }
    
    const user = await authResponse.json();
    
    await apiRequest('/api/activity/track', {
      method: 'POST',
      body: {
        userId: user.id,
        activityType,
        path,
        metadata: metadata || {},
        userAgent: navigator.userAgent,
        deviceType: getDeviceType(),
        sessionId: localStorage.getItem('sessionId') || generateSessionId(),
      },
    });
  } catch (error) {
    console.error('Failed to track activity:', error);
  }
};

const generateSessionId = (): string => {
  const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem('sessionId', sessionId);
  return sessionId;
};

// Hook for React components
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export const useActivityTracking = (activityType: ActivityType = 'page_view', metadata?: ActivityMetadata) => {
  const [location] = useLocation();
  
  useEffect(() => {
    trackActivity(activityType, location, metadata);
  }, [location, activityType]);
};