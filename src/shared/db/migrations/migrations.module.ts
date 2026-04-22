import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../../../modules/config/config.module';
import { DatabaseModule } from '../database.module';
import { MigrationService } from './migration.service';

@Global()
@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [MigrationService],
})
export class MigrationsModule {}
