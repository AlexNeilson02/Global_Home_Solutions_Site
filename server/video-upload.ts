import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from './database-storage';
import { isAuthenticated } from './auth';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'videos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `contractor-video-${uniqueSuffix}${extension}`);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is a video
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Basic file validation (duration will be handled on client side)
const validateVideoFile = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
  // Check file size (15MB limit)
  if (file.size > 15 * 1024 * 1024) {
    return { isValid: false, error: 'File size must be under 15MB' };
  }

  // Check if it's a video file
  if (!file.mimetype.startsWith('video/')) {
    return { isValid: false, error: 'Only video files are allowed' };
  }

  return { isValid: true };
};

// Upload video endpoint
router.post('/upload', isAuthenticated, videoUpload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;

    // Validate video file
    const validation = validateVideoFile(req.file);
    if (!validation.isValid) {
      // Delete the uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: validation.error });
    }

    // Generate public URL for the video
    const videoUrl = `/uploads/videos/${fileName}`;

    res.json({
      success: true,
      videoUrl,
      fileSize: req.file.size,
      message: 'Video uploaded successfully'
    });

  } catch (error: any) {
    console.error('Video upload error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum 15MB allowed.' });
    }

    res.status(500).json({ error: error.message || 'Video upload failed' });
  }
});

// Delete video endpoint
router.delete('/:filename', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Video deleted successfully' });
    } else {
      res.status(404).json({ error: 'Video file not found' });
    }
  } catch (error: any) {
    console.error('Video delete error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

export { router as videoUploadRouter };