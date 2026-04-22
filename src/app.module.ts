import { Module } from '@nestjs/common';
import { ConfigModule } from './modules/config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { DatabaseModule } from './shared/db/database.module';
import { MigrationsModule } from './shared/db/migrations/migrations.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { WorkoutModule } from './modules/workout/workout.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MigrationsModule,
    ExerciseModule,
    WorkoutModule,
    AnalyticsModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
