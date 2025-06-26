// Optimized media service for AWS S3 integration
// Removes database load by handling all media through cloud storage

import { uploadFileToS3, deleteFileFromS3, getS3Url, extractS3Key } from './aws-s3-config.js';
import { MediaFile, validateFileSize, validateMimeType, getFileType } from '../shared/media-schema.js';
import { storage } from './database-storage.js';

export class MediaService {
  /**
   * Upload files directly to S3 and return URLs for database reference
   */
  static async uploadFiles(
    files: Express.Multer.File[], 
    userId: number,
    category: string = 'general',
    relatedId?: number
  ): Promise<MediaFile[]> {
    const uploadedFiles: MediaFile[] = [];

    for (const file of files) {
      // Validate file before upload
      if (!validateMimeType(file.mimetype)) {
        throw new Error(`Unsupported file type: ${file.mimetype}`);
      }

      if (!validateFileSize(file as any)) {
        throw new Error(`File ${file.originalname} exceeds size limit`);
      }

      try {
        // Upload to S3
        const s3Key = await uploadFileToS3(
          file.buffer,
          file.originalname,
          file.mimetype,
          { userId: userId.toString() }
        );

        const s3Url = getS3Url(s3Key);
        const fileType = getFileType(file.mimetype);

        const mediaFile: MediaFile = {
          id: s3Key,
          url: s3Url,
          type: fileType,
          name: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date(),
          uploadedBy: userId
        };

        // Store minimal reference in documents table (S3 URL only, no binary data)
        await storage.createDocument({
          fileName: s3Key,
          originalName: file.originalname,
          fileType: fileType,
          mimeType: file.mimetype,
          fileSize: file.size,
          fileUrl: s3Url, // S3 URL only for performance
          uploadedBy: userId,
          category,
          relatedId,
          relatedType: category,
          isActive: true,
          tags: [fileType, category],
          description: `${fileType} file uploaded to S3`
        });

        uploadedFiles.push(mediaFile);
      } catch (error) {
        console.error('Failed to upload file to S3:', error);
        throw new Error(`Failed to upload ${file.originalname}: ${error}`);
      }
    }

    return uploadedFiles;
  }

  /**
   * Delete file from S3 and remove database reference
   */
  static async deleteFile(s3Url: string, userId: number): Promise<void> {
    try {
      const s3Key = extractS3Key(s3Url);
      if (!s3Key) {
        throw new Error('Invalid S3 URL');
      }

      // Delete from S3
      await deleteFileFromS3(s3Key);

      // Remove database reference
      const documents = await storage.getDocumentsByCategory('all');
      const document = documents.find(doc => doc.fileUrl === s3Url && doc.uploadedBy === userId);
      
      if (document) {
        await storage.deleteDocument(document.id);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Get media files for a specific entity (contractor, project, etc.)
   */
  static async getMediaFiles(category: string, relatedId?: number): Promise<MediaFile[]> {
    try {
      const documents = await storage.getDocumentsByCategory(category, relatedId);
      
      return documents
        .filter(doc => doc.isActive && doc.fileUrl.includes('s3'))
        .map(doc => ({
          id: doc.fileName,
          url: doc.fileUrl,
          type: doc.fileType as 'image' | 'video' | 'document',
          name: doc.originalName,
          size: doc.fileSize,
          mimeType: doc.mimeType,
          uploadedAt: doc.createdAt || new Date(),
          uploadedBy: doc.uploadedBy
        }));
    } catch (error) {
      console.error('Failed to get media files:', error);
      return [];
    }
  }

  /**
   * Clean up orphaned S3 files (files in S3 but not in database)
   */
  static async cleanupOrphanedFiles(): Promise<void> {
    // This would require listing S3 bucket contents and comparing with database
    // Implementation depends on specific cleanup requirements
    console.log('Cleanup orphaned files - implementation needed for production');
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(userId?: number): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
  }> {
    try {
      // Get documents by category to avoid needing getAllDocuments
      const documents = await storage.getDocumentsByCategory('contractor-media');
      
      let filteredDocuments = documents;
      if (userId) {
        filteredDocuments = documents.filter((doc: any) => doc.uploadedBy === userId);
      }

      const activeDocuments = filteredDocuments.filter((doc: any) => doc.isActive && doc.fileUrl.includes('s3'));
      
      const stats = {
        totalFiles: activeDocuments.length,
        totalSize: activeDocuments.reduce((sum: number, doc: any) => sum + doc.fileSize, 0),
        filesByType: activeDocuments.reduce((acc: Record<string, number>, doc: any) => {
          acc[doc.fileType] = (acc[doc.fileType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { totalFiles: 0, totalSize: 0, filesByType: {} };
    }
  }
}