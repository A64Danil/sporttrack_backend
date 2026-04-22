import {
  BadRequestException,
  Inject,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ExerciseRepository } from '../exercise/exercise.repository';
import { ANALYTICS_SYNC_PORT } from '../../shared/analytics/analytics-sync.port';
import type { AnalyticsSyncPort } from '../../shared/analytics/analytics-sync.port';
import { CreateWorkoutBlockDto, CreateWorkoutDto, CreateWorkoutItemDto, CompleteWorkoutDto } from './workout.dto';
import { WorkoutRepository } from './workout.repository';
import { SqlExecutor } from '../../shared/db/database.service';
import { ExerciseLog, ExerciseType, Workout, WorkoutBlock, WorkoutItem } from '../../shared/db/entities';

type WorkoutItemDetails = WorkoutItem & {
  exerciseLog?: ExerciseLog | null;
};

type WorkoutDetails = Workout & {
  blocks: Array<WorkoutBlock & { items: WorkoutItemDetails[] }>;
  items: WorkoutItemDetails[];
};

@Injectable()
export class WorkoutService {
  constructor(
    private readonly repository: WorkoutRepository,
    private readonly exerciseRepository: ExerciseRepository,
    @Inject(ANALYTICS_SYNC_PORT)
    private readonly analyticsService: AnalyticsSyncPort,
  ) {}

  async createWorkout(userId: string, dto: CreateWorkoutDto): Promise<Workout> {
    const name = this.normalizeName(dto.name);

    const workout = await this.repository.createWorkout(userId, name);

    if (!workout) {
      throw new BadRequestException('Failed to create workout');
    }

    return workout;
  }

  async getWorkout(userId: string, id: string): Promise<WorkoutDetails | null> {
    const workout = await this.repository.getWorkout(id);

    if (!workout || workout.userId !== userId) {
      return null;
    }

    return this.loadWorkoutDetails(workout);
  }

  async addWorkoutBlock(
    userId: string,
    workoutId: string,
    dto: CreateWorkoutBlockDto,
  ): Promise<WorkoutBlock | null> {
    return this.repository.transaction(async (executor) => {
      const workout = await this.repository.getWorkout(workoutId, executor);
      if (!workout || workout.userId !== userId) {
        return null;
      }

      this.assertWorkoutIsEditable(workout);

      const block = await this.repository.createWorkoutBlock(
        workoutId,
        dto.name ?? null,
        dto.orderIndex,
        executor,
      );

      if (!block) {
        throw new BadRequestException('Failed to create workout block');
      }

      return block;
    });
  }

  async addWorkoutItem(
    userId: string,
    workoutId: string,
    dto: CreateWorkoutItemDto,
  ): Promise<WorkoutItem | null> {
    return this.repository.transaction(async (executor) => {
      const workout = await this.repository.getWorkout(workoutId, executor);
      if (!workout || workout.userId !== userId) {
        return null;
      }

      this.assertWorkoutIsEditable(workout);

      const exerciseType = await this.exerciseRepository.getExerciseType(
        dto.exerciseTypeId,
        executor,
      );
      if (!exerciseType) {
        throw new BadRequestException('Exercise type not found');
      }

      if (dto.workoutBlockId) {
        const block = await this.repository.getWorkoutBlock(dto.workoutBlockId, executor);
        if (!block || block.workoutId !== workoutId) {
          throw new BadRequestException('Workout block not found');
        }
      }

      const item = await this.repository.createWorkoutItem(
        workoutId,
        dto.exerciseTypeId,
        dto.orderIndex,
        dto.workoutBlockId ?? null,
        executor,
      );

      if (!item) {
        throw new BadRequestException('Failed to create workout item');
      }

      return item;
    });
  }

