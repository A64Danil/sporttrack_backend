import { Injectable } from '@nestjs/common';
import { DatabaseService, SqlExecutor } from '../../shared/db/database.service';

export type UserStreakCacheRow = {
  userId: string;
  currentStreak: number;
  lastActivityDate: Date | null;
  isDirty: boolean;
  lastCalculatedAt: Date;
};

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly database: DatabaseService) {}

  async transaction<T>(
    callback: (executor: SqlExecutor) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction(callback);
  }

  private async queryOne<T>(
    executor: SqlExecutor,
    text: string,
    values?: any[],
  ): Promise<T | null> {
    const result = await executor.query<T>(text, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  private normalizeDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return value instanceof Date ? value : new Date(String(value));
  }

  private normalizeCacheRow(
    row: Record<string, unknown> | null,
  ): UserStreakCacheRow | null {
    if (!row) {
      return null;
    }

    return {
      userId: String(row.userId),
      currentStreak: Number(row.currentStreak ?? 0),
      lastActivityDate: this.normalizeDate(row.lastActivityDate),
      isDirty: Boolean(row.isDirty),
      lastCalculatedAt: this.normalizeDate(row.lastCalculatedAt) ?? new Date(),
    };
  }

  async getStreakCache(
    userId: string,
    executor: SqlExecutor = this.database,
  ): Promise<UserStreakCacheRow | null> {
    const query = `
      SELECT
        user_id as "userId",
        current_streak as "currentStreak",
        last_activity_date as "lastActivityDate",
        is_dirty as "isDirty",
        last_calculated_at as "lastCalculatedAt"
      FROM "UserStreakCache"
      WHERE user_id = $1
    `;

    const row = await this.queryOne<Record<string, unknown>>(executor, query, [
      userId,
    ]);
    return this.normalizeCacheRow(row);
  }

  async upsertStreakCache(
    userId: string,
    currentStreak: number,
    lastActivityDate: Date | null,
    isDirty: boolean,
    executor: SqlExecutor = this.database,
  ): Promise<UserStreakCacheRow | null> {
    const query = `
      INSERT INTO "UserStreakCache"
        (user_id, current_streak, last_activity_date, is_dirty, last_calculated_at)
      VALUES ($1, $2, $3, $4, now())
      ON CONFLICT (user_id)
      DO UPDATE SET
        current_streak = EXCLUDED.current_streak,
        last_activity_date = EXCLUDED.last_activity_date,
        is_dirty = EXCLUDED.is_dirty,
        last_calculated_at = now()
      RETURNING
        user_id as "userId",
        current_streak as "currentStreak",
        last_activity_date as "lastActivityDate",
        is_dirty as "isDirty",
        last_calculated_at as "lastCalculatedAt"
    `;

    const row = await this.queryOne<Record<string, unknown>>(executor, query, [
      userId,
      currentStreak,
      lastActivityDate,
      isDirty,
    ]);
    return this.normalizeCacheRow(row);
  }

  async markStreakDirty(
    userId: string,
    executor: SqlExecutor = this.database,
  ): Promise<UserStreakCacheRow | null> {
    const query = `
      INSERT INTO "UserStreakCache"
        (user_id, current_streak, last_activity_date, is_dirty, last_calculated_at)
      VALUES ($1, 0, NULL, true, now())
      ON CONFLICT (user_id)
      DO UPDATE SET
        is_dirty = true,
        last_calculated_at = now()
      RETURNING
        user_id as "userId",
        current_streak as "currentStreak",
        last_activity_date as "lastActivityDate",
        is_dirty as "isDirty",
        last_calculated_at as "lastCalculatedAt"
    `;

    const row = await this.queryOne<Record<string, unknown>>(executor, query, [
      userId,
    ]);
    return this.normalizeCacheRow(row);
  }

  async calculateCurrentStreak(
    userId: string,
    executor: SqlExecutor = this.database,
  ): Promise<number> {
    const query = `
      WITH daily_activity AS (
        SELECT DISTINCT performed_at::date as activity_date
        FROM "ExerciseLog"
        WHERE user_id = $1
      ),
      ranked AS (
        SELECT
          activity_date,
          ROW_NUMBER() OVER (ORDER BY activity_date DESC) as rn
        FROM daily_activity
      ),
      streaks AS (
        SELECT
          activity_date,
          activity_date + (rn * INTERVAL '1 day') as streak_group
        FROM ranked
      )
      SELECT
        COUNT(*)::int as streak
      FROM streaks
      WHERE streak_group = (
        SELECT streak_group
        FROM streaks
        ORDER BY activity_date DESC
        LIMIT 1
      )
    `;

    const result = await this.queryOne<{ streak: number }>(executor, query, [
      userId,
    ]);

    return Number(result?.streak || 0);
  }

  async getLastActivityDate(
    userId: string,
    executor: SqlExecutor = this.database,
  ): Promise<Date | null> {
    const query = `
      SELECT MAX(performed_at)::date as "lastActivityDate"
      FROM "ExerciseLog"
      WHERE user_id = $1
    `;

    const result = await this.queryOne<{ lastActivityDate: Date | null }>(
      executor,
      query,
      [userId],
    );

    return this.normalizeDate(result?.lastActivityDate);
  }

  async getTotalLogs(
    userId: string,
    executor: SqlExecutor = this.database,
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM "ExerciseLog"
      WHERE user_id = $1
    `;

    const result = await this.queryOne<{ total: number }>(executor, query, [
      userId,
    ]);

    return Number(result?.total || 0);
  }
}
