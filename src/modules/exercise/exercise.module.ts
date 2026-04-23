import { Module } from '@nestjs/common';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';
import { ExerciseRepository } from './exercise.repository';
import { DatabaseModule } from '../../shared/db/database.module';
import { AuthModule } from '../auth/auth.module';
import { ExerciseValidationPipe } from '../../shared/validation/exercise-validation.pipe';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ExerciseController],
  providers: [ExerciseService, ExerciseRepository, ExerciseValidationPipe],
  exports: [ExerciseService, ExerciseRepository],
})
export class ExerciseModule {}
