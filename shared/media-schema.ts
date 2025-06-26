// Media management schema for AWS S3 integration
// This separates media handling from database storage for better performance

import { z } from "zod";

// Media file types
export interface MediaFile {
  id: string; // S3 key
  url: string; // Full S3 URL
  type: 'image' | 'video' | 'document';
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: number;
}

// Validation schemas
export const mediaFileSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  type: z.enum(['image', 'video', 'document']),
  name: z.string(),
  size: z.number().positive(),
  mimeType: z.string(),
  uploadedAt: z.date(),
  uploadedBy: z.number()
});

export const uploadRequestSchema = z.object({
  files: z.array(z.instanceof(File)).min(1).max(10),
  category: z.string().optional(),
  relatedId: z.number().optional()
});

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
  document: 25 * 1024 * 1024 // 25MB
};

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/mov', 'video/avi'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Helper functions
export const getFileType = (mimeType: string): 'image' | 'video' | 'document' => {
  if (ALLOWED_MIME_TYPES.image.includes(mimeType)) return 'image';
  if (ALLOWED_MIME_TYPES.video.includes(mimeType)) return 'video';
  if (ALLOWED_MIME_TYPES.document.includes(mimeType)) return 'document';
  throw new Error(`Unsupported file type: ${mimeType}`);
};

export const validateFileSize = (file: File): boolean => {
  const type = getFileType(file.type);
  return file.size <= FILE_SIZE_LIMITS[type];
};

export const validateMimeType = (mimeType: string): boolean => {
  return Object.values(ALLOWED_MIME_TYPES).flat().includes(mimeType);
};