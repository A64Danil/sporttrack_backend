import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../shared/db/database.service';

@Injectable()
export class AuthRepository {
  constructor(private db: DatabaseService) {}

  async createIdentity(data: {
    userId: string;
    provider: string;
    providerUserId: string;
    email?: string;
    passwordHash?: string;
  }) {
    return this.db.query(
      `INSERT INTO "UserAuthIdentity" (user_id, provider, provider_user_id, email, password_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.userId, data.provider, data.providerUserId, data.email, data.passwordHash],
    );
  }

  async findIdentityByEmail(email: string) {
    const result = await this.db.query(
      'SELECT * FROM "UserAuthIdentity" WHERE email = $1 AND provider = \'local\'',
      [email],
    );
    return result[0];
  }

  async createSession(data: {
    userId: string;
    refreshTokenHash: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
  }) {
    return this.db.query(
      `INSERT INTO "UserSession" (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.userId, data.refreshTokenHash, data.userAgent, data.ipAddress, data.expiresAt],
    );
  }

  async findSessionByRefreshToken(hash: string) {
    const result = await this.db.query(
      'SELECT * FROM "UserSession" WHERE refresh_token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()',
      [hash],
    );
    return result[0];
  }

  async revokeSession(id: string) {
    return this.db.query(
      'UPDATE "UserSession" SET revoked_at = NOW() WHERE id = $1',
      [id],
    );
  }
}
