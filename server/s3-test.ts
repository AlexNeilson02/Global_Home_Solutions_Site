import { Router, Request, Response } from 'express';
import { s3Client, BUCKET_NAME } from './aws-s3-config';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

const router = Router();

// Test S3 connection
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1
    });
    
    const response = await s3Client.send(command);
    
    res.json({
      success: true,
      message: 'AWS S3 connection successful',
      bucket: BUCKET_NAME,
      region: process.env.AWS_REGION,
      objectCount: response.KeyCount || 0
    });
  } catch (error: any) {
    console.error('S3 connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'AWS S3 connection failed'
    });
  }
});

export { router as s3TestRouter };