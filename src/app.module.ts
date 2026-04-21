import { Module } from '@nestjs/common';
import { LoggingMiddleware } from './logging.middleware';
import { DomainErrorFilter } from './filters/domain-error.filter';
import { ConfigModule } from './modules/config/config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
