import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Settings, 
  Home
} from "lucide-react";
import globalLogoPath from "@/assets/global-home-solutions-logo.png";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  // Define navigation items based on user role
  const getNavItems = () => {
    switch (user?.role) {
      case "salesperson":
        return [
          { href: "/sales-dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
          { href: "/sales-dashboard/contractors", label: "Contractors", icon: <Briefcase className="w-5 h-5" /> },
          { href: "/sales-dashboard/bid-requests", label: "Bid Requests", icon: <Users className="w-5 h-5" /> },
          { href: "/sales-dashboard/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> }
        ];
      case "contractor":
        return [
          { href: "/contractor-dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
          { href: "/contractor-dashboard/leads", label: "Leads", icon: <Users className="w-5 h-5" /> },
          { href: "/contractor-dashboard/projects", label: "Projects", icon: <Briefcase className="w-5 h-5" /> },
          { href: "/contractor-dashboard/schedule", label: "Schedule", icon: <Calendar className="w-5 h-5" /> },
          { href: "/contractor-dashboard/payments", label: "Payments", icon: <DollarSign className="w-5 h-5" /> },
          { href: "/contractor-dashboard/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> }
        ];
      case "admin":
        return [
          { href: "/admin-dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
          { href: "/admin-dashboard/users", label: "Users", icon: <Users className="w-5 h-5" /> },
          { href: "/admin-dashboard/contractors", label: "Contractors", icon: <Briefcase className="w-5 h-5" /> },
          { href: "/admin-dashboard/sales", label: "Sales Team", icon: <Users className="w-5 h-5" /> },
          { href: "/admin-dashboard/revenue", label: "Revenue", icon: <DollarSign className="w-5 h-5" /> },
          { href: "/admin-dashboard/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className={cn("hidden md:block w-64 bg-white shadow-apple-md border-r border-border p-8 space-y-8", className)}>      
      {/* Logo Section */}
      <div className="flex items-center space-x-3 pb-4">
        <img src={globalLogoPath} alt="Global Home Solutions" className="h-10 w-10 rounded-apple" />
        <h2 className="text-lg font-semibold text-foreground">Global Home</h2>
      </div>
      
      {/* Navigation Items */}
      <div className="space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={cn(
              "nav-item flex items-center space-x-3 px-4 py-3 rounded-apple text-sm font-medium transition-all duration-200 ease-apple cursor-pointer",
              location === item.href 
                ? "bg-primary text-primary-foreground shadow-apple" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted hover:scale-105 active:scale-95"
            )}>
              {item.icon}
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
      
      {/* User Profile Section */}
      {user && (
        <div className="mt-auto pt-8 border-t border-border">
          <div className="apple-card p-4 !shadow-apple-sm">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 rounded-apple shadow-apple-sm">
                <AvatarImage src={user.avatarUrl || ""} alt={user.fullName} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground truncate">{user.fullName}</h4>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
