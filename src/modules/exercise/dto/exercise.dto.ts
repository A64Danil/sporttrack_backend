// Create Exercise Log DTO
export class CreateExerciseLogDto {
  exerciseTypeId: string;
  metrics: Record<string, number>;
  performedAt?: string; // ISO string
}

// Update Exercise Log DTO
export class UpdateExerciseLogDto {
  performedAt?: string; // ISO string
}

// Create Exercise Type DTO
export class CreateExerciseTypeDto {
  categoryId?: string;
  name: string;
  primaryMetric: string;
  equipmentType: string;
  description?: string;
  mainMediaUrl?: string;
}

// Update Exercise Type DTO
export class UpdateExerciseTypeDto {
  name?: string;
  description?: string;
  mainMediaUrl?: string;
}

// Query DTOs
export class GetExerciseLogsQueryDto {
  from?: string; // ISO date
  to?: string; // ISO date
  exerciseTypeId?: string;
  limit?: number;
  offset?: number;
}
