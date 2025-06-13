import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Play, Pause, AlertCircle, CheckCircle } from 'lucide-react';

interface VideoUploadProps {
  onVideoUploaded: (videoUrl: string) => void;
  currentVideoUrl?: string;
  onVideoRemoved?: () => void;
  maxFileSize?: number; // in MB
  maxDuration?: number; // in seconds
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onVideoUploaded,
  currentVideoUrl,
  onVideoRemoved,
  maxFileSize = 15,
  maxDuration = 60
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const validateVideoFile = (file: File): Promise<{ isValid: boolean; error?: string; duration?: number }> => {
    return new Promise((resolve) => {
      if (file.size > maxFileSize * 1024 * 1024) {
        resolve({ isValid: false, error: `File size must be under ${maxFileSize}MB` });
        return;
      }

      if (!file.type.startsWith('video/')) {
        resolve({ isValid: false, error: 'Please select a video file' });
        return;
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        if (duration > maxDuration) {
          resolve({ isValid: false, error: `Video must be ${maxDuration} seconds or less` });
        } else {
          resolve({ isValid: true, duration });
        }
      };

      video.onerror = () => {
        resolve({ isValid: false, error: 'Invalid video file' });
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    setValidationError(null);
    setIsValidating(true);

    try {
      const validation = await validateVideoFile(file);
      
      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid video file');
        setIsValidating(false);
        return;
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewVideo(previewUrl);
      setIsValidating(false);

      // Upload the file
      await uploadVideo(file);

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
      
    } catch (error) {
      console.error('Video validation error:', error);
      setValidationError('Error validating video file');
      setIsValidating(false);
    }
  };

  const uploadVideo = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onVideoUploaded(response.videoUrl);
          setPreviewVideo(null);
          toast({
            title: "Video uploaded successfully!",
            description: "Your intro video has been uploaded and is ready to display.",
          });
        } else {
          const errorData = JSON.parse(xhr.responseText);
          throw new Error(errorData.error || 'Upload failed');
        }
        setIsUploading(false);
        setUploadProgress(0);
      };

      xhr.onerror = () => {
        throw new Error('Network error during upload');
      };

      xhr.open('POST', '/api/video/upload');
      xhr.send(formData);

    } catch (error: any) {
      console.error('Video upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload video. Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
      setPreviewVideo(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveVideo = async () => {
    if (currentVideoUrl && onVideoRemoved) {
      try {
        const filename = currentVideoUrl.split('/').pop();
        const response = await fetch(`/api/video/${filename}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          onVideoRemoved();
          toast({
            title: "Video removed",
            description: "Your intro video has been removed.",
          });
        }
      } catch (error) {
        console.error('Error removing video:', error);
      }
    }
  };

  // Show current video if it exists
  if (currentVideoUrl && !previewVideo && !isUploading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Current Intro Video</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveVideo}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
            
            <div className="relative">
              <video
                src={currentVideoUrl}
                controls
                className="w-full h-48 bg-black rounded-lg object-cover"
                preload="metadata"
              >
                Your browser does not support video playback.
              </video>
            </div>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Replace Video
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Upload Intro Video</h3>
          
          {/* Upload Area */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${isUploading || isValidating ? 'opacity-50' : 'cursor-pointer hover:border-gray-400'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isUploading && !isValidating && fileInputRef.current?.click()}
          >
            {isValidating ? (
              <div className="space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
                <p className="text-sm text-gray-600">Validating video...</p>
              </div>
            ) : isUploading ? (
              <div className="space-y-3">
                <Upload className="h-8 w-8 mx-auto text-blue-500" />
                <p className="text-sm text-gray-600">Uploading video...</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500">{Math.round(uploadProgress)}% complete</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600">
                  Drag and drop your video here, or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Max {maxFileSize}MB • Max {maxDuration} seconds • MP4, MOV, AVI supported
                </p>
              </div>
            )}
          </div>

          {/* Preview Video */}
          {previewVideo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Preview</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreviewVideo(null);
                    setValidationError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <video
                ref={videoPreviewRef}
                src={previewVideo}
                controls
                className="w-full h-48 bg-black rounded-lg object-cover"
                preload="metadata"
              />
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{validationError}</p>
            </div>
          )}

          {/* Success Message */}
          {!isUploading && !validationError && !previewVideo && currentVideoUrl && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700">Video uploaded successfully!</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};