import { ConfigService } from '@nestjs/config';
export declare class FileUploadService {
    private config;
    private s3;
    private bucket;
    constructor(config: ConfigService);
    uploadFile(file: Express.Multer.File, folder?: string, allowVideo?: boolean): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
}
