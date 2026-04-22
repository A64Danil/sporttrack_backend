import { join } from 'node:path';
import { Pool } from 'pg';
import { ConfigService } from '../../modules/config/config.service';
import { loadEnvFile } from '../../shared/config/env-loader';
import { MigrationRunner } from './migrations/migration-runner';

async function main() {
  loadEnvFile(join(process.cwd(), '.env'));

  const configService = new ConfigService();
  const dbConfig = configService.database;
  const pool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
  });

  const runner = new MigrationRunner();

  try {
    await runner.run(pool);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[MIGRATIONS] Failed to apply migrations');
  console.error(error);
  process.exitCode = 1;
});
