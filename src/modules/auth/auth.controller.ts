import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as express from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any, @Req() req: express.Request) {
    return this.authService.login(body.email, body.password, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    return this.authService.refresh(body.refresh_token);
  }

  @Post('logout')
  async logout(@Body() body: any) {
    return this.authService.logout(body.refresh_token);
  }
}
