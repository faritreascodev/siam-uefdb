import { Controller, Post, Body, Get, UseGuards, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user (Pending Approval)' })
  @ApiResponse({ status: 201, description: 'User successfully registered, pending admin approval.' })
  @ApiResponse({ status: 409, description: 'Email or Cedula already exists.' })
  @ApiResponse({ status: 400, description: 'Invalid data (e.g., invalid Cedula).' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful (returns JWT).' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive/pending user.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('request-password-recovery')
  @ApiOperation({ summary: 'Request password recovery (Option B)' })
  @ApiResponse({ status: 201, description: 'Recovery request submitted to admin.' })
  @ApiResponse({ status: 400, description: 'User not found (generic error in prod, specific in MVP).' })
  @ApiBody({ schema: { type: 'object', properties: { cedula: { type: 'string' }, email: { type: 'string' } } } })
  requestPasswordRecovery(@Body() body: { cedula: string; email: string }) {
    return this.authService.requestPasswordRecovery(body.cedula, body.email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password-first-time')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password after first login (Forced)' })
  @ApiResponse({ status: 200, description: 'Password updated successfully.' })
  @ApiBody({ schema: { type: 'object', properties: { newPassword: { type: 'string', minLength: 6 } } } })
  changePasswordFirstTime(@Request() req, @Body() body: { newPassword: string }) {
    return this.authService.changePasswordFirstTime(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile data retrieved.' })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Test endpoint for superadmin access' })
  async adminOnly() {
    return { message: 'This endpoint is only for superadmins' };
  }
}
