import { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Download, ClipboardCopy } from "lucide-react";

interface QRCodeDisplayProps {
  salespersonId?: number;
  profileUrl?: string;
}

export function QRCodeDisplay({ salespersonId, profileUrl = "james-wilson" }: QRCodeDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  // Use Replit domain for mobile access when in development
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : "https://e4465d17-fbc4-4632-9fc6-647805444a45-00-34kcklenmaaiq.janeway.replit.dev";
  
  const landingPageUrl = `${baseUrl}/s/${profileUrl}`;
  
  const handleDownload = () => {
    if (!qrCodeRef.current) return;
    
    setIsDownloading(true);
    
    try {
      // Create a canvas from the QR code SVG
      const svg = qrCodeRef.current.querySelector("svg");
      const svgData = new XMLSerializer().serializeToString(svg!);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      // Set canvas size to match SVG
      canvas.width = svg!.width.baseVal.value;
      canvas.height = svg!.height.baseVal.value;
      
      img.onload = () => {
        // Draw white background
        ctx!.fillStyle = "white";
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG image on the canvas
        ctx!.drawImage(img, 0, 0);
        
        // Convert canvas to data URL and download
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `salesperson-qrcode-${salespersonId || "profile"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "QR Code Downloaded",
          description: "Your QR code has been downloaded successfully.",
        });
        
        setIsDownloading(false);
      };
      
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    } catch (err) {
      toast({
        title: "Download Failed",
        description: "There was an error downloading your QR code.",
        variant: "destructive",
      });
      console.error("QR code download error:", err);
      setIsDownloading(false);
    }
  };
  
  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(landingPageUrl);
    toast({
      title: "Link Copied",
      description: "Your landing page link has been copied to clipboard.",
    });
  };
  
  return (
    <div className="flex flex-col items-center">
      <div 
        ref={qrCodeRef} 
        className="qr-code-container p-4 bg-white rounded-lg mb-3"
      >
        <QRCode
          value={landingPageUrl}
          size={200}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          fgColor="#003366"
          level="H"
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