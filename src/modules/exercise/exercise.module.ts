import { Module } from '@nestjs/common';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';
import { ExerciseRepository } from './exercise.repository';
import { DatabaseModule } from '../../shared/db/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ExerciseController],
  providers: [ExerciseService, ExerciseRepository],
  exports: [ExerciseService, ExerciseRepository],
})
export class ExerciseModule {}
