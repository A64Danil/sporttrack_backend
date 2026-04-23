import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dtos';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.authRepository.findIdentityByEmail(dto.email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const { user } = await this.userService.createUser({
      displayName: dto.displayName,
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.authRepository.createIdentity({
      userId: user.id,
      provider: 'local',
      providerUserId: dto.email,
      email: dto.email,
      passwordHash,
    });

    return this.login(dto.email, dto.password);
  }

  async login(email: string, password: string, context?: { userAgent?: string; ipAddress?: string }) {
    const identity = await this.authRepository.findIdentityByEmail(email);
    if (!identity || !(await bcrypt.compare(password, identity.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: identity.user_id, email: identity.email };
    const accessToken = this.jwtService.sign(payload);

    // Generate secure refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

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
    // Try to find session by comparing refresh tokens
    const session = await this.authRepository.findSessionByRefreshToken(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify the refresh token matches (stored as hash)
    const isValid = await bcrypt.compare(refreshToken, session.refresh_token_hash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = { sub: session.user_id, email: session.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
    };
  }

  async logout(refreshToken: string) {
    const session = await this.authRepository.findSessionByRefreshToken(refreshToken);
    if (session) {
      // Need to find and revoke - since we can't compare hash easily here,
      // we'll add a method to find by user_id
      await this.authRepository.revokeSessionByUserId(session.user_id);
    }
  }

  async getProfile(userId: string) {
    const user = await this.userService.findUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
