import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { getRequestUserId } from '../../shared/http/request-user';
import type { RequestWithUser } from '../../shared/http/request-user';
import {
  CompleteWorkoutDto,
  CreateWorkoutBlockDto,
  CreateWorkoutDto,
  CreateWorkoutItemDto,
} from './workout.dto';
import { WorkoutValidationPipe } from './workout-validation.pipe';
import { WorkoutService } from './workout.service';

@Controller('workout')
@UsePipes(WorkoutValidationPipe)
@UseGuards(AuthGuard('jwt'))
export class WorkoutController {
  constructor(private readonly service: WorkoutService) {}

  @Post()
  async createWorkout(
    @Body() dto: CreateWorkoutDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = getRequestUserId(request);
    const workout = await this.service.createWorkout(userId, dto);

    return {
      success: true,
      data: workout,
    };
  }

  @Get(':id')
  async getWorkout(@Param('id') id: string, @Req() request: RequestWithUser) {
    const userId = getRequestUserId(request);
    const workout = await this.service.getWorkout(userId, id);

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    return {
      success: true,
      data: workout,
    };
  }

  @Post(':id/blocks')
  async addWorkoutBlock(
    @Param('id') id: string,
    @Body() dto: CreateWorkoutBlockDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = getRequestUserId(request);
    const block = await this.service.addWorkoutBlock(userId, id, dto);

    if (!block) {
      throw new NotFoundException('Workout not found');
    }

    return {
      success: true,
      data: block,
    };
  }

  @Post(':id/items')
  async addWorkoutItem(
    @Param('id') id: string,
    @Body() dto: CreateWorkoutItemDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = getRequestUserId(request);
    const item = await this.service.addWorkoutItem(userId, id, dto);

    if (!item) {
      throw new NotFoundException('Workout not found');
    }

    return {
      success: true,
      data: item,
    };
  }

  @Post(':id/complete')
  async completeWorkout(
    @Param('id') id: string,
    @Body() dto: CompleteWorkoutDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = getRequestUserId(request);
    const completed = await this.service.completeWorkout(userId, id, dto);

    if (!completed) {
      throw new NotFoundException('Workout not found');
    }

    return {
      success: true,
      data: completed,
    };
  }
}

