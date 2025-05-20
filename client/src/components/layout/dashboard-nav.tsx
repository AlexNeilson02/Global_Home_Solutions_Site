import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function DashboardNav() {
  const [location] = useLocation();

  return (
    <div className="fixed top-20 right-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 border border-border">
      <h3 className="text-sm font-semibold mb-2">Test Navigation</h3>
      <div className="flex flex-col space-y-2">
        <Link href="/sales-dashboard">
          <Button 
            variant={location === "/sales-dashboard" ? "default" : "outline"} 
            size="sm" 
            className="w-full"
          >
            Sales Dashboard
          </Button>
        </Link>
        <Link href="/contractor-dashboard">
          <Button 
            variant={location === "/contractor-dashboard" ? "default" : "outline"} 
            size="sm" 
            className="w-full"
          >
            Contractor Dashboard
          </Button>
        </Link>
        <Link href="/admin-dashboard">
          <Button 
            variant={location === "/admin-dashboard" ? "default" : "outline"} 
            size="sm" 
            className="w-full"
          >
            Admin Dashboard
          </Button>
        </Link>
        <Link href="/">
          <Button 
            variant={location === "/" ? "default" : "outline"} 
            size="sm" 
            className="w-full"
          >
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}