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
  private readonly env: Record<string, string>;

  constructor() {
    this.env = process.env as Record<string, string>;
  }

  get database(): DatabaseConfig {
    return {
      host: this.env['DB_HOST'] || 'localhost',
      port: parseInt(this.env['DB_PORT'] || '5432', 10),
      username: this.env['POSTGRES_USER'] || 'app_user',
      password: this.env['POSTGRES_PASSWORD'] || 'app_password',
      database: this.env['POSTGRES_DB'] || 'fitness_db',
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