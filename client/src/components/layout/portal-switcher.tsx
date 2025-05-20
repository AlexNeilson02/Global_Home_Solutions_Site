import { useState } from "react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ChevronDown } from "lucide-react";

export function PortalSwitcher() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [currentPortal, setCurrentPortal] = useState("Public Website");

  const portalOptions = [
    { label: "Public Website", href: "/" }
  ];

  if (user) {
    if (user.role === "salesperson" || user.role === "admin") {
      portalOptions.push({ label: "Sales Portal", href: "/sales-dashboard" });
    }
    
    if (user.role === "contractor" || user.role === "admin") {
      portalOptions.push({ label: "Contractor Portal", href: "/contractor-dashboard" });
    }
    
    if (user.role === "admin") {
      portalOptions.push({ label: "Admin Portal", href: "/admin-dashboard" });
    }
  }

  const handlePortalChange = (label: string, href: string) => {
    setCurrentPortal(label);
    navigate(href);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 text-foreground">
          <span>{currentPortal}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {portalOptions.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onClick={() => handlePortalChange(option.label, option.href)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
