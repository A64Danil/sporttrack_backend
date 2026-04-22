export class CreateWorkoutDto {
  name?: string;
}

export class CreateWorkoutBlockDto {
  name?: string | null;
  orderIndex: number;
}

export class CreateWorkoutItemDto {
  exerciseTypeId: string;
  orderIndex: number;
  workoutBlockId?: string | null;
}

export class CompleteWorkoutEntryDto {
  workoutItemId: string;
  metrics: Record<string, number>;
  performedAt?: string;
}

export class CompleteWorkoutDto {
  entries: CompleteWorkoutEntryDto[];
}

