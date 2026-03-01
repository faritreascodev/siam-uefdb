import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, Request
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';
import { SecretaryManageUsersGuard } from '../auth/guards/secretary.guard';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, ModuleAccessGuard)
@ModuleAccess('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('roles')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved' })
  getRoles() {
    return this.usersService.findAllRoles();
  }

  // --- Profile Endpoints ---

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  getProfile(@Request() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    // Evitar que el usuario actualice su propio rol o active/desactive su cuenta por esta ruta
    const dto = updateUserDto as any;
    delete dto.roleName;
    delete dto.isActive;
    return this.usersService.update(req.user.id, updateUserDto);
  }

  // --- External Endpoints ---

  @Get()
  @Roles('superadmin', 'admin', 'secretary', 'principal', 'directivo')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a list of all users. Can filter by role.'
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/activate')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'Activate user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User activated' })
  activate(@Param('id') id: string) {
    return this.usersService.toggleActive(id, true);
  }

  @Patch(':id/deactivate')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  deactivate(@Param('id') id: string) {
    return this.usersService.toggleActive(id, false);
  }

  @Post(':id/reset-password')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'Manually reset user password' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Password reset successful, returns temp password' })
  resetPassword(@Param('id') id: string) {
    return this.usersService.resetPassword(id);
  }

  @Post(':id/roles/:roleId')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiParam({ name: 'roleId', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role assigned' })
  assignRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.usersService.assignRole(id, roleId);
  }

  @Delete(':id/roles/:roleId')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiParam({ name: 'roleId', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role removed' })
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.usersService.removeRole(id, roleId);
  }

  // --- Admin Endpoints ---

  @Get('pending')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'List pending users' })
  @ApiResponse({ status: 200, description: 'List of pending approval users' })
  findAllPending() {
    return this.usersService.findAllPending();
  }

  @Patch(':id/approve')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'Approve pending user' })
  @ApiResponse({ status: 200, description: 'User approved and apoderado role assigned' })
  approveUser(@Param('id') id: string) {
    return this.usersService.approveUser(id);
  }

  @Patch(':id/reject')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'Reject pending user' })
  @ApiResponse({ status: 200, description: 'User rejected' })
  rejectUser(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.usersService.rejectUser(id, reason);
  }

  @Patch('bulk/approve')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'Approve multiple users' })
  bulkApprove(@Body('ids') ids: string[], @Request() req: any) {
    return this.usersService.bulkApprove(ids, req.user);
  }

  @Patch('bulk/reject')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'Reject multiple users' })
  bulkReject(@Body('ids') ids: string[], @Request() req: any, @Body('reason') reason?: string) {
    return this.usersService.bulkReject(ids, req.user, reason);
  }

  @Get('password-recovery-requests')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'List pending password recovery requests' })
  @ApiResponse({ status: 200, description: 'List of recovery requests' })
  findAllRecoveryRequests() {
    return this.usersService.findAllRecoveryRequests();
  }

  @Patch('password-recovery-requests/:id/resolve')
  @Roles('superadmin', 'admin', 'secretary')
  @UseGuards(SecretaryManageUsersGuard)
  @ApiOperation({ summary: 'Resolve recovery request (Generate Temp Pass or Reject)' })
  @ApiBody({ schema: { type: 'object', properties: { action: { type: 'string', enum: ['APPROVE', 'REJECT'] } } } })
  @ApiResponse({ status: 200, description: 'Request resolved. Returns temp password if approved.' })
  resolveRecoveryRequest(@Param('id') id: string, @Body('action') action: 'APPROVE' | 'REJECT') {
    return this.usersService.resolveRecoveryRequest(id, action);
  }
}
