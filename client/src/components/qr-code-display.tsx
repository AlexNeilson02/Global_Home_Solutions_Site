import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, Copy, ExternalLink, Share2, Eye, Calendar, BarChart3 } from "lucide-react";

interface QRCodeDisplayProps {
  salesperson: any;
  user: any;
}

export function QRCodeDisplay({ salesperson, user }: QRCodeDisplayProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle cases where data isn't loaded yet
  if (!salesperson || !user) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your QR code...</p>
      </div>
    );
  }

  // Generate the landing page URL
  const landingPageUrl = `${window.location.origin}/sales/${salesperson?.profileUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(landingPageUrl);
      toast({
        title: "Link Copied!",
        description: "Your landing page link has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQR = () => {
    if (!salesperson?.qrCodeUrl) return;
    
    try {
      // Create a download link for the QR code
      const link = document.createElement('a');
      link.href = salesperson.qrCodeUrl;
      link.download = `${user.fullName?.replace(/\s+/g, '_')}_QR_Code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Code Downloaded!",
        description: "Your QR code has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.fullName} - Global Home Solutions`,
          text: `Get a quote for your home improvement project from ${user.fullName}`,
          url: landingPageUrl,
        });
      } catch (error) {
        // User cancelled or share failed, fallback to copy
        handleCopyLink();
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopyLink();
    }
  };

  const handlePreview = () => {
    window.open(landingPageUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* QR Code Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <CardTitle>Your QR Code</CardTitle>
          </div>
          <CardDescription>
            Share this QR code to direct customers to your personalized landing page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {salesperson?.qrCodeUrl ? (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* QR Code Display */}
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <img 
                    src={salesperson.qrCodeUrl} 
                    alt="QR Code"
                    className="h-48 w-48 object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadQR} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={handleShare} variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Landing Page Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor="landing-url">Landing Page URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="landing-url"
                      value={landingPageUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button onClick={handleCopyLink} variant="outline" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button onClick={handlePreview} variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">How to use your QR code:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">1.</span>
                      Download and print your QR code on business cards, flyers, or marketing materials
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">2.</span>
                      Customers scan the code with their phone camera to visit your landing page
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">3.</span>
                      They see your profile and available contractors, then can request quotes directly
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">4.</span>
                      Track your conversions and analytics in the dashboard
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">QR Code Not Available</h3>
              <p className="text-muted-foreground mb-4">
                Your QR code is being generated. Please refresh the page in a moment.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Landing Page Preview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <CardTitle>Landing Page Preview</CardTitle>
            </div>
            <Button onClick={handlePreview} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Page
            </Button>
          </div>
          <CardDescription>
            This is what customers see when they scan your QR code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold">{user.fullName?.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{user.fullName}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Verified Sales Rep</Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Contact Information:</p>
                <div className="text-sm text-muted-foreground">
                  <p>📧 {user.email}</p>
                  {user.phone && <p>📞 {user.phone}</p>}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Available Services:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Badge variant="outline">Plumbing</Badge>
                  <Badge variant="outline">Electrical</Badge>
                  <Badge variant="outline">HVAC</Badge>
                  <Badge variant="outline">Roofing</Badge>
                </div>
              </div>
              
              <div className="pt-2">
                <Button className="w-full" size="sm">
                  Request a Quote
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tips Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>Marketing Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Best Practices
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Include QR codes on all printed materials</li>
                <li>• Place codes at eye level for easy scanning</li>
                <li>• Test the code before printing large quantities</li>
                <li>• Include a brief call-to-action near the code</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Where to Use
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Business cards and flyers</li>
                <li>• Door hangers and yard signs</li>
                <li>• Vehicle decals and uniforms</li>
                <li>• Digital signatures and social media</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}