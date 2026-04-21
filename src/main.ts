import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingMiddleware } from './logging.middleware';
import { DomainErrorFilter } from './filters/domain-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(new LoggingMiddleware().use);
  app.useGlobalFilters(new DomainErrorFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
