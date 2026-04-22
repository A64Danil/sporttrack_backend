import {
  BadRequestException,
  Inject,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ANALYTICS_SYNC_PORT } from '../../shared/analytics/analytics-sync.port';
import type { AnalyticsSyncPort } from '../../shared/analytics/analytics-sync.port';
import { ExerciseRepository } from './exercise.repository';
import {
  CreateExerciseLogDto,
  UpdateExerciseLogDto,
  CreateExerciseTypeDto,
  UpdateExerciseTypeDto,
} from './dto/exercise.dto';
import {
  ExerciseLog,
  ExerciseLogMetric,
  ExerciseType,
} from '../../shared/db/entities';

type ExerciseLogDetails = {
  id: string;
  userId: string;
  exerciseTypeId: string;
  performedAt: Date;
  metrics: Record<string, number>;
};

@Injectable()
export class ExerciseService {
  constructor(
    private repository: ExerciseRepository,
    @Inject(ANALYTICS_SYNC_PORT)
    private readonly analyticsService: AnalyticsSyncPort,
  ) {}

  // ==================== ExerciseLog Operations ====================

  async createExerciseLog(
    userId: string,
    dto: CreateExerciseLogDto,
  ): Promise<ExerciseLogDetails> {
    return this.repository.transaction(async (executor) => {
      const exerciseType = await this.repository.getExerciseType(
        dto.exerciseTypeId,
        executor,
      );

      if (!exerciseType) {
        throw new BadRequestException('Exercise type not found');
      }

      this.validateMetrics(dto.metrics, exerciseType);

      const performedAt = dto.performedAt
        ? new Date(dto.performedAt)
        : new Date();

      const log = await this.repository.createExerciseLog(
        {
          userId,
          exerciseTypeId: dto.exerciseTypeId,
          performedAt,
        },
        executor,
      );

      if (!log) {
        throw new BadRequestException('Failed to create exercise log');
      }

      await this.repository.replaceMetricsForLog(log.id, dto.metrics, executor);
      await this.analyticsService.syncStreakCache(userId, executor);

      return this.buildLogDetails(log, dto.metrics);
    });
  }

  async getExerciseLog(
    userId: string,
    logId: string,
  ): Promise<ExerciseLogDetails | null> {
    const log = await this.repository.getExerciseLog(logId);

    if (!log || log.userId !== userId) {
      return null;
    }

    return this.loadLogDetails(log);
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
  ): Promise<ExerciseLogDetails[]> {
    const limit = Math.min(query.limit || 100, 1000);
    const offset = query.offset || 0;

    let logs: ExerciseLog[];

    if (query.from && query.to && query.exerciseTypeId) {
      logs = await this.repository.getExerciseLogsByUserTypeAndDateRange(
        userId,
        query.exerciseTypeId,
        new Date(query.from),
        new Date(query.to),
      );
    } else if (query.from && query.to) {
      logs = await this.repository.getExerciseLogsByUserAndDateRange(
        userId,
        new Date(query.from),
        new Date(query.to),
      );
    } else if (query.exerciseTypeId) {
      logs = await this.repository.getExerciseLogsByUserAndType(
        userId,
        query.exerciseTypeId,
        limit,
        offset,
      );
    } else {
      logs = await this.repository.getExerciseLogsByUser(userId, limit, offset);
    }

    return Promise.all(logs.map((log) => this.loadLogDetails(log)));
  }

  async updateExerciseLog(
    userId: string,
    logId: string,
    dto: UpdateExerciseLogDto,
  ): Promise<ExerciseLog | null> {
    return this.repository.transaction(async (executor) => {
      const log = await this.repository.getExerciseLog(logId, executor);

      if (!log || log.userId !== userId) {
        return null;
      }

      const performedAt = dto.performedAt
        ? new Date(dto.performedAt)
        : log.performedAt;

      const updated = await this.repository.updateExerciseLog(
        logId,
        performedAt,
        executor,
      );

      if (!updated) {
        throw new BadRequestException('Failed to update exercise log');
      }

      await this.analyticsService.markStreakDirty(userId, executor);

      return updated;
    });
  }

