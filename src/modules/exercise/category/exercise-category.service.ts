import { BadRequestException, Injectable } from '@nestjs/common';
import { ExerciseRepository } from '../exercise.repository';
import {
  CreateExerciseCategoryDto,
  UpdateExerciseCategoryDto,
} from '../dto/exercise.dto';
import { ExerciseCategory } from '../../../shared/db/entities';

@Injectable()
export class ExerciseCategoryService {
  constructor(private readonly repository: ExerciseRepository) {}

  async createCategory(
    dto: CreateExerciseCategoryDto,
  ): Promise<ExerciseCategory | null> {
    if (dto.parentId) {
      const parent = await this.repository.getCategory(dto.parentId);
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    return this.repository.createCategory(dto.name, dto.parentId);
  }

  async getCategory(id: string): Promise<ExerciseCategory | null> {
    return this.repository.getCategory(id);
  }

  async getCategories(): Promise<ExerciseCategory[]> {
    return this.repository.getAllCategories();
  }

  async updateCategory(
    id: string,
    dto: UpdateExerciseCategoryDto,
  ): Promise<ExerciseCategory | null> {
    const category = await this.repository.getCategory(id);
    if (!category) {
      return null;
    }

    if (dto.parentId === id) {
      throw new BadRequestException('Category cannot reference itself as parent');
    }

    if (dto.parentId) {
      const parent = await this.repository.getCategory(dto.parentId);
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    return this.repository.updateCategory(id, {
      name: dto.name,
      parentId: dto.parentId,
    });
  }

  async deleteCategory(id: string): Promise<boolean> {
    const category = await this.repository.getCategory(id);
    if (!category) {
      return false;
    }

    return this.repository.deleteCategory(id);
  }
}
