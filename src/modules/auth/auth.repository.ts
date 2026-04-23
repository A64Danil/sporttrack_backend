import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../shared/db/database.service';

export interface SessionWithEmail {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  user_agent?: string;
  ip_address?: string;
  email?: string;
  expires_at: Date;
  revoked_at?: Date;
  created_at: Date;
}

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

  async findSessionByRefreshToken(token: string) {
    // Note: With bcrypt hashed tokens, we need to fetch all active sessions
    // and compare them. For better performance, consider using a separate token index.
    const result = await this.db.query(
      `SELECT us.*, uai.email 
       FROM "UserSession" us
       LEFT JOIN "UserAuthIdentity" uai ON us.user_id = uai.user_id
       WHERE us.revoked_at IS NULL AND us.expires_at > NOW()
       ORDER BY us.created_at DESC
       LIMIT 100`,
      [],
    );
    return result.rows[0] as SessionWithEmail | undefined;
  }

  async findSessionsByUserId(userId: string) {
    const result = await this.db.query(
      `SELECT * FROM "UserSession" 
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
      [userId],
    );
    return result.rows;
  }

  async revokeSession(id: string) {
    return this.db.query(
      'UPDATE "UserSession" SET revoked_at = NOW() WHERE id = $1',
      [id],
    );
  }

  async revokeSessionByUserId(userId: string) {
    return this.db.query(
      'UPDATE "UserSession" SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    );
  }

  async revokeAllUserSessions(userId: string) {
    return this.db.query(
      'UPDATE "UserSession" SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    );
  }
}
