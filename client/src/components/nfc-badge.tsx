import { cn } from "@/lib/utils";
import { Wifi } from "lucide-react";

interface NfcBadgeProps {
  size?: "sm" | "md" | "lg";
  pulsing?: boolean;
  className?: string;
}

export function NfcBadge({ size = "md", pulsing = true, className }: NfcBadgeProps) {
  const sizeClasses = {
    sm: "w-12 h-12 text-lg",
    md: "w-16 h-16 text-xl",
    lg: "w-24 h-24 text-3xl"
  };
  
  return (
    <div 
      className={cn(
        "bg-primary rounded-full flex items-center justify-center text-white",
        pulsing && "nfc-pulse",
        sizeClasses[size],
        className
      )}
    >
      <Wifi />
    </div>
  );
}
