import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../shared/db/database.service';
import {
  ExerciseCategory,
  ExerciseType,
  ExerciseLog,
  ExerciseLogMetric,
} from '../../shared/db/entities';

@Injectable()
export class ExerciseRepository {
  constructor(private database: DatabaseService) {}

  // ==================== ExerciseCategory ====================

  async createCategory(
    name: string,
    parentId?: string,
  ): Promise<ExerciseCategory | null> {
    const query = `
      INSERT INTO "ExerciseCategory" (name, parent_id)
      VALUES ($1, $2)
      RETURNING id, name, parent_id as "parentId", created_at as "createdAt"
    `;
    return this.database.queryOne(query, [name, parentId || null]);
  }

  async getCategory(id: string): Promise<ExerciseCategory | null> {
    const query = `
      SELECT id, name, parent_id as "parentId", created_at as "createdAt"
      FROM "ExerciseCategory"
      WHERE id = $1
    `;
    return this.database.queryOne(query, [id]);
  }

  async getAllCategories(): Promise<ExerciseCategory[]> {
    const query = `
      SELECT id, name, parent_id as "parentId", created_at as "createdAt"
      FROM "ExerciseCategory"
      ORDER BY created_at ASC
    `;
    const result = await this.database.query(query);
    return result.rows;
  }

  // ==================== ExerciseType ====================

  async createExerciseType(data: {
    categoryId?: string;
    name: string;
    primaryMetric: string;
    equipmentType: string;
    description?: string;
    mainMediaUrl?: string;
    createdByUserId?: string;
    isSystem?: boolean;
  }): Promise<ExerciseType | null> {
    const query = `
      INSERT INTO "ExerciseType" 
        (category_id, name, primary_metric, equipment_type, description, main_media_url, created_by_user_id, is_system)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, 
        category_id as "categoryId", 
        name, 
        primary_metric as "primaryMetric", 
        equipment_type as "equipmentType", 
        description, 
        main_media_url as "mainMediaUrl", 
        created_by_user_id as "createdByUserId", 
        is_system as "isSystem", 
        created_at as "createdAt"
    `;

    return this.database.queryOne(query, [
      data.categoryId || null,
      data.name,
      data.primaryMetric,
      data.equipmentType,
      data.description || null,
      data.mainMediaUrl || null,
      data.createdByUserId || null,
      data.isSystem || false,
    ]);
  }

  async getExerciseType(id: string): Promise<ExerciseType | null> {
    const query = `
      SELECT 
        id, 
        category_id as "categoryId", 
        name, 
        primary_metric as "primaryMetric", 
        equipment_type as "equipmentType", 
        description, 
        main_media_url as "mainMediaUrl", 
        created_by_user_id as "createdByUserId", 
        is_system as "isSystem", 
        created_at as "createdAt"
      FROM "ExerciseType"
      WHERE id = $1
    `;
    return this.database.queryOne(query, [id]);
  }

  async getExerciseTypesByCategory(
    categoryId: string,
  ): Promise<ExerciseType[]> {
    const query = `
      SELECT 
        id, 
        category_id as "categoryId", 
        name, 
        primary_metric as "primaryMetric", 
        equipment_type as "equipmentType", 
        description, 
        main_media_url as "mainMediaUrl", 
        created_by_user_id as "createdByUserId", 
        is_system as "isSystem", 
        created_at as "createdAt"
      FROM "ExerciseType"
      WHERE category_id = $1
      ORDER BY created_at ASC
    `;
    const result = await this.database.query(query, [categoryId]);
    return result.rows;
  }

  async getAllExerciseTypes(): Promise<ExerciseType[]> {
    const query = `
      SELECT 
        id, 
        category_id as "categoryId", 
        name, 
        primary_metric as "primaryMetric", 
        equipment_type as "equipmentType", 
        description, 
        main_media_url as "mainMediaUrl", 
        created_by_user_id as "createdByUserId", 
        is_system as "isSystem", 
        created_at as "createdAt"
      FROM "ExerciseType"
      ORDER BY created_at ASC
    `;
    const result = await this.database.query(query);
    return result.rows;
  }

  async getSystemExerciseTypes(): Promise<ExerciseType[]> {
    const query = `
      SELECT 
        id, 
        category_id as "categoryId", 
        name, 
        primary_metric as "primaryMetric", 
        equipment_type as "equipmentType", 
        description, 
        main_media_url as "mainMediaUrl", 
        created_by_user_id as "createdByUserId", 
        is_system as "isSystem", 
        created_at as "createdAt"
      FROM "ExerciseType"
      WHERE is_system = true
      ORDER BY created_at ASC
    `;
    const result = await this.database.query(query);
    return result.rows;
  }

