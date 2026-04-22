import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { CreateExerciseCategoryDto, UpdateExerciseCategoryDto } from '../dto/exercise.dto';
import { ExerciseCategoryService } from './exercise-category.service';
import { ExerciseValidationPipe } from '../../../shared/validation/exercise-validation.pipe';

@Controller('exercise/categories')
@UsePipes(ExerciseValidationPipe)
export class ExerciseCategoryController {
  constructor(private readonly service: ExerciseCategoryService) {}

  @Post()
  async createCategory(@Body() dto: CreateExerciseCategoryDto) {
    try {
      const category = await this.service.createCategory(dto);
      return {
        success: true,
        data: category,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  async getCategories() {
    const categories = await this.service.getCategories();
    return {
      success: true,
      data: categories,
      count: categories.length,
    };
  }

  @Get(':id')
  async getCategory(@Param('id') id: string) {
    const category = await this.service.getCategory(id);
    if (!category) {
      throw new NotFoundException('Exercise category not found');
    }

    return {
      success: true,
      data: category,
    };
  }

  @Patch(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseCategoryDto,
  ) {
    try {
      const category = await this.service.updateCategory(id, dto);
      if (!category) {
        throw new NotFoundException('Exercise category not found');
      }

      return {
        success: true,
        data: category,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    const deleted = await this.service.deleteCategory(id);
    if (!deleted) {
      throw new NotFoundException('Exercise category not found');
    }

    return {
      success: true,
      deleted: true,
    };
  }
}
