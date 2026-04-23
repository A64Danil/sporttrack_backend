import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/db/database.module';
import { AuthModule } from '../auth/auth.module';
import { ANALYTICS_SYNC_PORT } from '../../shared/analytics/analytics-sync.port';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './analytics.service';

@Global()
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsRepository,
    {
      provide: ANALYTICS_SYNC_PORT,
      useExisting: AnalyticsService,
    },
  ],
  exports: [AnalyticsService, AnalyticsRepository, ANALYTICS_SYNC_PORT],
})
export class AnalyticsModule {}
