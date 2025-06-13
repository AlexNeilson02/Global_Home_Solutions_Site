import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContractorVideoDisplay } from "./ContractorVideoDisplay";
import { Star } from "lucide-react";

interface ContractorCardProps {
  id: number;
  companyName: string;
  description: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number | null;
  logoUrl: string | null;
  videoUrl?: string | null;
  onGetQuote?: (id: number) => void;
}

export function ContractorCard({
  id,
  companyName,
  description,
  specialties,
  rating,
  reviewCount,
  hourlyRate,
  logoUrl,
  videoUrl,
  onGetQuote
}: ContractorCardProps) {
  // Round rating to nearest half
  const roundedRating = Math.round(rating * 2) / 2;
  
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-start mb-4">
          <Avatar className="h-16 w-16 rounded-lg mr-4">
            <AvatarImage src={logoUrl || ""} alt={companyName} />
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-bold">
              {companyName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{companyName}</h3>
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(roundedRating)
                      ? "text-amber-600 fill-amber-600"
                      : i < roundedRating
                      ? "text-amber-600 fill-amber-600" // For half stars we could use a different icon, but for simplicity using the same
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-1 text-sm">({reviewCount})</span>
            </div>
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {specialties.map((specialty, index) => (
                <Badge key={index} variant="outline" className="bg-primary-50 text-primary text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* Video Section */}
        {videoUrl && (
          <div className="mb-4">
            <ContractorVideoDisplay
              videoUrl={videoUrl}
              contractorName={companyName}
              className="w-full"
              showControls={true}
            />
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            {hourlyRate ? `Starting at ${formatCurrency(hourlyRate)}/hr` : "Custom Quote"}
          </span>
          <Button 
            size="sm" 
            onClick={() => onGetQuote && onGetQuote(id)}
          >
            Get Quote
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
