import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '../../../modules/config/config.service';
import { DatabaseService } from '../database.service';
import { MigrationRunner } from './migration-runner';

@Injectable()
export class MigrationService implements OnApplicationBootstrap {
  private readonly runner = new MigrationRunner();

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  async onApplicationBootstrap() {
    if (this.configService.app.nodeEnv === 'test') {
      return;
    }

    await this.runner.run(this.databaseService.getPool());
  }
}
