import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../shared/db/database.service';

@Injectable()
export class UserRepository {
  constructor(private db: DatabaseService) {}

  async create(user: { id?: string; createdAt?: Date }) {
    return this.db.query('INSERT INTO "User" DEFAULT VALUES RETURNING *', []);
  }

  async createProfile(data: { userId: string; displayName: string; age?: number; weight?: number; height?: number }) {
    return this.db.query(
      'INSERT INTO "UserProfile" (user_id, display_name, age, weight, height) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [data.userId, data.displayName, data.age, data.weight, data.height],
    );
  }

  async findById(id: string) {
    const result = await this.db.query('SELECT * FROM "User" WHERE id = $1', [id]);
    return result[0];
  }
}
