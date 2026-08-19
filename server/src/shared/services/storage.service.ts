// src/shared/services/storage.service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';
import crypto from 'crypto';
import path from 'path';

class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    this.bucketName = env.r2BucketName || 'imam-hassen-school';
    this.publicUrl = env.r2PublicUrl || '';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: env.r2Endpoint,
      credentials: {
        accessKeyId: env.r2AccessKeyId || '',
        secretAccessKey: env.r2SecretAccessKey || '',
      },
      forcePathStyle: true,
    });

    this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      // R2 buckets are created via Cloudflare dashboard
      console.log(`Using R2 bucket: ${this.bucketName}`);
    } catch (error) {
      console.error('Error checking bucket:', error);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    module: string,
    userId: string
  ): Promise<string> {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const key = `${module}/${userId}/${timestamp}-${randomString}${ext}`;

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    return this.getPublicUrl(key);
  }

  async uploadBuffer(
    buffer: Buffer,
    module: string,
    userId: string,
    mimeType: string,
    originalName: string
  ): Promise<string> {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const key = `${module}/${userId}/${timestamp}-${randomString}${ext}`;

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));

    return this.getPublicUrl(key);
  }

  async deleteFile(fileUrl: string) {
    try {
      const key = this.getKeyFromUrl(fileUrl);
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  private getKeyFromUrl(url: string): string {
    return url.replace(`${this.publicUrl}/`, '');
  }
}

export const storageService = new StorageService();