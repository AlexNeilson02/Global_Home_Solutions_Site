import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, getStatusColor } from "@/lib/utils";

interface ProjectCardProps {
  title: string;
  description: string;
  contractorName: string;
  status: string;
  date: string;
  imageUrl: string | null;
}

export function ProjectCard({
  title,
  description,
  contractorName,
  status,
  date,
  imageUrl
}: ProjectCardProps) {
  const { bg, text } = getStatusColor(status);
  
  return (
    <div>
      <div className="relative w-full h-48 mb-4 bg-muted rounded-lg overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <div className="flex items-center mb-3">
        <span className="text-sm text-muted-foreground">By {contractorName}</span>
        <Badge className={cn("ml-auto text-xs", bg, text)}>
          {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
