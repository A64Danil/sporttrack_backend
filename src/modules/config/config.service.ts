import { Injectable } from '@nestjs/common';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
}

@Injectable()
export class ConfigService {
  private get env(): NodeJS.ProcessEnv {
    return process.env;
  }

  get database(): DatabaseConfig {
    return {
      host: this.env['DB_HOST'] || 'localhost',
      port: parseInt(this.env['DB_PORT'] || '5432', 10),
      username: this.env['DB_USERNAME'] || 'sporttrack_user',
      password: this.env['DB_PASSWORD'] || 'secure_password_123',
      database: this.env['DB_DATABASE'] || 'sporttrack_db',
    };
  }

  get jwt(): JwtConfig {
    return {
      secret: this.env['JWT_SECRET'] || 'dev-secret-key-change-in-production',
      expiresIn: this.env['JWT_EXPIRES_IN'] || '15m',
    };
  }

  get app(): AppConfig {
    return {
      port: parseInt(this.env['PORT'] || '3000', 10),
      nodeEnv: this.env['NODE_ENV'] || 'development',
    };
  }

  get(key: string, defaultValue?: string): string | undefined {
    return this.env[key] || defaultValue;
  }

  getOrThrow(key: string): string {
    const value = this.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
  }
}
