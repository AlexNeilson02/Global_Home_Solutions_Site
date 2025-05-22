import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import NfcLanding from "@/pages/nfc-landing";
import SalespersonProfile from "@/pages/salesperson-profile-fixed";
import SalespersonOnboarding from "@/pages/salesperson-onboarding";
import Login from "@/pages/login";
import DashboardLogin from "@/pages/dashboard-login";
import SalesDashboard from "@/pages/sales-dashboard";
import ContractorDashboard from "@/pages/contractor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth, AuthProvider } from "@/lib/auth";

function Router() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  
  // Hide header and footer for NFC landing pages
  const isNfcPage = location.startsWith("/rep/");
  
  // Dashboard routes based on user role and onboarding status
  const getDashboardRoute = () => {
    if (!user) return "/login";
    
    // Check if this is a new salesperson that needs onboarding
    if (user.role === "salesperson") {
      // We'll fetch the salesperson data to check if they need onboarding
      const checkOnboardingStatus = async () => {
        try {
          const response = await fetch(`/api/salespersons/${user.id}`);
          const data = await response.json();
          
          // If salesperson data is missing key fields like bio, redirect to onboarding
          if (!data.salesperson?.bio) {
            window.location.href = "/salesperson-onboarding";
          } else {
            window.location.href = "/sales-dashboard";
          }
        } catch (error) {
          // If there's an error, default to dashboard
          window.location.href = "/sales-dashboard";
        }
      };
      
      // Execute the check
      checkOnboardingStatus();
      return "/sales-dashboard"; // Default return while async check happens
    }
    
    switch (user.role) {
      case "contractor":
        return "/contractor-dashboard";
      case "admin":
        return "/admin-dashboard";
      default:
        return "/";
    }
  };
  
  // Protected route helper
  const ProtectedRoute = ({ children, roles = [] }: { children: React.ReactNode, roles?: string[] }) => {
    // We now have proper authentication, so we can disable test mode
    const isTestMode = false;
    
    if (isTestMode) {
      return <>{children}</>;
    }
    
    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    
    if (!user) {
      // Redirect to login page if not authenticated
      window.location.href = "/login";
      return null;
    }
    
    if (roles.length > 0 && !roles.includes(user.role)) {
      // Redirect to their respective dashboard if they don't have access to this route
      // Never redirect to home
      switch (user.role) {
        case "salesperson":
          window.location.href = "/sales-dashboard";
          break;
        case "contractor":
          window.location.href = "/contractor-dashboard";
          break;
        case "admin":
          window.location.href = "/admin-dashboard";
          break;
        default:
          window.location.href = "/login";
      }
      return null;
    }
    
    return <>{children}</>;
  };

  return (
    <>
      {!isNfcPage && <Header />}
      
      <main>
        <Switch>
          {/* Public routes */}
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/dashboard-login" component={DashboardLogin} />
          <Route path="/rep/:profileUrl" component={NfcLanding} />
          <Route path="/s/:profileUrl" component={SalespersonProfile} />
          <Route path="/salesperson-onboarding" component={SalespersonOnboarding} />
          
          {/* Protected routes */}
          <Route path="/sales-dashboard/:section*">
            <ProtectedRoute roles={["salesperson", "admin"]}>
              <SalesDashboard />
            </ProtectedRoute>
          </Route>
          
          <Route path="/contractor-dashboard">
            <ProtectedRoute roles={["contractor", "admin"]}>
              <ContractorDashboard />
            </ProtectedRoute>
          </Route>
          
          <Route path="/admin-dashboard">
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          </Route>
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      
      {!isNfcPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
