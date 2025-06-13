import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Volume2, VolumeX } from 'lucide-react';
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
  const videoRef = useRef<HTMLVideoElement>(null);

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

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <div className="relative group">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-48 object-cover cursor-pointer"
            poster="" // Remove poster to show first frame
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
            </div>
          )}
          
          {/* Video Label */}
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            Intro Video
          </div>
        </div>
        
        {/* Video Info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            {contractorName} - Company Introduction
          </h3>
        </div>
      </CardContent>
    </Card>
  );
};