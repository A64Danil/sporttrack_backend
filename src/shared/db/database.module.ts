import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../../modules/config/config.module';
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