  async completeWorkout(
    userId: string,
    workoutId: string,
    dto: CompleteWorkoutDto,
  ): Promise<WorkoutDetails | null> {
    return this.repository.transaction(async (executor) => {
      const workout = await this.repository.getWorkout(workoutId, executor);
      if (!workout || workout.userId !== userId) {
        return null;
      }

      this.assertWorkoutIsEditable(workout);

      const items = await this.repository.getWorkoutItemsByWorkout(workoutId, executor);
      if (items.length === 0) {
        throw new BadRequestException('Workout must have items before completion');
      }

      const entryMap = new Map(dto.entries.map((entry) => [entry.workoutItemId, entry]));
      if (entryMap.size !== items.length) {
        throw new BadRequestException('Completion entries must match all workout items');
      }

      for (const item of items) {
        const entry = entryMap.get(item.id);
        if (!entry) {
          throw new BadRequestException(`Missing completion entry for workout item ${item.id}`);
        }

        if (item.exerciseLogId) {
          throw new BadRequestException('Workout items cannot be completed twice');
        }

        const exerciseType = await this.exerciseRepository.getExerciseType(
          item.exerciseTypeId,
          executor,
        );
        if (!exerciseType) {
          throw new BadRequestException('Exercise type not found');
        }

        this.validateMetrics(entry.metrics, exerciseType);

        const exerciseLog = await this.exerciseRepository.createExerciseLog(
          {
            userId,
            exerciseTypeId: item.exerciseTypeId,
            performedAt: entry.performedAt ? new Date(entry.performedAt) : new Date(),
          },
          executor,
        );

        if (!exerciseLog) {
          throw new BadRequestException('Failed to create exercise log');
        }

        await this.exerciseRepository.replaceMetricsForLog(
          exerciseLog.id,
          entry.metrics,
          executor,
        );

        const linked = await this.repository.updateWorkoutItemExerciseLog(
          item.id,
          exerciseLog.id,
          executor,
        );
        if (!linked) {
          throw new BadRequestException('Failed to link workout item to exercise log');
        }
      }

      await this.analyticsService.syncStreakCache(userId, executor);

      const completed = await this.repository.updateWorkoutFinishedAt(
        workoutId,
        new Date(),
        executor,
      );
      if (!completed) {
        throw new BadRequestException('Failed to complete workout');
      }

      return this.loadWorkoutDetails(completed, executor);
    });
  }

  private normalizeName(name?: string): string {
    if (name === undefined || name === null) {
      return 'Workout';
    }

    const normalized = String(name).trim();
    if (!normalized) {
      throw new BadRequestException('name cannot be empty');
    }

    return normalized;
  }

  private assertWorkoutIsEditable(workout: Workout): void {
    if (workout.finishedAt) {
      throw new ForbiddenException('Workout cannot be modified after completion');
    }
  }

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

  private async loadWorkoutDetails(
    workout: Workout,
    executor: SqlExecutor = this.repository.getExecutor(),
  ): Promise<WorkoutDetails> {
    const blocks = await this.repository.getWorkoutBlocksByWorkout(
      workout.id,
      executor,
    );
    const items = await this.repository.getWorkoutItemsByWorkout(
      workout.id,
      executor,
    );

    const itemDetails = await Promise.all(
      items.map(async (item) => ({
        ...item,
        exerciseLog: item.exerciseLogId
          ? await this.exerciseRepository.getExerciseLog(item.exerciseLogId, executor)
          : null,
      })),
    );

    const itemsByBlock = new Map<string, WorkoutItemDetails[]>();
    const rootItems: WorkoutItemDetails[] = [];

    for (const item of itemDetails) {
      if (item.workoutBlockId) {
        const list = itemsByBlock.get(item.workoutBlockId) || [];
        list.push(item);
        itemsByBlock.set(item.workoutBlockId, list);
      } else {
        rootItems.push(item);
      }
    }

    return {
      ...workout,
      blocks: blocks.map((block) => ({
        ...block,
        items: itemsByBlock.get(block.id) || [],
      })),
      items: rootItems,
    };
  }
}
