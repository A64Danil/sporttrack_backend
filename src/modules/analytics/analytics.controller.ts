import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { getRequestUserId } from '../../shared/http/request-user';
import type { RequestWithUser } from '../../shared/http/request-user';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('streak')
  async getStreak(@Req() request: RequestWithUser) {
    const userId = getRequestUserId(request);
    const currentStreak = await this.service.getCurrentStreak(userId);

    return {
      success: true,
      data: {
        currentStreak,
      },
    };
  }

  @Get('summary')
  async getSummary(@Req() request: RequestWithUser) {
    const userId = getRequestUserId(request);
    const summary = await this.service.getSummary(userId);

    return {
      success: true,
      data: summary,
    };
  }

  @Post('recalculate')
  async recalculate(@Req() request: RequestWithUser) {
    const userId = getRequestUserId(request);
    const currentStreak = await this.service.recalculate(userId);
    const summary = await this.service.getSummary(userId);

    return {
      success: true,
      data: {
        currentStreak,
        summary,
      },
    };
  }
}

