import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '../../modules/config/config.service';
import { logSql } from './sql-logger';

export interface SqlExecutor {
  query<T = any>(
    text: string,
    values?: any[],
  ): Promise<{ rows: T[]; rowCount: number }>;
}

@Injectable()
export class DatabaseService
  implements OnModuleInit, OnModuleDestroy, SqlExecutor
{
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
    logSql(text, values);
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

  async transaction<T>(callback: (executor: SqlExecutor) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    const executor: SqlExecutor = {
      query: async <T = any>(text: string, values?: any[]) => {
        logSql(text, values);
        const result = await client.query(text, values);
        return {
          rows: result.rows as T[],
          rowCount: result.rowCount || 0,
        };
      },
    };

    try {
      await client.query('BEGIN');
      const result = await callback(executor);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
