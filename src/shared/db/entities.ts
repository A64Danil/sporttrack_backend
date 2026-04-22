// Exercise Category
export interface ExerciseCategory {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

export interface ExerciseCategoryTreeNode extends ExerciseCategory {
  children?: ExerciseCategoryTreeNode[];
}

// Exercise Type
export interface ExerciseType {
  id: string;
  categoryId: string | null;
  name: string;
  primaryMetric: string; // 'reps' | 'time' | 'distance' | 'weight'
  equipmentType: string; // 'bodyweight' | 'barbell' | 'dumbbell' | 'machine' | 'mixed'
  description: string | null;
  mainMediaUrl: string | null;
  createdByUserId: string | null;
  isSystem: boolean;
  createdAt: Date;
}

// Exercise Log
export interface ExerciseLog {
  id: string;
  userId: string;
  exerciseTypeId: string;
  performedAt: Date;
  createdAt: Date;
}

// Exercise Log Metric
export interface ExerciseLogMetric {
  id: string;
  exerciseLogId: string;
  key: string;
  value: number;
  unit: string | null;
}

// User streak cache
export interface UserStreakCache {
  userId: string;
  currentStreak: number;
  lastActivityDate: Date | null;
  isDirty: boolean;
  lastCalculatedAt: Date;
}

// Workout Template
export interface WorkoutTemplate {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  createdAt: Date;
}

// Workout Template Item
export interface WorkoutTemplateItem {
  id: string;
  workoutTemplateId: string;
  exerciseTypeId: string;
  orderIndex: number;
  targetValue: number | null;
  createdAt: Date;
}

// Workout
export interface Workout {
  id: string;
  userId: string;
  name: string;
  startedAt: Date;
  finishedAt: Date | null;
  createdAt: Date;
}

// Workout Block
export interface WorkoutBlock {
  id: string;
  workoutId: string;
  name: string | null;
  orderIndex: number;
  createdAt: Date;
}

// Workout Item
export interface WorkoutItem {
  id: string;
  workoutId: string;
  workoutBlockId: string | null;
  exerciseTypeId: string;
  orderIndex: number;
  exerciseLogId: string | null;
  createdAt: Date;
}

// User for context
export interface User {
  id: string;
  createdAt: Date;
}

// User Profile
export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  createdAt: Date;
}
