import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import HomePage from "./HomePageNew";
import { useAuth } from "@/lib/auth-fixed";
import { useActivityTracking } from "@/lib/activity-tracker";

// This component wraps the homepage with logged-in homeowner features
export default function HomeownerRoute() {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const { user, loading } = useAuth();
  
  // Track page view activity
  useActivityTracking('page_view');
  
  // Extract username from path
  const routeUsername = params?.username || location.split('/')[1];
  
  useEffect(() => {
    // If user is logged in and visiting their own route, stay on it
    // If they're visiting someone else's route or not logged in, redirect to home
    if (!loading) {
      if (!user || user.role !== 'homeowner' || user.username !== routeUsername) {
        // If someone tries to access a homeowner route that's not theirs, redirect to home
        console.log('Unauthorized access to homeowner route, redirecting to home');
        setLocation('/');
      }
    }
  }, [user, loading, routeUsername, setLocation]);
  
  // While loading auth, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  
  // If not authorized, will redirect (handled by useEffect)
  if (!user || user.role !== 'homeowner' || user.username !== routeUsername) {
    return null;
  }
  
  // Render the homepage with logged-in homeowner context
  return <HomePage isHomeownerLoggedIn={true} homeownerData={user} />;
}