import { Module } from '@nestjs/common';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';
import { ExerciseRepository } from './exercise.repository';
import { DatabaseService } from '../../shared/db/database.service';

@Module({
  controllers: [ExerciseController],
  providers: [ExerciseService, ExerciseRepository, DatabaseService],
  exports: [ExerciseService, ExerciseRepository],
})
export class ExerciseModule {}
