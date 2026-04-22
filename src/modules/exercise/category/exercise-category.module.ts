import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../shared/db/database.module';
import { ExerciseRepository } from '../exercise.repository';
import { ExerciseCategoryController } from './exercise-category.controller';
import { ExerciseCategoryService } from './exercise-category.service';
import { ExerciseValidationPipe } from '../../../shared/validation/exercise-validation.pipe';

@Module({
  imports: [DatabaseModule],
  controllers: [ExerciseCategoryController],
  providers: [ExerciseCategoryService, ExerciseRepository, ExerciseValidationPipe],
})
export class ExerciseCategoryModule {}
