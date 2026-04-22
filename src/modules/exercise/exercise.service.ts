import { Injectable, BadRequestException } from '@nestjs/common';
import { ExerciseRepository } from './exercise.repository';
import {
  CreateExerciseLogDto,
  UpdateExerciseLogDto,
  CreateExerciseTypeDto,
  UpdateExerciseTypeDto,
} from './dto/exercise.dto';
import { ExerciseLog, ExerciseType } from '../../shared/db/entities';

@Injectable()
export class ExerciseService {
  constructor(private repository: ExerciseRepository) {}

  // ==================== ExerciseLog Operations ====================

  async createExerciseLog(
    userId: string,
    dto: CreateExerciseLogDto,
  ): Promise<{
    id: string;
    userId: string;
    exerciseTypeId: string;
    performedAt: Date;
    metrics: Record<string, number>;
  }> {
    // Validate DTO
    if (!dto.exerciseTypeId) {
      throw new BadRequestException('exerciseTypeId is required');
    }

    if (!dto.metrics || Object.keys(dto.metrics).length === 0) {
      throw new BadRequestException('metrics cannot be empty');
    }

    // Verify exercise type exists
    const exerciseType = await this.repository.getExerciseType(
      dto.exerciseTypeId,
    );
    if (!exerciseType) {
      throw new BadRequestException('Exercise type not found');
    }

    // Validate metrics based on primary metric
    this.validateMetrics(dto.metrics, exerciseType);

    // Create log
    const performedAt = dto.performedAt
      ? new Date(dto.performedAt)
      : new Date();

    const log = await this.repository.createExerciseLog({
      userId,
      exerciseTypeId: dto.exerciseTypeId,
      performedAt,
    });

    if (!log) {
      throw new BadRequestException('Failed to create exercise log');
    }

    // Add metrics
    for (const [key, value] of Object.entries(dto.metrics)) {
      await this.repository.addMetric({
        exerciseLogId: log.id,
        key,
        value: parseFloat(String(value)),
      });
    }

    return {
      id: log.id,
      userId: log.userId,
      exerciseTypeId: log.exerciseTypeId,
      performedAt: log.performedAt,
      metrics: dto.metrics,
    };
  }

  async getExerciseLog(
    userId: string,
    logId: string,
  ): Promise<{
    id: string;
    userId: string;
    exerciseTypeId: string;
    performedAt: Date;
    metrics: Record<string, number>;
  } | null> {
    const log = await this.repository.getExerciseLog(logId);

    if (!log || log.userId !== userId) {
      return null;
    }

    const metrics = await this.repository.getMetricsByLog(logId);
    const metricsObject: Record<string, number> = {};

    for (const metric of metrics) {
      metricsObject[metric.key] = metric.value;
    }

    return {
      id: log.id,
      userId: log.userId,
      exerciseTypeId: log.exerciseTypeId,
      performedAt: log.performedAt,
      metrics: metricsObject,
    };
  }

  async getExerciseLogs(
    userId: string,
    query: {
      from?: string;
      to?: string;
      exerciseTypeId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<any[]> {
    const limit = Math.min(query.limit || 100, 1000);
    const offset = query.offset || 0;

    let logs: ExerciseLog[];

    if (query.from && query.to) {
      logs = await this.repository.getExerciseLogsByUserAndDateRange(
        userId,
        new Date(query.from),
        new Date(query.to),
      );
    } else {
      logs = await this.repository.getExerciseLogsByUser(userId, limit, offset);
    }

    // Enrich with metrics
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const metrics = await this.repository.getMetricsByLog(log.id);
        const metricsObject: Record<string, number> = {};

        for (const metric of metrics) {
          metricsObject[metric.key] = metric.value;
        }

        return {
          id: log.id,
          userId: log.userId,
          exerciseTypeId: log.exerciseTypeId,
          performedAt: log.performedAt,
          metrics: metricsObject,
        };
      }),
    );

