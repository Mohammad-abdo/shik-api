"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoModule = void 0;
const common_1 = require("@nestjs/common");
const video_service_1 = require("./video.service");
const video_progress_service_1 = require("./video-progress.service");
const video_controller_1 = require("./video.controller");
const video_progress_controller_1 = require("./video-progress.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let VideoModule = class VideoModule {
};
exports.VideoModule = VideoModule;
exports.VideoModule = VideoModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [video_controller_1.VideoController, video_progress_controller_1.VideoProgressController],
        providers: [video_service_1.VideoService, video_progress_service_1.VideoProgressService],
        exports: [video_service_1.VideoService, video_progress_service_1.VideoProgressService],
    })
], VideoModule);
//# sourceMappingURL=video.module.js.map