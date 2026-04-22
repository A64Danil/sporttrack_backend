import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { Pool, QueryResultRow } from 'pg';
import { ConfigService } from '../../../modules/config/config.service';
import { loadEnvFile } from '../../../shared/config/env-loader';

type ExerciseTypeRow = QueryResultRow & {
  id: string;
  name: string;
  primaryMetric: string;
};

type SeedLogSpec = {
  typeId: string;
  performedAt: Date;
  metrics: Record<string, number>;
};

type SeedResult = {
  userId: string;
  displayName: string;
  typeIds: string[];
  logIds: string[];
};

const DEFAULT_DISPLAY_PREFIX = 'PhaseUser';
const BASE_PUSH_TYPE_NAME = 'Phase Seed Push';
const BASE_CARDIO_TYPE_NAME = 'Phase Seed Cardio';
const BASE_CATEGORY_NAME = 'Phase Seed';

export class PhaseTestDataSeeder {
  constructor(private readonly pool: Pool) {}

  async run(): Promise<SeedResult> {
    await this.pool.query('BEGIN');

    try {
      const user = await this.createUser();
      const pushType = await this.ensureExerciseType({
        name: BASE_PUSH_TYPE_NAME,
        primaryMetric: 'reps',
        equipmentType: 'bodyweight',
        categoryName: BASE_CATEGORY_NAME,
      });
      const cardioType = await this.ensureExerciseType({
        name: BASE_CARDIO_TYPE_NAME,
        primaryMetric: 'time',
        equipmentType: 'mixed',
        categoryName: BASE_CATEGORY_NAME,
      });

      const logIds: string[] = [];
      logIds.push(
        await this.createExerciseLog(user.id, {
          typeId: pushType.id,
          performedAt: new Date(),
          metrics: {
            reps: this.randomInt(8, 18),
            weight_kg: this.randomInt(0, 30),
          },
        }),
      );
      logIds.push(
        await this.createExerciseLog(user.id, {
          typeId: cardioType.id,
          performedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          metrics: {
            time: this.randomInt(300, 1800),
            distance_m: this.randomInt(500, 4000),
          },
        }),
      );

      await this.pool.query('COMMIT');

      return {
        userId: user.id,
        displayName: user.displayName,
        typeIds: [pushType.id, cardioType.id],
        logIds,
      };
    } catch (error) {
      await this.pool.query('ROLLBACK');
      throw error;
    }
  }

  private async createUser(): Promise<{ id: string; displayName: string }> {
    const id = randomUUID();
    const displayName = `${DEFAULT_DISPLAY_PREFIX}_${id.slice(0, 8)}`;

    await this.pool.query(
      `INSERT INTO "User" (id, created_at) VALUES ($1, now())`,
      [id],
    );
    await this.pool.query(
      `INSERT INTO "UserProfile" (id, user_id, display_name, created_at)
       VALUES ($1, $1, $2, now())`,
      [id, displayName],
    );

    return { id, displayName };
  }

  private async ensureExerciseType(input: {
    name: string;
    primaryMetric: string;
    equipmentType: string;
    categoryName: string;
  }): Promise<ExerciseTypeRow> {
    const existing = await this.pool.query<ExerciseTypeRow>(
      `SELECT id, name, primary_metric as "primaryMetric"
       FROM "ExerciseType"
       WHERE name = $1`,
      [input.name],
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    const categoryId = await this.ensureCategory(input.categoryName);
    const result = await this.pool.query<ExerciseTypeRow>(
      `INSERT INTO "ExerciseType"
        (category_id, name, primary_metric, equipment_type, description, is_system, created_at)
       VALUES ($1, $2, $3, $4, $5, false, now())
       RETURNING id, name, primary_metric as "primaryMetric"`,
      [
        categoryId,
        input.name,
        input.primaryMetric,
        input.equipmentType,
        `Auto-generated phase seed type: ${input.name}`,
      ],
    );

    return result.rows[0];
  }

  private async ensureCategory(name: string): Promise<string> {
    const existing = await this.pool.query<{ id: string }>(
      `SELECT id FROM "ExerciseCategory" WHERE name = $1`,
      [name],
    );

    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }

    const inserted = await this.pool.query<{ id: string }>(
      `INSERT INTO "ExerciseCategory" (name, created_at)
       VALUES ($1, now())
       RETURNING id`,
      [name],
    );

    return inserted.rows[0].id;
  }

  private async createExerciseLog(
    userId: string,
    spec: SeedLogSpec,
  ): Promise<string> {
    const logId = randomUUID();
    await this.pool.query(
      `INSERT INTO "ExerciseLog" (id, user_id, exercise_type_id, performed_at, created_at)
       VALUES ($1, $2, $3, $4, now())`,
      [logId, userId, spec.typeId, spec.performedAt],
    );

    for (const [key, value] of Object.entries(spec.metrics)) {
      await this.pool.query(
        `INSERT INTO "ExerciseLogMetric" (exercise_log_id, key, value, unit)
         VALUES ($1, $2, $3, $4)`,
        [logId, key, value, this.resolveUnit(key)],
      );
    }

    return logId;
  }

  private randomInt(min: number, max: number): number {
    const lower = Math.min(min, max);
    const upper = Math.max(min, max);
    return Math.floor(Math.random() * (upper - lower + 1)) + lower;
  }

  private resolveUnit(metricKey: string): string | null {
    if (metricKey === 'time') {
      return 'sec';
    }

    if (metricKey === 'distance_m') {
      return 'm';
    }

    if (metricKey === 'weight_kg') {
      return 'kg';
    }

    return null;
  }
}

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

  const seeder = new PhaseTestDataSeeder(pool);

  try {
    const result = await seeder.run();
    console.log(
      JSON.stringify(
        {
          status: 'ok',
          ...result,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[SEED] Failed to create phase test data');
  console.error(error);
  process.exitCode = 1;
});