  // ==================== ExerciseType Operations ====================

  async createExerciseType(
    userId: string,
    dto: CreateExerciseTypeDto,
  ): Promise<ExerciseType | null> {
    const validMetrics = ['reps', 'time', 'distance', 'weight'];
    if (!validMetrics.includes(dto.primaryMetric)) {
      throw new BadRequestException(
        `Invalid primaryMetric. Must be one of: ${validMetrics.join(', ')}`,
      );
    }

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

    if (dto.categoryId) {
      const category = await this.repository.getCategory(dto.categoryId);
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    const existing = await this.repository.getExerciseTypeByName(dto.name);
    if (existing) {
      throw new BadRequestException('Exercise type with this name already exists');
    }

    const result = await this.repository.createExerciseType({
      ...dto,
      createdByUserId: userId,
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

  async getUserExerciseTypes(userId: string): Promise<ExerciseType[]> {
    return this.repository.getUserExerciseTypes(userId);
  }

  async getSystemExerciseTypes(): Promise<ExerciseType[]> {
    return this.repository.getSystemExerciseTypes();
  }

  async getExerciseTypesByCategory(categoryId: string): Promise<ExerciseType[]> {
    return this.repository.getExerciseTypesByCategory(categoryId);
  }

  async updateExerciseType(
    userId: string,
    id: string,
    dto: UpdateExerciseTypeDto,
  ): Promise<ExerciseType | null> {
    const exerciseType = await this.repository.getExerciseType(id);
    if (!exerciseType) {
      return null;
    }

    if (exerciseType.isSystem) {
      throw new ForbiddenException('System exercise types cannot be updated');
    }

    this.assertExerciseTypeOwnership(exerciseType, userId);

    return this.repository.updateExerciseType(id, dto);
  }

  async deleteExerciseType(userId: string, id: string): Promise<boolean> {
    const exerciseType = await this.repository.getExerciseType(id);
    if (!exerciseType) {
      return false;
    }

    if (exerciseType.isSystem) {
      throw new ForbiddenException('System exercise types cannot be deleted');
    }

    this.assertExerciseTypeOwnership(exerciseType, userId);

    const linkedLogs = await this.repository.countExerciseLogsByType(id);
    if (linkedLogs > 0) {
      throw new BadRequestException(
        'Exercise type cannot be deleted because it is used by existing logs',
      );
    }

    return this.repository.deleteExerciseType(id);
  }

  // ==================== Validation Helpers ====================

  private validateMetrics(
    metrics: Record<string, number>,
    exerciseType: ExerciseType,
  ): void {
    if (!(exerciseType.primaryMetric in metrics)) {
      throw new BadRequestException(
        `Primary metric "${exerciseType.primaryMetric}" is required`,
      );
    }
  }

  private assertExerciseTypeOwnership(
    exerciseType: ExerciseType,
    userId: string,
  ): void {
    if (!exerciseType.isSystem && exerciseType.createdByUserId !== userId) {
      throw new ForbiddenException('You can only modify your own exercise types');
    }
  }

  private mapMetricsToObject(
    metrics: ExerciseLogMetric[],
  ): Record<string, number> {
    const result: Record<string, number> = {};

    for (const metric of metrics) {
      result[metric.key] = metric.value;
    }

    return result;
  }

  private buildLogDetails(
    log: ExerciseLog,
    metrics: Record<string, number>,
  ): ExerciseLogDetails {
    return {
      id: log.id,
      userId: log.userId,
      exerciseTypeId: log.exerciseTypeId,
      performedAt: log.performedAt,
      metrics,
    };
  }

  private async loadLogDetails(log: ExerciseLog): Promise<ExerciseLogDetails> {
    const metrics = await this.repository.getMetricsByLog(log.id);

    return this.buildLogDetails(log, this.mapMetricsToObject(metrics));
  }
}
