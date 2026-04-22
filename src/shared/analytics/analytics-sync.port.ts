import type { SqlExecutor } from '../db/database.service';

export interface AnalyticsSyncPort {
  syncStreakCache(userId: string, executor: SqlExecutor): Promise<void>;
  markStreakDirty(userId: string, executor: SqlExecutor): Promise<void>;
}

export const ANALYTICS_SYNC_PORT = Symbol('ANALYTICS_SYNC_PORT');