    return enriched;
  }

  async updateExerciseLog(
    userId: string,
    logId: string,
    dto: UpdateExerciseLogDto,
  ): Promise<ExerciseLog | null> {
    const log = await this.repository.getExerciseLog(logId);

    if (!log || log.userId !== userId) {
      return null;
    }

    const performedAt = dto.performedAt
      ? new Date(dto.performedAt)
      : log.performedAt;

    return this.repository.updateExerciseLog(logId, performedAt);
  }

  // ==================== ExerciseType Operations ====================

  async createExerciseType(
    dto: CreateExerciseTypeDto,
  ): Promise<ExerciseType | null> {
    // Validate
    if (!dto.name) {
      throw new BadRequestException('name is required');
    }
    if (!dto.primaryMetric) {
      throw new BadRequestException('primaryMetric is required');
    }
    if (!dto.equipmentType) {
      throw new BadRequestException('equipmentType is required');
    }

    // Validate primary metric
    const validMetrics = ['reps', 'time', 'distance', 'weight'];
    if (!validMetrics.includes(dto.primaryMetric)) {
      throw new BadRequestException(
        `Invalid primaryMetric. Must be one of: ${validMetrics.join(', ')}`,
      );
    }

    // Validate equipment type
    const validEquipment = [
      'bodyweight',
      'barbell',
      'dumbbell',
      'machine',
      'mixed',
    ];
    if (!validEquipment.includes(dto.equipmentType)) {
      throw new BadRequestException(
        `Invalid equipmentType. Must be one of: ${validEquipment.join(', ')}`,
      );
    }

    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.repository.getCategory(dto.categoryId);
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    const result = await this.repository.createExerciseType({
      ...dto,
      isSystem: false,
    });

    if (!result) {
      throw new BadRequestException('Failed to create exercise type');
    }

    return result;
  }

  async getExerciseType(id: string): Promise<ExerciseType | null> {
    return this.repository.getExerciseType(id);
  }

  async getExerciseTypes(): Promise<ExerciseType[]> {
    return this.repository.getAllExerciseTypes();
  }

  async getSystemExerciseTypes(): Promise<ExerciseType[]> {
    return this.repository.getSystemExerciseTypes();
  }

  async getExerciseTypesByCategory(categoryId: string): Promise<ExerciseType[]> {
    return this.repository.getExerciseTypesByCategory(categoryId);
  }

  async updateExerciseType(
    id: string,
    dto: UpdateExerciseTypeDto,
  ): Promise<ExerciseType | null> {
    const exerciseType = await this.repository.getExerciseType(id);
    if (!exerciseType) {
      return null;
    }

    // System types cannot be updated (read-only)
    if (exerciseType.isSystem) {
      throw new BadRequestException('System exercise types cannot be updated');
    }

    return this.repository.updateExerciseType(id, dto);
  }

  // ==================== Validation Helpers ====================

  private validateMetrics(
    metrics: Record<string, number>,
    exerciseType: ExerciseType,
  ): void {
    if (!exerciseType.primaryMetric) {
      throw new BadRequestException('Exercise type has no primary metric');
    }

    // Primary metric must be present
    if (!(exerciseType.primaryMetric in metrics)) {
      throw new BadRequestException(
        `Primary metric "${exerciseType.primaryMetric}" is required`,
      );
    }

    // Validate all metric keys are strings
    for (const key of Object.keys(metrics)) {
      if (typeof key !== 'string') {
        throw new BadRequestException('Metric keys must be strings');
      }

      // Basic validation: no special characters, alphanumeric + underscores
      if (!/^[a-zA-Z0-9_]+$/.test(key)) {
        throw new BadRequestException(
          `Invalid metric key: "${key}". Use only alphanumeric characters and underscores.`,
        );
      }

      // Values must be numbers
      const value = metrics[key];
      if (typeof value !== 'number' || isNaN(value)) {
        throw new BadRequestException(
          `Metric value for "${key}" must be a valid number`,
        );
      }

      // Values must be positive
      if (value < 0) {
        throw new BadRequestException(
          `Metric value for "${key}" must be non-negative`,
        );
      }
    }
  }

  // ==================== Analytics ====================

  async getUserStreak(userId: string): Promise<number> {
    return this.repository.getUserStreakQuery(userId);
  }

  async getUserStats(userId: string): Promise<{
    totalLogs: number;
    streak: number;
  }> {
    const [totalLogs, streak] = await Promise.all([
      this.repository.getUserTotalLogs(userId),
      this.repository.getUserStreakQuery(userId),
    ]);

    return { totalLogs, streak };
  }
}
