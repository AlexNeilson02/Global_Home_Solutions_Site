import multer from 'multer';
import { s3Upload, generatePresignedUrl, getS3Url, uploadFileToS3, deleteFileFromS3, extractS3Key } from './aws-s3-config';

// Export S3-based upload middleware
export const upload = s3Upload;

// Helper function to get file URL from S3
export const getFileUrl = async (key: string, usePresigned: boolean = false): Promise<string> => {
  try {
    if (usePresigned) {
      return await generatePresignedUrl(key);
    }
    return getS3Url(key);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

// Helper function for backward compatibility - converts S3 file to data URL if needed
export const fileToBase64 = async (s3Key: string, mimeType: string): Promise<string> => {
  try {
    // For S3 files, return the direct URL instead of base64
    // This improves performance by avoiding large base64 strings
    return getS3Url(s3Key);
  } catch (error) {
    console.error('Error getting S3 file URL:', error);
    throw error;
  }
};

// Helper function to save base64 data to S3
export const saveBase64ToS3 = async (base64Data: string, filename: string, userId?: string): Promise<string> => {
  try {
    // Extract base64 data and mime type
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 data format');
    }
    
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Create S3 key
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const folder = mimeType.startsWith('image/') ? 'images' : 'videos';
    const key = `${folder}/${userId || 'anonymous'}/${timestamp}-${randomSuffix}-${filename}`;
    
    // Upload to S3
    const url = await uploadFileToS3(buffer, key, mimeType, {
      originalName: filename,
      uploadedBy: userId || 'anonymous',
      uploadedAt: new Date().toISOString(),
    });
    
    return url;
  } catch (error) {
    console.error('Error saving base64 to S3:', error);
    throw error;
  }
};

// Helper function to delete file from S3
export const deleteFile = async (s3Url: string): Promise<void> => {
  try {
    const key = extractS3Key(s3Url);
    if (key) {
      await deleteFileFromS3(key);
    }
  } catch (error) {
    console.error('Error deleting file from S3:', error);
  }
};