  async updateExerciseType(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      mainMediaUrl: string;
    }>,
  ): Promise<ExerciseType | null> {
    const updates: string[] = [];
    const values: any[] = [id];
    let paramCount = 2;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(data.name);
      paramCount++;
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(data.description);
      paramCount++;
    }
    if (data.mainMediaUrl !== undefined) {
      updates.push(`main_media_url = $${paramCount}`);
      values.push(data.mainMediaUrl);
      paramCount++;
    }

    if (updates.length === 0) {
      return this.getExerciseType(id);
    }

    const query = `
      UPDATE "ExerciseType"
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING 
        id, 
        category_id as "categoryId", 
        name, 
        primary_metric as "primaryMetric", 
        equipment_type as "equipmentType", 
        description, 
        main_media_url as "mainMediaUrl", 
        created_by_user_id as "createdByUserId", 
        is_system as "isSystem", 
        created_at as "createdAt"
    `;

    return this.database.queryOne(query, values);
  }

  // ==================== ExerciseLog ====================

  async createExerciseLog(data: {
    userId: string;
    exerciseTypeId: string;
    performedAt: Date;
    metrics?: Record<string, number>;
  }): Promise<ExerciseLog | null> {
    const query = `
      INSERT INTO "ExerciseLog" (user_id, exercise_type_id, performed_at)
      VALUES ($1, $2, $3)
      RETURNING 
        id, 
        user_id as "userId", 
        exercise_type_id as "exerciseTypeId", 
        performed_at as "performedAt", 
        created_at as "createdAt"
    `;

    return this.database.queryOne(query, [
      data.userId,
      data.exerciseTypeId,
      data.performedAt,
    ]);
  }

  async getExerciseLog(id: string): Promise<ExerciseLog | null> {
    const query = `
      SELECT 
        id, 
        user_id as "userId", 
        exercise_type_id as "exerciseTypeId", 
        performed_at as "performedAt", 
        created_at as "createdAt"
      FROM "ExerciseLog"
      WHERE id = $1
    `;
    return this.database.queryOne(query, [id]);
  }

  async getExerciseLogsByUser(
    userId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<ExerciseLog[]> {
    const query = `
      SELECT 
        id, 
        user_id as "userId", 
        exercise_type_id as "exerciseTypeId", 
        performed_at as "performedAt", 
        created_at as "createdAt"
      FROM "ExerciseLog"
      WHERE user_id = $1
      ORDER BY performed_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.database.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async getExerciseLogsByUserAndDateRange(
    userId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<ExerciseLog[]> {
    const query = `
      SELECT 
        id, 
        user_id as "userId", 
        exercise_type_id as "exerciseTypeId", 
        performed_at as "performedAt", 
        created_at as "createdAt"
      FROM "ExerciseLog"
      WHERE user_id = $1 AND performed_at BETWEEN $2 AND $3
      ORDER BY performed_at DESC
    `;
    const result = await this.database.query(query, [
      userId,
      fromDate,
      toDate,
    ]);
    return result.rows;
  }

  async getExerciseLogsByType(
    exerciseTypeId: string,
    userId: string,
    limit: number = 3,
  ): Promise<ExerciseLog[]> {
    const query = `
      SELECT 
        id, 
        user_id as "userId", 
        exercise_type_id as "exerciseTypeId", 
        performed_at as "performedAt", 
        created_at as "createdAt"
      FROM "ExerciseLog"
      WHERE user_id = $1 AND exercise_type_id = $2
      ORDER BY performed_at DESC
      LIMIT $3
    `;
    const result = await this.database.query(query, [
      userId,
      exerciseTypeId,
      limit,
    ]);
    return result.rows;
  }

  async updateExerciseLog(
    id: string,
    performedAt: Date,
  ): Promise<ExerciseLog | null> {
    const query = `
      UPDATE "ExerciseLog"
      SET performed_at = $1
      WHERE id = $2
      RETURNING 
        id, 
        user_id as "userId", 
        exercise_type_id as "exerciseTypeId", 
        performed_at as "performedAt", 
        created_at as "createdAt"
    `;
    return this.database.queryOne(query, [performedAt, id]);
  }

  // ==================== ExerciseLogMetric ====================

  async addMetric(data: {
    exerciseLogId: string;
    key: string;
    value: number;
    unit?: string;
  }): Promise<ExerciseLogMetric | null> {
    const query = `
      INSERT INTO "ExerciseLogMetric" (exercise_log_id, key, value, unit)
      VALUES ($1, $2, $3, $4)
      RETURNING id, exercise_log_id as "exerciseLogId", key, value, unit
    `;

    return this.database.queryOne(query, [
      data.exerciseLogId,
      data.key,
      data.value,
      data.unit || null,
    ]);
  }

  async getMetricsByLog(
    exerciseLogId: string,
  ): Promise<ExerciseLogMetric[]> {
    const query = `
      SELECT id, exercise_log_id as "exerciseLogId", key, value, unit
      FROM "ExerciseLogMetric"
      WHERE exercise_log_id = $1
      ORDER BY key ASC
    `;
    const result = await this.database.query(query, [exerciseLogId]);
    return result.rows;
  }

  // ==================== ANALYTICS QUERIES ====================

  /**
   * Get consecutive days with activity
   */
  async getUserStreakQuery(userId: string): Promise<number> {
    const query = `
      WITH daily_activity AS (
        SELECT DISTINCT DATE(performed_at) as activity_date
        FROM "ExerciseLog"
        WHERE user_id = $1
        ORDER BY activity_date DESC
      ),
      streaks AS (
        SELECT 
          activity_date,
          ROW_NUMBER() OVER (ORDER BY activity_date DESC) as rn,
          DATE(activity_date) - INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY activity_date DESC) as streak_group
        FROM daily_activity
      )
      SELECT 
        COUNT(*) as streak
      FROM streaks
      WHERE streak_group = (
        SELECT MAX(streak_group)
        FROM streaks
        LIMIT 1
      )
    `;

    const result = await this.database.queryOne<{ streak: number }>(query, [
      userId,
    ]);
    return result?.streak || 0;
  }

  /**
   * Get total logs for user
   */
  async getUserTotalLogs(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM "ExerciseLog"
      WHERE user_id = $1
    `;
    const result = await this.database.queryOne<{ total: number }>(query, [
      userId,
    ]);
    return result?.total || 0;
  }
}
