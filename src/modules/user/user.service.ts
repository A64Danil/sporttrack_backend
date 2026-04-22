import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(data: { displayName: string; age?: number; weight?: number; height?: number }) {
    const user = await this.userRepository.create({});
    const profile = await this.userRepository.createProfile({
      userId: user[0].id,
      ...data,
    });
    return { user: user[0], profile: profile[0] };
  }

  async findUser(id: string) {
    return this.userRepository.findById(id);
  }
}
