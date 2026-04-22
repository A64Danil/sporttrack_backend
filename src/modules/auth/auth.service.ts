import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(data: { email: string; password: string; displayName: string }) {
    const existing = await this.authRepository.findIdentityByEmail(data.email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const { user } = await this.userService.createUser({
      displayName: data.displayName,
    });

    const passwordHash = await bcrypt.hash(data.password, 10);

    await this.authRepository.createIdentity({
      userId: user.id,
      provider: 'local',
      providerUserId: data.email,
      email: data.email,
      passwordHash,
    });

    return this.login(data.email, data.password);
  }

  async login(email: string, password: string, context?: { userAgent?: string; ipAddress?: string }) {
    const identity = await this.authRepository.findIdentityByEmail(email);
    if (!identity || !(await bcrypt.compare(password, identity.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: identity.user_id, email: identity.email };
    const accessToken = this.jwtService.sign(payload);

    const refreshToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    // Use the token directly as hash for simplicity in lookup
    const refreshTokenHash = refreshToken;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.authRepository.createSession({
      userId: identity.user_id,
      refreshTokenHash,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
      expiresAt,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const session = await this.authRepository.findSessionByRefreshToken(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = { sub: session.user_id };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
    };
  }

  async logout(refreshToken: string) {
    const session = await this.authRepository.findSessionByRefreshToken(refreshToken);
    if (session) {
      await this.authRepository.revokeSession(session.id);
    }
  }
}
