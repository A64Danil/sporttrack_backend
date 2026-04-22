import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

export type RequestWithUser = Request & {
  user?: {
    id?: string;
  };
};

export function getRequestUserId(request: RequestWithUser): string {
  const userId = request.user?.id;

  if (!userId) {
    throw new UnauthorizedException('Request user context is missing');
  }

  return userId;
}
