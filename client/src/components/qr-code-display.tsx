import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Download, ClipboardCopy, RefreshCw } from "lucide-react";

interface QRCodeDisplayProps {
  salespersonId?: number;
}

export function QRCodeDisplay({ salespersonId }: QRCodeDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery<{ qrCodeDataUrl: string, landingPageUrl: string }>({
    queryKey: ["/api/salespersons", salespersonId, "qrcode"],
    enabled: !!salespersonId
  });
  
  const handleDownload = () => {
    if (!data?.qrCodeDataUrl) return;
    
    setIsDownloading(true);
    
    try {
      // Create a link element
      const link = document.createElement("a");
      link.href = data.qrCodeDataUrl;
      link.download = `salesperson-qrcode-${salespersonId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Code Downloaded",
        description: "Your QR code has been downloaded successfully.",
      });
    } catch (err) {
      toast({
        title: "Download Failed",
        description: "There was an error downloading your QR code.",
        variant: "destructive",
      });
      console.error("QR code download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };
  
  const copyLinkToClipboard = () => {
    if (!data?.landingPageUrl) return;
    
    navigator.clipboard.writeText(data.landingPageUrl);
    toast({
      title: "Link Copied",
      description: "Your landing page link has been copied to clipboard.",
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-2"></div>
        <p className="text-sm text-muted-foreground">Generating QR code...</p>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-destructive/10 rounded-lg">
        <p className="text-sm text-destructive mb-2">Failed to generate QR code</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            // Use query invalidation instead of page reload to prevent authentication issues
            if (salespersonId) {
              queryClient.invalidateQueries({ queryKey: ["/api/salespersons", salespersonId, "qrcode"] });
              toast({
                title: "Retrying...",
                description: "Attempting to generate QR code again.",
              });
            }
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className="qr-code-container p-4 bg-white rounded-lg mb-3">
        <img 
          src={data.qrCodeDataUrl} 
          alt="QR Code for Salesperson Profile" 
          className="w-full max-w-[200px] h-auto"
        />
      </div>
      
      <div className="flex gap-2 w-full">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-current mr-1"></div>
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5 mr-1" />
              Download
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={copyLinkToClipboard}
        >
          <ClipboardCopy className="h-3.5 w-3.5 mr-1" />
          Copy Link
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Share this QR code to allow customers to quickly access your profile.
      </p>
    </div>
  );
}