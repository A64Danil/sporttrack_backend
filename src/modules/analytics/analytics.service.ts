import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { SqlExecutor } from '../../shared/db/database.service';
import { AnalyticsSyncPort } from '../../shared/analytics/analytics-sync.port';

export type AnalyticsSummary = {
  currentStreak: number;
  totalLogs: number;
  lastActivityDate: Date | null;
  isDirty: boolean;
  lastCalculatedAt: Date | null;
};

@Injectable()
export class AnalyticsService implements AnalyticsSyncPort {
  constructor(private readonly repository: AnalyticsRepository) {}

  async getCurrentStreak(userId: string): Promise<number> {
    const cache = await this.repository.getStreakCache(userId);

    if (cache && !cache.isDirty) {
      return cache.currentStreak;
    }

    return this.recalculate(userId);
  }

  async getSummary(userId: string): Promise<AnalyticsSummary> {
    const cache = await this.repository.getStreakCache(userId);

    if (!cache || cache.isDirty) {
      await this.recalculate(userId);
    }

    const freshCache = await this.repository.getStreakCache(userId);
    return {
      currentStreak: freshCache?.currentStreak || 0,
      totalLogs: await this.repository.getTotalLogs(userId),
      lastActivityDate:
        freshCache?.lastActivityDate || (await this.repository.getLastActivityDate(userId)),
      isDirty: freshCache?.isDirty || false,
      lastCalculatedAt: freshCache?.lastCalculatedAt || null,
    };
  }

  async recalculate(userId: string): Promise<number> {
    const currentStreak = await this.repository.calculateCurrentStreak(userId);
    const lastActivityDate = await this.repository.getLastActivityDate(userId);
    await this.repository.upsertStreakCache(
      userId,
      currentStreak,
      lastActivityDate,
      false,
    );
    return currentStreak;
  }

  async syncStreakCache(
    userId: string,
    executor: SqlExecutor,
  ): Promise<void> {
    const currentStreak = await this.repository.calculateCurrentStreak(
      userId,
      executor,
    );
    const lastActivityDate = await this.repository.getLastActivityDate(
      userId,
      executor,
    );

    await this.repository.upsertStreakCache(
      userId,
      currentStreak,
      lastActivityDate,
      false,
      executor,
    );
  }

  async markStreakDirty(
    userId: string,
    executor: SqlExecutor,
  ): Promise<void> {
    await this.repository.markStreakDirty(userId, executor);
  }
}
