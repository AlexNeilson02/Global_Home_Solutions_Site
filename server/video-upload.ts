import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from './database-storage';
import { isAuthenticated } from './auth';

// Type declarations for ffmpeg modules
declare module 'fluent-ffmpeg' {
  interface FfmpegCommand {
    videoCodec(codec: string): FfmpegCommand;
    audioCodec(codec: string): FfmpegCommand;
    size(size: string): FfmpegCommand;
    videoBitrate(bitrate: string): FfmpegCommand;
    audioBitrate(bitrate: string): FfmpegCommand;
    format(format: string): FfmpegCommand;
    on(event: 'end', callback: () => void): FfmpegCommand;
    on(event: 'error', callback: (err: Error) => void): FfmpegCommand;
    save(filename: string): FfmpegCommand;
    ffprobe(callback: (err: any, metadata: any) => void): void;
  }
  function ffmpeg(input: string): FfmpegCommand;
  namespace ffmpeg {
    function setFfprobePath(path: string): void;
    function ffprobe(input: string, callback: (err: any, metadata: any) => void): void;
  }
  export = ffmpeg;
}

declare module 'ffprobe-static' {
  export const path: string;
}

import ffmpeg from 'fluent-ffmpeg';
import ffprobe from 'ffprobe-static';

// Configure ffmpeg to use the static ffprobe binary
ffmpeg.setFfprobePath(ffprobe.path);

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

// Function to get video duration and validate
const validateVideoFile = (filePath: string): Promise<{ duration: number; isValid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        resolve({ duration: 0, isValid: false, error: 'Invalid video file' });
        return;
      }

      const duration = metadata.format?.duration || 0;
      const isValid = duration <= 60; // Max 1 minute

      resolve({
        duration,
        isValid,
        error: isValid ? undefined : 'Video must be 60 seconds or less'
      });
    });
  });
};

// Function to compress video if needed
const compressVideo = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size('854x480') // 480p resolution
      .videoBitrate('1000k') // 1Mbps video bitrate
      .audioBitrate('128k') // 128kbps audio bitrate
      .format('mp4')
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        reject(err);
      })
      .save(outputPath);
  });
};

// Upload video endpoint
router.post('/upload', isAuthenticated, videoUpload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;

    // Validate video duration
    const validation = await validateVideoFile(filePath);
    if (!validation.isValid) {
      // Delete the uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: validation.error });
    }

    // Compress video if it's larger than 5MB
    let finalPath = filePath;
    if (req.file.size > 5 * 1024 * 1024) {
      const compressedFileName = `compressed-${fileName}`;
      const compressedPath = path.join(uploadsDir, compressedFileName);
      
      try {
        await compressVideo(filePath, compressedPath);
        // Delete original file after compression
        fs.unlinkSync(filePath);
        finalPath = compressedPath;
      } catch (compressionError) {
        console.warn('Video compression failed, using original file:', compressionError);
        // Continue with original file if compression fails
      }
    }

    // Generate public URL for the video
    const videoUrl = `/uploads/videos/${path.basename(finalPath)}`;

    res.json({
      success: true,
      videoUrl,
      duration: validation.duration,
      fileSize: fs.statSync(finalPath).size,
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