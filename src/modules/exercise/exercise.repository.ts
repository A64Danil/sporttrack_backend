import { Injectable } from '@nestjs/common';
import {
  DatabaseService,
  SqlExecutor,
} from '../../shared/db/database.service';
import {
  ExerciseCategory,
  ExerciseType,
  ExerciseLog,
  ExerciseLogMetric,
} from '../../shared/db/entities';

@Injectable()
export class ExerciseRepository {
  constructor(private database: DatabaseService) {}

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

  // ==================== ExerciseCategory ====================

  async createCategory(
    name: string,
    parentId?: string,
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseCategory | null> {
    const query = `
      INSERT INTO "ExerciseCategory" (name, parent_id)
      VALUES ($1, $2)
      RETURNING id, name, parent_id as "parentId", created_at as "createdAt"
    `;
    return this.queryOne(executor, query, [name, parentId || null]);
  }

  async getCategory(
    id: string,
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseCategory | null> {
    const query = `
      SELECT id, name, parent_id as "parentId", created_at as "createdAt"
      FROM "ExerciseCategory"
      WHERE id = $1
    `;
    return this.queryOne(executor, query, [id]);
  }

  async getAllCategories(
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseCategory[]> {
    const query = `
      SELECT id, name, parent_id as "parentId", created_at as "createdAt"
      FROM "ExerciseCategory"
      ORDER BY created_at ASC
    `;
    const result = await executor.query(query);
    return result.rows;
  }

  async updateCategory(
    id: string,
    data: Partial<{
      name: string;
      parentId: string | null;
    }> = {},
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseCategory | null> {
    const updates: string[] = [];
    const values: any[] = [id];
    let paramCount = 2;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(data.name);
      paramCount++;
    }

    if (data.parentId !== undefined) {
      updates.push(`parent_id = $${paramCount}`);
      values.push(data.parentId);
      paramCount++;
    }

    if (updates.length === 0) {
      return this.getCategory(id, executor);
    }

    const query = `
      UPDATE "ExerciseCategory"
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, name, parent_id as "parentId", created_at as "createdAt"
    `;

    return this.queryOne(executor, query, values);
  }

  async deleteCategory(
    id: string,
    executor: SqlExecutor = this.database,
  ): Promise<boolean> {
    const result = await executor.query(
      `DELETE FROM "ExerciseCategory" WHERE id = $1`,
      [id],
    );
    return result.rowCount > 0;
  }

  // ==================== ExerciseType ====================

  async createExerciseType(
    data: {
      categoryId?: string;
      name: string;
      primaryMetric: string;
      equipmentType: string;
      description?: string;
      mainMediaUrl?: string;
      createdByUserId?: string;
      isSystem?: boolean;
    },
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseType | null> {
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

    return this.queryOne(executor, query, [
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

  async getExerciseType(
    id: string,
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseType | null> {
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
    return this.queryOne(executor, query, [id]);
  }

  async getExerciseTypeByName(
    name: string,
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseType | null> {
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
      WHERE name = $1
    `;
    return this.queryOne(executor, query, [name]);
  }

  async getExerciseTypesByCategory(
    categoryId: string,
    executor: SqlExecutor = this.database,
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
    const result = await executor.query(query, [categoryId]);
    return result.rows;
  }

  async getAllExerciseTypes(
    executor: SqlExecutor = this.database,
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
      ORDER BY created_at ASC
    `;
    const result = await executor.query(query);
    return result.rows;
  }

  async getUserExerciseTypes(
    userId: string,
    executor: SqlExecutor = this.database,
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
      WHERE is_system = false AND created_by_user_id = $1
      ORDER BY created_at ASC
    `;
    const result = await executor.query(query, [userId]);
    return result.rows;
  }

  async getSystemExerciseTypes(
    executor: SqlExecutor = this.database,
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
      WHERE is_system = true
      ORDER BY created_at ASC
    `;
    const result = await executor.query(query);
    return result.rows;
  }

  async updateExerciseType(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      mainMediaUrl: string;
    }> = {},
    executor: SqlExecutor = this.database,
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
      return this.getExerciseType(id, executor);
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

    return this.queryOne(executor, query, values);
  }

  async deleteExerciseType(
    id: string,
    executor: SqlExecutor = this.database,
  ): Promise<boolean> {
    const result = await executor.query(
      `DELETE FROM "ExerciseType" WHERE id = $1`,
      [id],
    );
    return result.rowCount > 0;
  }

  async countExerciseLogsByType(
    exerciseTypeId: string,
    executor: SqlExecutor = this.database,
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM "ExerciseLog"
      WHERE exercise_type_id = $1
    `;
    const result = await this.queryOne<{ total: number }>(executor, query, [
      exerciseTypeId,
    ]);
    return result?.total || 0;
  }

  // ==================== ExerciseLog ====================

  async createExerciseLog(
    data: {
      userId: string;
      exerciseTypeId: string;
      performedAt: Date;
    },
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseLog | null> {
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

    return this.queryOne(executor, query, [
      data.userId,
      data.exerciseTypeId,
      data.performedAt,
    ]);
  }

  async getExerciseLog(
    id: string,
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseLog | null> {
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
    return this.queryOne(executor, query, [id]);
  }

  async getExerciseLogsByUser(
    userId: string,
    limit: number = 100,
    offset: number = 0,
    executor: SqlExecutor = this.database,
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
    const result = await executor.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async getExerciseLogsByUserAndType(
    userId: string,
    exerciseTypeId: string,
    limit: number = 100,
    offset: number = 0,
    executor: SqlExecutor = this.database,
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
      LIMIT $3 OFFSET $4
    `;
    const result = await executor.query(query, [userId, exerciseTypeId, limit, offset]);
    return result.rows;
  }

  async getExerciseLogsByUserAndDateRange(
    userId: string,
    fromDate: Date,
    toDate: Date,
    executor: SqlExecutor = this.database,
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
    const result = await executor.query(query, [userId, fromDate, toDate]);
    return result.rows;
  }

  async getExerciseLogsByUserTypeAndDateRange(
    userId: string,
    exerciseTypeId: string,
    fromDate: Date,
    toDate: Date,
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseLog[]> {
    const query = `
      SELECT 
        id, 
        user_id as "userId", 
        exercise_type_id as "exerciseTypeId", 
        performed_at as "performedAt", 
        created_at as "createdAt"
      FROM "ExerciseLog"
      WHERE user_id = $1 AND exercise_type_id = $2 AND performed_at BETWEEN $3 AND $4
      ORDER BY performed_at DESC
    `;
    const result = await executor.query(query, [
      userId,
      exerciseTypeId,
      fromDate,
      toDate,
    ]);
    return result.rows;
  }

  async getExerciseLogsByType(
    exerciseTypeId: string,
    userId: string,
    limit: number = 3,
    executor: SqlExecutor = this.database,
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
    const result = await executor.query(query, [userId, exerciseTypeId, limit]);
    return result.rows;
  }

  async updateExerciseLog(
    id: string,
    performedAt: Date,
    executor: SqlExecutor = this.database,
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
    return this.queryOne(executor, query, [performedAt, id]);
  }

  // ==================== ExerciseLogMetric ====================

  async addMetric(
    data: {
      exerciseLogId: string;
      key: string;
      value: number;
      unit?: string;
    },
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseLogMetric | null> {
    const query = `
      INSERT INTO "ExerciseLogMetric" (exercise_log_id, key, value, unit)
      VALUES ($1, $2, $3, $4)
      RETURNING id, exercise_log_id as "exerciseLogId", key, value, unit
    `;

    return this.queryOne(executor, query, [
      data.exerciseLogId,
      data.key,
      data.value,
      data.unit || null,
    ]);
  }

  async getMetricsByLog(
    exerciseLogId: string,
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseLogMetric[]> {
    const query = `
      SELECT id, exercise_log_id as "exerciseLogId", key, value, unit
      FROM "ExerciseLogMetric"
      WHERE exercise_log_id = $1
      ORDER BY key ASC
    `;
    const result = await executor.query(query, [exerciseLogId]);
    return result.rows;
  }

  async deleteMetricsByLog(
    exerciseLogId: string,
    executor: SqlExecutor = this.database,
  ): Promise<number> {
    const result = await executor.query(
      `DELETE FROM "ExerciseLogMetric" WHERE exercise_log_id = $1`,
      [exerciseLogId],
    );
    return result.rowCount;
  }

  async replaceMetricsForLog(
    exerciseLogId: string,
    metrics: Record<string, number>,
    executor: SqlExecutor = this.database,
  ): Promise<ExerciseLogMetric[]> {
    await this.deleteMetricsByLog(exerciseLogId, executor);

    const created: ExerciseLogMetric[] = [];

    for (const [key, value] of Object.entries(metrics)) {
      const metric = await this.addMetric(
        {
          exerciseLogId,
          key,
          value,
        },
        executor,
      );

      if (metric) {
        created.push(metric);
      }
    }

    return created;
  }

}
