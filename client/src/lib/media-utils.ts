// Media utilities for handling AWS S3 URLs and optimizing performance

export interface MediaFile {
  url: string;
  key?: string;
  type: 'image' | 'video';
  name: string;
  size?: number;
}

// Check if URL is an S3 URL
export const isS3Url = (url: string): boolean => {
  return url.includes('.s3.amazonaws.com') || url.includes('s3://');
};

// Check if URL is base64 data
export const isBase64Url = (url: string): boolean => {
  return url.startsWith('data:');
};

// Optimize image loading with lazy loading and error handling
export const createOptimizedImageElement = (src: string, alt: string): HTMLImageElement => {
  const img = new Image();
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  img.style.maxWidth = '100%';
  img.style.height = 'auto';
  
  // Add error handling for broken URLs
  img.onerror = () => {
    console.warn(`Failed to load image: ${src}`);
    img.src = '/placeholder-image.svg'; // Fallback image
  };
  
  return img;
};

// Upload files to S3 via optimized API
export const uploadFilesToS3 = async (files: File[]): Promise<MediaFile[]> => {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  const response = await fetch('/api/enhanced/upload/contractor-media', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload files to cloud storage');
  }
  
  const result = await response.json();
  return result.files;
};

// Delete file from S3
export const deleteFileFromS3 = async (key: string): Promise<void> => {
  const response = await fetch(`/api/video/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete file from cloud storage');
  }
};

// Get optimized video element
export const createOptimizedVideoElement = (src: string): HTMLVideoElement => {
  const video = document.createElement('video');
  video.src = src;
  video.controls = true;
  video.preload = 'metadata';
  video.style.maxWidth = '100%';
  video.style.height = 'auto';
  
  // Add error handling
  video.onerror = () => {
    console.warn(`Failed to load video: ${src}`);
  };
  
  return video;
};

// Convert legacy base64 URLs to optimized format
export const optimizeMediaUrl = (url: string): string => {
  if (isBase64Url(url)) {
    // For base64 URLs, we should ideally convert them to S3 URLs
    // For now, return as-is but log a warning for performance
    console.warn('Base64 media detected - consider upgrading to cloud storage for better performance');
    return url;
  }
  
  if (isS3Url(url)) {
    // S3 URLs are already optimized
    return url;
  }
  
  // Regular URLs
  return url;
};

// Batch upload with progress tracking
export const uploadFilesWithProgress = async (
  files: File[],
  onProgress?: (progress: number) => void
): Promise<MediaFile[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          resolve(result.files);
        } else {
          reject(new Error('Upload failed'));
        }
      };
      
      xhr.onerror = () => reject(new Error('Upload failed'));
      
      xhr.open('POST', '/api/upload/contractor-media');
      xhr.setRequestHeader('credentials', 'include');
      xhr.send(formData);
    } catch (error) {
      reject(error);
    }
  });
};

// Validate file before upload
export const validateMediaFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/mov', 'video/avi'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be under 100MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }
  
  return { valid: true };
};

// Create thumbnail for video files
export const createVideoThumbnail = (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = 1; // Seek to 1 second for thumbnail
    };
    
    video.onseeked = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailUrl);
      } else {
        reject(new Error('Could not create thumbnail'));
      }
    };
    
    video.onerror = () => reject(new Error('Could not load video'));
    
    video.src = URL.createObjectURL(videoFile);
  });
};