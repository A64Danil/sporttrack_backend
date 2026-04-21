import { Pool } from 'pg';
import { ConfigService } from '../../modules/config/config.service';

/**
 * Base Repository class with hybrid approach:
 * - CRUD via ORM-like methods
 * - Analytics via raw SQL
 */
export abstract class BaseRepository {
  protected pool: Pool;

  constructor(configService: ConfigService) {
    const db = configService.database;
    this.pool = new Pool({
      host: db.host,
      port: db.port,
      user: db.username,
      password: db.password,
      database: db.database,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * CRUD: Find one by id
   */
  async findById<T>(table: string, id: string): Promise<T | null> {
    const result = await this.pool.query(`SELECT * FROM "${table}" WHERE id = $1`, [id]);
    return (result.rows[0] as T) || null;
  }

  /**
   * CRUD: Find all with optional filters
   */
  async findAll<T>(
    table: string,
    filters?: Record<string, unknown>,
    limit = 100,
    offset = 0
  ): Promise<T[]> {
    let query = `SELECT * FROM "${table}"`;
    const params: unknown[] = [];

    if (filters && Object.keys(filters).length > 0) {
      const conditions = Object.keys(filters).map((key, i) => {
        params.push(filters[key]);
        return `"${key}" = $${i + 1}`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` LIMIT ${limit} OFFSET ${offset}`;
    const result = await this.pool.query(query, params);
    return result.rows as T[];
  }

  /**
   * CRUD: Insert record
   */
  async insert<T>(table: string, data: Record<string, unknown>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0] as T;
  }

  /**
   * CRUD: Update record
   */
  async update<T>(
    table: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `"${key}" = $${i + 2}`).join(', ');

    const query = `
      UPDATE "${table}" SET ${setClause} WHERE id = $1 RETURNING *
    `;

    const result = await this.pool.query(query, [id, ...values]);
    return (result.rows[0] as T) || null;
  }

  /**
   * CRUD: Delete record (soft delete recommended)
   */
  async delete(table: string, id: string): Promise<boolean> {
    const result = await this.pool.query(`DELETE FROM "${table}" WHERE id = $1`, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Analytics: Raw SQL executor for complex queries
   */
  async executeRaw<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  /**
   * Analytics: Count with filters
   */
  async count(table: string, filters?: Record<string, unknown>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM "${table}"`;
    const params: unknown[] = [];

    if (filters && Object.keys(filters).length > 0) {
      const conditions = Object.keys(filters).map((key, i) => {
        params.push(filters[key]);
        return `"${key}" = $${i + 1}`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * Close pool connection
   */
  async onModuleDestroy() {
    await this.pool.end();
  }
}