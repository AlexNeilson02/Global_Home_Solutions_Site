import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export default function DashboardRedirect() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "salesperson":
          navigate("/sales-dashboard");
          break;
        case "contractor":
          navigate("/contractor-dashboard");
          break;
        case "admin":
          navigate("/admin-dashboard");
          break;
        default:
          navigate("/dashboard-login");
      }
    } else {
      navigate("/quick-login");
    }
  }, [user, navigate]);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <p className="text-lg">Redirecting to your dashboard...</p>
    </div>
  );
}