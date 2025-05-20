import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
  };
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  chart?: React.ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  trend,
  icon: Icon,
  iconBgColor = "bg-primary-50",
  iconColor = "text-primary",
  chart,
  className
}: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-muted-foreground font-medium">{title}</h3>
          {Icon && (
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", iconBgColor)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
          )}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-semibold">{value}</p>
            {trend && (
              <p className={cn(
                "text-xs flex items-center",
                trend.positive ? "text-success" : 
                trend.neutral ? "text-muted-foreground" : 
                "text-destructive"
              )}>
                {trend.positive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-3 w-3">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                ) : trend.neutral ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-3 w-3">
                    <path d="M5 12h14"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-3 w-3">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                )}
                {trend.value}
              </p>
            )}
          </div>
          
          {chart && chart}
        </div>
      </CardContent>
    </Card>
  );
}
