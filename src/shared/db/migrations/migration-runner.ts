import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';

type MigrationRecord = {
  version: string;
};

const MIGRATIONS_TABLE = 'schema_migrations';
const BASELINE_VERSION = '0001_baseline_existing_schema';

export class MigrationRunner {
  async run(pool: Pool): Promise<void> {
    await this.ensureMigrationTable(pool);

    const appliedVersions = await this.getAppliedVersions(pool);
    const migrationFiles = await this.getMigrationFiles();

    if (appliedVersions.length === 0) {
      await this.ensureBaselineRecord(pool, appliedVersions);
    }

    const refreshedAppliedVersions = new Set(await this.getAppliedVersions(pool));

    for (const fileName of migrationFiles) {
      const version = this.normalizeVersion(fileName);

      if (refreshedAppliedVersions.has(version)) {
        continue;
      }

      const sql = await this.readMigrationSql(fileName);
      await this.applyMigration(pool, version, fileName, sql);
      refreshedAppliedVersions.add(version);
    }
  }

  private async ensureMigrationTable(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
        version varchar PRIMARY KEY,
        file_name varchar NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  private async getAppliedVersions(pool: Pool): Promise<string[]> {
    const result = await pool.query<MigrationRecord>(
      `SELECT version FROM "${MIGRATIONS_TABLE}" ORDER BY version ASC`,
    );
    return result.rows.map((row) => row.version);
  }

  private async ensureBaselineRecord(
    pool: Pool,
    appliedVersions: string[],
  ): Promise<void> {
    if (appliedVersions.includes(BASELINE_VERSION)) {
      return;
    }

    await pool.query(
      `INSERT INTO "${MIGRATIONS_TABLE}" (version, file_name) VALUES ($1, $2)`,
      [BASELINE_VERSION, `${BASELINE_VERSION}.sql`],
    );
  }

  private async getMigrationFiles(): Promise<string[]> {
    const migrationsDir = join(process.cwd(), 'db', 'migrations');
    try {
      const entries = await fs.readdir(migrationsDir);
      return entries
        .filter((entry) => entry.endsWith('.sql'))
        .sort((left, right) => left.localeCompare(right));
    } catch {
      return [];
    }
  }

  private async readMigrationSql(fileName: string): Promise<string> {
    const filePath = join(process.cwd(), 'db', 'migrations', fileName);
    return fs.readFile(filePath, 'utf8');
  }

  private async applyMigration(
    pool: Pool,
    version: string,
    fileName: string,
    sql: string,
  ): Promise<void> {
    await pool.query('BEGIN');

    try {
      await pool.query(sql);
      await pool.query(
        `INSERT INTO "${MIGRATIONS_TABLE}" (version, file_name) VALUES ($1, $2)`,
        [version, fileName],
      );
      await pool.query('COMMIT');
      console.log(`[MIGRATIONS] Applied ${fileName}`);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }

  private normalizeVersion(fileName: string): string {
    return fileName.replace(/\.sql$/i, '');
  }
}
