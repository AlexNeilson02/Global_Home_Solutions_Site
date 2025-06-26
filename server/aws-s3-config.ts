import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import multer from 'multer';
import path from 'path';

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'global-home-solutions-media';

// Configure multer with S3 storage
export const s3Storage = multerS3({
  s3: s3Client,
  bucket: BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req: any, file: any, cb: any) => {
    // Create organized folder structure
    const userId = (req as any).user?.id || 'anonymous';
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    
    let folder = 'general';
    if (file.mimetype.startsWith('image/')) {
      folder = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'videos';
    }
    
    const key = `${folder}/${userId}/${timestamp}-${randomSuffix}${extension}`;
    cb(null, key);
  },
  metadata: (req: any, file: any, cb: any) => {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
      uploadedBy: (req as any).user?.id?.toString() || 'anonymous',
      uploadedAt: new Date().toISOString(),
    });
  },
});

// File filter for allowed media types
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/mov',
    'video/avi'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

// Create multer upload instance with S3 storage
export const s3Upload = multer({
  storage: s3Storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    files: 10 // Maximum 10 files
  }
});

// Helper functions for S3 operations
export const generatePresignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
};

export const uploadFileToS3 = async (
  fileBuffer: Buffer,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: metadata,
    });
    
    await s3Client.send(command);
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

export const deleteFileFromS3 = async (key: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

// Get S3 URL from key
export const getS3Url = (key: string): string => {
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
};

// Extract S3 key from URL
export const extractS3Key = (url: string): string | null => {
  try {
    const urlParts = url.split('.s3.amazonaws.com/');
    return urlParts.length > 1 ? urlParts[1] : null;
  } catch {
    return null;
  }
};

export { s3Client, BUCKET_NAME };