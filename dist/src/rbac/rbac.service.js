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
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RbacService = class RbacService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRole(dto) {
        return this.prisma.role.create({
            data: {
                name: dto.name,
                description: dto.description,
            },
        });
    }
    async getAllRoles() {
        return this.prisma.role.findMany({
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: {
                        userRoles: true,
                    },
                },
            },
        });
    }
    async getRoleById(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                userRoles: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return role;
    }
    async assignRoleToUser(dto) {
        const role = await this.prisma.role.findUnique({
            where: { id: dto.roleId },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.prisma.userRole.upsert({
            where: {
                userId_roleId: {
                    userId: dto.userId,
                    roleId: dto.roleId,
                },
            },
            create: {
                userId: dto.userId,
                roleId: dto.roleId,
            },
            update: {},
        });
    }
    async removeRoleFromUser(userId, roleId) {
        await this.prisma.userRole.deleteMany({
            where: {
                userId,
                roleId,
            },
        });
        return { message: 'Role removed from user successfully' };
    }
    async getUserRoles(userId) {
        return this.prisma.userRole.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async getUserPermissions(userId) {
        const userRoles = await this.prisma.userRole.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });
        const permissions = new Set();
        userRoles.forEach((userRole) => {
            userRole.role.permissions.forEach((rp) => {
                permissions.add(rp.permission.name);
            });
        });
        return Array.from(permissions);
    }
    async hasPermission(userId, permissionName) {
        const permissions = await this.getUserPermissions(userId);
        return permissions.includes(permissionName);
    }
    async createPermission(dto) {
        return this.prisma.permission.create({
            data: {
                name: dto.name,
                description: dto.description,
                resource: dto.resource,
                action: dto.action,
            },
        });
    }
    async getAllPermissions() {
        return this.prisma.permission.findMany({
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
    }
    async assignPermissionToRole(dto) {
        const permission = await this.prisma.permission.findUnique({
            where: { id: dto.permissionId },
        });
        if (!permission) {
            throw new common_1.NotFoundException('Permission not found');
        }
        const role = await this.prisma.role.findUnique({
            where: { id: dto.roleId },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return this.prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: dto.roleId,
                    permissionId: dto.permissionId,
                },
            },
            create: {
                roleId: dto.roleId,
                permissionId: dto.permissionId,
            },
            update: {},
        });
    }
    async removePermissionFromRole(roleId, permissionId) {
        await this.prisma.rolePermission.deleteMany({
            where: {
                roleId,
                permissionId,
            },
        });
        return { message: 'Permission removed from role successfully' };
    }
    async updateRole(id, dto) {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return this.prisma.role.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description && { description: dto.description }),
            },
        });
    }
    async deleteRole(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        await this.prisma.rolePermission.deleteMany({
            where: { roleId: id },
        });
        await this.prisma.userRole.deleteMany({
            where: { roleId: id },
        });
        return this.prisma.role.delete({
            where: { id },
        });
    }
    async updatePermission(id, dto) {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
        });
        if (!permission) {
            throw new common_1.NotFoundException('Permission not found');
        }
        return this.prisma.permission.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description && { description: dto.description }),
            },
        });
    }
    async deletePermission(id) {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
        });
        if (!permission) {
            throw new common_1.NotFoundException('Permission not found');
        }
        await this.prisma.rolePermission.deleteMany({
            where: { permissionId: id },
        });
        return this.prisma.permission.delete({
            where: { id },
        });
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RbacService);
//# sourceMappingURL=rbac.service.js.map