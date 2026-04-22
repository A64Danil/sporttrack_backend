import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '../../modules/config/config.service';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const dbConfig = this.configService.database;
    this.pool = new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }

  async query<T = any>(
    text: string,
    values?: any[],
  ): Promise<{ rows: T[]; rowCount: number }> {
    const result = await this.pool.query(text, values);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount || 0,
    };
  }

  async queryOne<T = any>(
    text: string,
    values?: any[],
  ): Promise<T | null> {
    const result = await this.query<T>(text, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
