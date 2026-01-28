import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private s3: AWS.S3;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.config.get<string>('AWS_REGION'),
    });
    this.bucket = this.config.get<string>('AWS_S3_BUCKET') || 'shaykhi-uploads';
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads', allowVideo: boolean = false): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const maxSize = allowVideo 
      ? parseInt(this.config.get<string>('MAX_VIDEO_SIZE') || '104857600') // 100MB default for videos
      : parseInt(this.config.get<string>('MAX_FILE_SIZE') || '5242880'); // 5MB default for other files
    
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`);
    }

    const allowedTypes = allowVideo
      ? (this.config.get<string>('ALLOWED_VIDEO_TYPES') || 'mp4,webm,mov,avi').split(',')
      : (this.config.get<string>('ALLOWED_FILE_TYPES') || 'jpg,jpeg,png,pdf').split(',');
    
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      throw new BadRequestException(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    const fileName = `${folder}/${uuidv4()}-${Date.now()}.${fileExtension}`;

    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    try {
      // Check if AWS credentials are configured
      if (!this.config.get<string>('AWS_ACCESS_KEY_ID') || !this.config.get<string>('AWS_SECRET_ACCESS_KEY')) {
        throw new Error('AWS credentials not configured');
      }

      const result = await this.s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      
      // Provide more specific error messages
      if (errorMessage.includes('credentials') || errorMessage.includes('Access Denied')) {
        throw new BadRequestException('AWS credentials not configured or invalid. Please check your AWS configuration.');
      } else if (errorMessage.includes('bucket')) {
        throw new BadRequestException('S3 bucket not found or not accessible. Please check your bucket configuration.');
      } else {
        throw new BadRequestException(`Failed to upload file: ${errorMessage}`);
      }
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const key = fileUrl.split('.com/')[1];
      await this.s3.deleteObject({ Bucket: this.bucket, Key: key }).promise();
    } catch {
      // Silently fail if file doesn't exist or key invalid
    }
  }
}



