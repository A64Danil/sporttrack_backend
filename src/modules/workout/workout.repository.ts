import { Injectable } from '@nestjs/common';
import { DatabaseService, SqlExecutor } from '../../shared/db/database.service';
import { Workout, WorkoutBlock, WorkoutItem } from '../../shared/db/entities';

@Injectable()
export class WorkoutRepository {
  constructor(private readonly database: DatabaseService) {}

  getExecutor(): SqlExecutor {
    return this.database;
  }

  private async queryOne<T>(
    executor: SqlExecutor,
    text: string,
    values?: any[],
  ): Promise<T | null> {
    const result = await executor.query<T>(text, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async transaction<T>(
    callback: (executor: SqlExecutor) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction(callback);
  }

  async createWorkout(
    userId: string,
    name: string,
    executor: SqlExecutor = this.database,
  ): Promise<Workout | null> {
    const query = `
      INSERT INTO "Workout" (user_id, name, started_at)
      VALUES ($1, $2, now())
      RETURNING
        id,
        user_id as "userId",
        name,
        started_at as "startedAt",
        finished_at as "finishedAt",
        created_at as "createdAt"
    `;

    return this.queryOne(executor, query, [userId, name]);
  }

  async getWorkout(
    id: string,
    executor: SqlExecutor = this.database,
  ): Promise<Workout | null> {
    const query = `
      SELECT
        id,
        user_id as "userId",
        name,
        started_at as "startedAt",
        finished_at as "finishedAt",
        created_at as "createdAt"
      FROM "Workout"
      WHERE id = $1
    `;

    return this.queryOne(executor, query, [id]);
  }

  async updateWorkoutFinishedAt(
    id: string,
    finishedAt: Date | null,
    executor: SqlExecutor = this.database,
  ): Promise<Workout | null> {
    const query = `
      UPDATE "Workout"
      SET finished_at = $1
      WHERE id = $2
      RETURNING
        id,
        user_id as "userId",
        name,
        started_at as "startedAt",
        finished_at as "finishedAt",
        created_at as "createdAt"
    `;

    return this.queryOne(executor, query, [finishedAt, id]);
  }

  async createWorkoutBlock(
    workoutId: string,
    name: string | null,
    orderIndex: number,
    executor: SqlExecutor = this.database,
  ): Promise<WorkoutBlock | null> {
    const query = `
      INSERT INTO "WorkoutBlock" (workout_id, name, order_index)
      VALUES ($1, $2, $3)
      RETURNING
        id,
        workout_id as "workoutId",
        name,
        order_index as "orderIndex",
        created_at as "createdAt"
    `;

    return this.queryOne(executor, query, [workoutId, name, orderIndex]);
  }

  async getWorkoutBlock(
    id: string,
    executor: SqlExecutor = this.database,
  ): Promise<WorkoutBlock | null> {
    const query = `
      SELECT
        id,
        workout_id as "workoutId",
        name,
        order_index as "orderIndex",
        created_at as "createdAt"
      FROM "WorkoutBlock"
      WHERE id = $1
    `;

    return this.queryOne(executor, query, [id]);
  }

  async getWorkoutBlocksByWorkout(
    workoutId: string,
    executor: SqlExecutor = this.database,
  ): Promise<WorkoutBlock[]> {
    const query = `
      SELECT
        id,
        workout_id as "workoutId",
        name,
        order_index as "orderIndex",
        created_at as "createdAt"
      FROM "WorkoutBlock"
      WHERE workout_id = $1
      ORDER BY order_index ASC, created_at ASC
    `;

    const result = await executor.query(query, [workoutId]);
    return result.rows;
  }

  async createWorkoutItem(
    workoutId: string,
    exerciseTypeId: string,
    orderIndex: number,
    workoutBlockId: string | null = null,
    executor: SqlExecutor = this.database,
  ): Promise<WorkoutItem | null> {
    const query = `
      INSERT INTO "WorkoutItem" (workout_id, workout_block_id, exercise_type_id, order_index)
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        workout_id as "workoutId",
        workout_block_id as "workoutBlockId",
        exercise_type_id as "exerciseTypeId",
        order_index as "orderIndex",
        exercise_log_id as "exerciseLogId",
        created_at as "createdAt"
    `;

    return this.queryOne(executor, query, [
      workoutId,
      workoutBlockId,
      exerciseTypeId,
      orderIndex,
    ]);
  }

  async getWorkoutItem(
    id: string,
    executor: SqlExecutor = this.database,
  ): Promise<WorkoutItem | null> {
    const query = `
      SELECT
        id,
        workout_id as "workoutId",
        workout_block_id as "workoutBlockId",
        exercise_type_id as "exerciseTypeId",
        order_index as "orderIndex",
        exercise_log_id as "exerciseLogId",
        created_at as "createdAt"
      FROM "WorkoutItem"
      WHERE id = $1
    `;

    return this.queryOne(executor, query, [id]);
  }

  async getWorkoutItemsByWorkout(
    workoutId: string,
    executor: SqlExecutor = this.database,
  ): Promise<WorkoutItem[]> {
    const query = `
      SELECT
        id,
        workout_id as "workoutId",
        workout_block_id as "workoutBlockId",
        exercise_type_id as "exerciseTypeId",
        order_index as "orderIndex",
        exercise_log_id as "exerciseLogId",
        created_at as "createdAt"
      FROM "WorkoutItem"
      WHERE workout_id = $1
      ORDER BY order_index ASC, created_at ASC
    `;

    const result = await executor.query(query, [workoutId]);
    return result.rows;
  }

  async getWorkoutItemsByBlock(
    workoutBlockId: string,
    executor: SqlExecutor = this.database,
  ): Promise<WorkoutItem[]> {
    const query = `
      SELECT
        id,
        workout_id as "workoutId",
        workout_block_id as "workoutBlockId",
        exercise_type_id as "exerciseTypeId",
        order_index as "orderIndex",
        exercise_log_id as "exerciseLogId",
        created_at as "createdAt"
      FROM "WorkoutItem"
      WHERE workout_block_id = $1
      ORDER BY order_index ASC, created_at ASC
    `;

    const result = await executor.query(query, [workoutBlockId]);
    return result.rows;
  }

  async updateWorkoutItemExerciseLog(
    id: string,
    exerciseLogId: string,
    executor: SqlExecutor = this.database,
  ): Promise<WorkoutItem | null> {
    const query = `
      UPDATE "WorkoutItem"
      SET exercise_log_id = $1
      WHERE id = $2
      RETURNING
        id,
        workout_id as "workoutId",
        workout_block_id as "workoutBlockId",
        exercise_type_id as "exerciseTypeId",
        order_index as "orderIndex",
        exercise_log_id as "exerciseLogId",
        created_at as "createdAt"
    `;

    return this.queryOne(executor, query, [exerciseLogId, id]);
  }
}
