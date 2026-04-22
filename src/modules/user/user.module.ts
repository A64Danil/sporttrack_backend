import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/db/database.module';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [DatabaseModule],
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
