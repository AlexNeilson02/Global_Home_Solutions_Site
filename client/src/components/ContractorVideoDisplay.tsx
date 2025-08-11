import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Play, Volume2, VolumeX, Expand } from 'lucide-react';
import { useState, useRef } from 'react';

interface ContractorVideoDisplayProps {
  videoUrl?: string | null;
  contractorName: string;
  className?: string;
  autoplay?: boolean;
  showControls?: boolean;
}

export const ContractorVideoDisplay: React.FC<ContractorVideoDisplayProps> = ({
  videoUrl,
  contractorName,
  className = "",
  autoplay = false,
  showControls = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const enlargedVideoRef = useRef<HTMLVideoElement>(null);

  if (!videoUrl) {
    return null;
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = () => {
    if (!showControls) {
      handlePlayPause();
    }
  };

  const handleEnlarge = () => {
    setIsEnlarged(true);
  };

  const handleCloseEnlarged = () => {
    setIsEnlarged(false);
  };

  return (
    <>
      <Card 
        className={`overflow-hidden contractor-video-card no-yellow-border ${className}`}
        style={{
          outline: 'none',
          outlineColor: 'transparent',
          outlineWidth: '0',
          outlineStyle: 'none',
          border: '2px solid #e5e7eb',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none'
        }}
      >
        <CardContent 
          className="p-0 no-yellow-border"
          style={{
            outline: 'none',
            outlineColor: 'transparent',
            border: 'none',
            backgroundColor: 'white'
          }}
        >
          <div 
            className="relative group no-yellow-border"
            style={{
              outline: 'none',
              outlineColor: 'transparent',
              border: 'none'
            }}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-48 object-cover cursor-pointer contractor-video no-yellow-border"
              style={{
                outline: 'none',
                outlineColor: 'transparent',
                outlineWidth: '0',
                outlineStyle: 'none',
                border: 'none',
                backgroundColor: 'black',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
              poster="" 
              muted={isMuted}
              autoPlay={autoplay}
              loop={autoplay}
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={handleVideoClick}
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
            
            {/* Video Overlay Controls */}
            {showControls && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                {!isPlaying && (
                  <button
                    onClick={handlePlayPause}
                    className="bg-white/90 hover:bg-white text-black rounded-full p-3 transition-all transform group-hover:scale-110"
                    aria-label="Play video"
                  >
                    <Play className="h-6 w-6 ml-1" />
                  </button>
                )}
                
                {/* Volume Control */}
                <button
                  onClick={handleMuteToggle}
                  className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded p-1 transition-all opacity-0 group-hover:opacity-100"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                
                {/* Expand Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEnlarge();
                  }}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded p-1 transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Enlarge video"
                >
                  <Expand className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enlarged Video Modal */}
      <Dialog open={isEnlarged} onOpenChange={(open) => {
        if (!open) {
          setIsEnlarged(false);
        }
      }}>
        <DialogContent 
          className="max-w-4xl w-full p-0 no-yellow-border contractor-video-modal"
          data-component="video-modal"
          style={{
            outline: 'none',
            outlineColor: 'transparent',
            outlineWidth: '0',
            outlineStyle: 'none',
            border: '2px solid #374151',
            backgroundColor: 'black',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
          }}
        >
          <>
            <DialogTitle className="sr-only">
              Video Player - {contractorName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Enlarged video view with playback controls. Press Escape to close.
            </DialogDescription>
            <div 
              className="relative bg-black no-yellow-border"
              style={{
                outline: 'none',
                border: 'none'
              }}
            >
            
            <video
              ref={enlargedVideoRef}
              src={videoUrl}
              className="w-full h-auto max-h-[80vh] contractor-video-enlarged no-yellow-border"
              style={{
                outline: 'none',
                outlineColor: 'transparent',
                outlineWidth: '0',
                outlineStyle: 'none',
                border: 'none',
                backgroundColor: 'black',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
              controls
              autoPlay
              muted={isMuted}
              onLoadedData={() => {
                if (videoRef.current && enlargedVideoRef.current) {
                  enlargedVideoRef.current.currentTime = videoRef.current.currentTime;
                }
              }}
            >
              Your browser does not support video playback.
            </video>
            </div>
          </>
        </DialogContent>
      </Dialog>
    </>
  );
};