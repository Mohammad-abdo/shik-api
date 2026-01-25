import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty({ example: 'role-uuid' })
  @IsUUID()
  roleId: string;

  @ApiProperty({ example: 'permission-uuid' })
  @IsUUID()
  permissionId: string;
}



