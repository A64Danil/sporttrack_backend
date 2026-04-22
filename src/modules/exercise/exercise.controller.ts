import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  UsePipes,
  Req,
} from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import {
  CreateExerciseLogDto,
  UpdateExerciseLogDto,
  UpdateExerciseLogMetricsDto,
  CreateExerciseTypeDto,
  UpdateExerciseTypeDto,
  GetExerciseLogsQueryDto,
} from './dto/exercise.dto';
import { ExerciseValidationPipe } from '../../shared/validation/exercise-validation.pipe';
import type { RequestWithUser } from '../../shared/http/request-user';
import { getRequestUserId } from '../../shared/http/request-user';

@Controller('exercise')
@UsePipes(ExerciseValidationPipe)
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
    @Req() request: RequestWithUser,
  ) {
    const userId = getRequestUserId(request);
    const result = await this.service.createExerciseLog(userId, dto);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /exercise/logs
   * Get user's exercise logs
   */
  @Get('logs')
  async getLogs(
    @Query() query: GetExerciseLogsQueryDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = getRequestUserId(request);

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
  async getLog(@Param('id') id: string, @Req() request: RequestWithUser) {
    const userId = getRequestUserId(request);
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
   * GET /exercise/log/:id/metrics
   * Get metrics for a single exercise log
   */
  @Get('log/:id/metrics')
  async getLogMetrics(
    @Param('id') id: string,
    @Req() request: RequestWithUser,
  ) {
    const userId = getRequestUserId(request);
    const metrics = await this.service.getExerciseLogMetrics(userId, id);

    if (!metrics) {
      throw new NotFoundException('Exercise log not found');
    }

    return {
      success: true,
      data: metrics,
      count: Object.keys(metrics.metrics).length,
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
    @Req() request: RequestWithUser,
  ) {
    const userId = getRequestUserId(request);
    const updated = await this.service.updateExerciseLog(userId, id, dto);

    if (!updated) {
      throw new NotFoundException('Exercise log not found');
    }

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * PUT /exercise/log/:id/metrics
   * Replace metrics for an exercise log
   */
  @Put('log/:id/metrics')
  async replaceLogMetrics(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseLogMetricsDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = getRequestUserId(request);
    const updated = await this.service.replaceExerciseLogMetrics(
      userId,
      id,
      dto.metrics,
    );

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
  async createExerciseType(
    @Body() dto: CreateExerciseTypeDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = getRequestUserId(request);
    const result = await this.service.createExerciseType(userId, dto);

    return {
      success: true,
      data: result,
    };
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
   * GET /exercise/types/user
   * Get exercise types created by the current user
   */
  @Get('types/user')
  async getUserExerciseTypes(@Req() request: RequestWithUser) {
    const userId = getRequestUserId(request);
    const types = await this.service.getUserExerciseTypes(userId);
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
    @Req() request: RequestWithUser,
  ) {
    const userId = getRequestUserId(request);
    const updated = await this.service.updateExerciseType(userId, id, dto);

    if (!updated) {
      throw new NotFoundException('Exercise type not found');
    }

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * DELETE /exercise/types/:id
   * Delete a user-created exercise type
   */
  @Delete('types/:id')
  async deleteExerciseType(
    @Param('id') id: string,
    @Req() request: RequestWithUser,
  ) {
    const userId = getRequestUserId(request);
    const deleted = await this.service.deleteExerciseType(userId, id);

    if (!deleted) {
      throw new NotFoundException('Exercise type not found');
    }

    return {
      success: true,
      deleted: true,
    };
  }

  /**
   * GET /exercise/categories/:categoryId/types
   * Get exercise types for category
   */
  @Get('categories/:categoryId/types')
  async getExerciseTypesByCategory(@Param('categoryId') categoryId: string) {
    const types = await this.service.getExerciseTypesByCategory(categoryId);
    return {
      success: true,
      data: types,
      count: types.length,
    };
  }
}
