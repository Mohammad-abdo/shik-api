"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const AWS = require("aws-sdk");
const uuid_1 = require("uuid");
let FileUploadService = class FileUploadService {
    constructor(config) {
        this.config = config;
        this.s3 = new AWS.S3({
            accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
            region: this.config.get('AWS_REGION'),
        });
        this.bucket = this.config.get('AWS_S3_BUCKET') || 'shaykhi-uploads';
    }
    async uploadFile(file, folder = 'uploads', allowVideo = false) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const maxSize = allowVideo
            ? parseInt(this.config.get('MAX_VIDEO_SIZE') || '104857600')
            : parseInt(this.config.get('MAX_FILE_SIZE') || '5242880');
        if (file.size > maxSize) {
            throw new common_1.BadRequestException(`File size exceeds maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`);
        }
        const allowedTypes = allowVideo
            ? (this.config.get('ALLOWED_VIDEO_TYPES') || 'mp4,webm,mov,avi').split(',')
            : (this.config.get('ALLOWED_FILE_TYPES') || 'jpg,jpeg,png,pdf').split(',');
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        if (!fileExtension || !allowedTypes.includes(fileExtension)) {
            throw new common_1.BadRequestException(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        }
        const fileName = `${folder}/${(0, uuid_1.v4)()}-${Date.now()}.${fileExtension}`;
        const params = {
            Bucket: this.bucket,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        };
        try {
            if (!this.config.get('AWS_ACCESS_KEY_ID') || !this.config.get('AWS_SECRET_ACCESS_KEY')) {
                throw new Error('AWS credentials not configured');
            }
            const result = await this.s3.upload(params).promise();
            return result.Location;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
            if (errorMessage.includes('credentials') || errorMessage.includes('Access Denied')) {
                throw new common_1.BadRequestException('AWS credentials not configured or invalid. Please check your AWS configuration.');
            }
            else if (errorMessage.includes('bucket')) {
                throw new common_1.BadRequestException('S3 bucket not found or not accessible. Please check your bucket configuration.');
            }
            else {
                throw new common_1.BadRequestException(`Failed to upload file: ${errorMessage}`);
            }
        }
    }
    async deleteFile(fileUrl) {
        try {
            const key = fileUrl.split('.com/')[1];
            await this.s3.deleteObject({ Bucket: this.bucket, Key: key }).promise();
        }
        catch {
        }
    }
};
exports.FileUploadService = FileUploadService;
exports.FileUploadService = FileUploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FileUploadService);
//# sourceMappingURL=file-upload.service.js.map