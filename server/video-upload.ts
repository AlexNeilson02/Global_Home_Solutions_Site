import { Router, Request, Response } from 'express';
import { storage } from './database-storage';
import { isAuthenticated } from './auth';
import { s3Upload } from './aws-s3-config';
import multer from 'multer';

const router = Router();

// Use the S3 upload directly for videos
const videoUpload = s3Upload;

// Basic file validation for S3 uploaded videos
const validateVideoFile = (file: any): { isValid: boolean; error?: string } => {
  // Check file size (100MB limit for S3)
  if (file.size > 100 * 1024 * 1024) {
    return { isValid: false, error: 'File size must be under 100MB' };
  }

  // Check if it's a video file
  if (!file.mimetype.startsWith('video/')) {
    return { isValid: false, error: 'Only video files are allowed' };
  }

  return { isValid: true };
};

// Upload video endpoint (now using AWS S3)
router.post('/upload', isAuthenticated, videoUpload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const file = req.file as any; // S3 multer file object
    
    // Basic validation
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      return res.status(400).json({ error: 'File size must be under 100MB' });
    }

    if (!file.mimetype.startsWith('video/')) {
      return res.status(400).json({ error: 'Only video files are allowed' });
    }

    res.json({
      success: true,
      videoUrl: file.location, // S3 URL
      key: file.key, // S3 key for future reference
      fileSize: file.size,
      message: 'Video uploaded successfully to cloud storage'
    });

  } catch (error: any) {
    console.error('Video upload error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum 100MB allowed.' });
    }

    res.status(500).json({ error: error.message || 'Video upload failed' });
  }
});

// Delete video from S3 endpoint
router.delete('/:key', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { deleteFileFromS3 } = await import('./aws-s3-config');
    
    await deleteFileFromS3(decodeURIComponent(key));
    res.json({ success: true, message: 'Video deleted successfully from cloud storage' });
  } catch (error: any) {
    console.error('Video delete error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

export { router as videoUploadRouter };