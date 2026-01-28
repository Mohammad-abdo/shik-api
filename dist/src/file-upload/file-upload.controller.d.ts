import { FileUploadService } from './file-upload.service';
export declare class FileUploadController {
    private readonly fileUploadService;
    constructor(fileUploadService: FileUploadService);
    uploadFile(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    uploadAvatar(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    uploadVideo(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    uploadImage(file: Express.Multer.File): Promise<{
        url: string;
    }>;
}
