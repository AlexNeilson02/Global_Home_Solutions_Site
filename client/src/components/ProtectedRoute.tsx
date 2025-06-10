import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const navigate = useNavigate();
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

    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
      // User doesn't have required role, redirect to portal access page
      navigate('/portals');
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