import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

const DEFAULT_DEV_USER_ID = '11111111-1111-1111-1111-111111111111';

@Injectable()
export class DevUserContextMiddleware implements NestMiddleware {
  use(req: Request & { user?: { id?: string } }, _res: Response, next: () => void) {
    if ((process.env.NODE_ENV || 'development') === 'production') {
      next();
      return;
    }

    if (!req.user?.id) {
      req.user = {
        id: process.env.DEV_USER_ID || DEFAULT_DEV_USER_ID,
      };
    }

    next();
  }
}
