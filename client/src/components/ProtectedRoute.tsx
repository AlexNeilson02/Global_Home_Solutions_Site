import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const [, navigate] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;

    if (error || !user) {
      // Not authenticated, redirect to portal access page
      navigate('/portals');
      return;
    }

    // STRICT ROLE ENFORCEMENT: Users can ONLY access their designated portal
    // No cross-portal access allowed
    if (requiredRole && user.role !== requiredRole) {
      // Redirect user to their correct portal based on their role
      switch (user.role) {
        case 'admin':
          navigate('/admin-portal');
          break;
        case 'contractor':
          navigate('/contractor-portal');
          break;
        case 'salesperson':
          navigate('/sales-portal');
          break;
        default:
          // Unknown role, redirect to portals for re-authentication
          navigate('/portals');
          break;
      }
      return;
    }

    setIsAuthorized(true);
  }, [user, isLoading, error, requiredRole, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};