import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/db/database.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { WorkoutController } from './workout.controller';
import { WorkoutRepository } from './workout.repository';
import { WorkoutService } from './workout.service';
import { WorkoutValidationPipe } from './workout-validation.pipe';

@Module({
  imports: [DatabaseModule, ExerciseModule],
  controllers: [WorkoutController],
  providers: [WorkoutService, WorkoutRepository, WorkoutValidationPipe],
  exports: [WorkoutService, WorkoutRepository],
})
export class WorkoutModule {}
