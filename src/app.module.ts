import { Module } from '@nestjs/common';
import { LoggingMiddleware } from './logging.middleware';
import { DomainErrorFilter } from './filters/domain-error.filter';
import { ConfigModule } from './modules/config/config.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { DatabaseService } from './shared/db/database.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule, ExerciseModule],
  controllers: [AppController],
  providers: [AppService, DatabaseService],
})
export class AppModule {}
