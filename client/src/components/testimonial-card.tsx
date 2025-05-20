import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Star } from "lucide-react";

interface TestimonialCardProps {
  fullName: string;
  rating: number;
  content: string;
  avatarUrl?: string;
}

export function TestimonialCard({
  fullName,
  rating,
  content,
  avatarUrl
}: TestimonialCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <Avatar className="h-12 w-12 mr-3">
            <AvatarImage src={avatarUrl || ""} alt={fullName} />
            <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold">{fullName}</h4>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground italic">{content}</p>
      </CardContent>
    </Card>
  );
}
