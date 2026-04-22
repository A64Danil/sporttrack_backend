import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import {
  CreateExerciseLogDto,
  UpdateExerciseLogDto,
  CreateExerciseTypeDto,
  UpdateExerciseTypeDto,
  GetExerciseLogsQueryDto,
} from './dto/exercise.dto';

// Mock: In real app, this would come from JWT guard
const getCurrentUserId = (req: any): string => {
  return req.user?.id || '11111111-1111-1111-1111-111111111111'; // seed user for demo
};

@Controller('exercise')
export class ExerciseController {
  constructor(private service: ExerciseService) {}

  // ==================== ExerciseLog Endpoints ====================

  /**
   * POST /exercise/log
   * Create new exercise log
   */
  @Post('log')
  async createLog(
    @Body() dto: CreateExerciseLogDto,
  ) {
    try {
      console.log('Creating exercise log with DTO:', dto);
      // Mock userId - in real app use JWT guard
      const userId = '11111111-1111-1111-1111-111111111111';
      const result = await this.service.createExerciseLog(userId, dto);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error creating exercise log:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /exercise/logs
   * Get user's exercise logs
   */
  @Get('logs')
  async getLogs(
    @Query() query: GetExerciseLogsQueryDto,
  ) {
    // Mock userId
    const userId = '11111111-1111-1111-1111-111111111111';

    const logs = await this.service.getExerciseLogs(userId, {
      from: query.from,
      to: query.to,
      exerciseTypeId: query.exerciseTypeId,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      success: true,
      data: logs,
      count: logs.length,
    };
  }

  /**
   * GET /exercise/log/:id
   * Get single exercise log
   */
  @Get('log/:id')
  async getLog(@Param('id') id: string) {
    const userId = '11111111-1111-1111-1111-111111111111';
    const log = await this.service.getExerciseLog(userId, id);

    if (!log) {
      throw new NotFoundException('Exercise log not found');
    }

    return {
      success: true,
      data: log,
    };
  }

  /**
   * PATCH /exercise/log/:id
   * Update exercise log
   */
  @Patch('log/:id')
  async updateLog(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseLogDto,
  ) {
    const userId = '11111111-1111-1111-1111-111111111111';
    const updated = await this.service.updateExerciseLog(userId, id, dto);

    if (!updated) {
      throw new NotFoundException('Exercise log not found');
    }

    return {
      success: true,
      data: updated,
    };
  }

  // ==================== ExerciseType Endpoints ====================

  /**
   * POST /exercise/types
   * Create new exercise type (user-defined)
   */
  @Post('types')
  async createExerciseType(@Body() dto: CreateExerciseTypeDto) {
    try {
      const result = await this.service.createExerciseType(dto);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /exercise/types
   * Get all exercise types
   */
  @Get('types')
  async getExerciseTypes() {
    const types = await this.service.getExerciseTypes();
    return {
      success: true,
      data: types,
      count: types.length,
    };
  }

  /**
   * GET /exercise/types/system
   * Get system exercise types
   */
  @Get('types/system')
  async getSystemExerciseTypes() {
    const types = await this.service.getSystemExerciseTypes();
    return {
      success: true,
      data: types,
      count: types.length,
    };
  }

  /**
   * GET /exercise/types/:id
   * Get single exercise type
   */
  @Get('types/:id')
  async getExerciseType(@Param('id') id: string) {
    const type = await this.service.getExerciseType(id);

    if (!type) {
      throw new NotFoundException('Exercise type not found');
    }

    return {
      success: true,
      data: type,
    };
  }

  /**
   * PATCH /exercise/types/:id
   * Update exercise type
   */
  @Patch('types/:id')
  async updateExerciseType(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseTypeDto,
  ) {
    try {
      const updated = await this.service.updateExerciseType(id, dto);

      if (!updated) {
        throw new NotFoundException('Exercise type not found');
      }

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /exercise/categories/:categoryId/types
   * Get exercise types for category
   */
  @Get('categories/:categoryId/types')
  async getExerciseTypesByCategory(
    @Param('categoryId') categoryId: string,
  ) {
    const types = await this.service.getExerciseTypesByCategory(categoryId);
    return {
      success: true,
      data: types,
      count: types.length,
    };
  }
}
