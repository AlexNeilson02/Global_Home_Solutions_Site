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
          { href: "/sales-dashboard/leads", label: "My Leads", icon: <Users className="w-5 h-5" /> },
          { href: "/sales-dashboard/contractors", label: "Contractors", icon: <Briefcase className="w-5 h-5" /> },
          { href: "/sales-dashboard/schedule", label: "Schedule", icon: <Calendar className="w-5 h-5" /> },
          { href: "/sales-dashboard/commissions", label: "Commissions", icon: <DollarSign className="w-5 h-5" /> },
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
    <div className={cn("hidden md:block w-64 bg-white shadow-sm p-6 space-y-8", className)}>      
      <div className="space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={cn(
              "flex items-center space-x-3 text-muted-foreground hover:text-primary hover:bg-primary-50 rounded-md px-3 py-2 cursor-pointer transition-colors",
              location === item.href && "text-primary font-medium bg-primary-50"
            )}>
              {item.icon}
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
      
      {user && (
        <div className="pt-8 mt-8 border-t border-border">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl || ""} alt={user.fullName} />
              <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{user.fullName}</h4>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
