import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '../shared/errors/domain.error';

@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const normalized = this.normalizeException(exception);

    response.status(normalized.statusCode).json({
      statusCode: normalized.statusCode,
      error: normalized.error,
      message: normalized.message,
      code: normalized.code,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private normalizeException(exception: unknown): {
    statusCode: number;
    error: string;
    message: string;
    code: string;
  } {
    if (exception instanceof DomainError) {
      return {
        statusCode: exception.statusCode,
        error: exception.name,
        message: exception.message,
        code: exception.code,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : typeof response === 'object' && response && 'message' in response
            ? String((response as { message?: unknown }).message ?? exception.message)
            : exception.message;

      return {
        statusCode,
        error: exception.name,
        message,
        code: HttpStatus[statusCode] || 'HTTP_EXCEPTION',
      };
    }

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message,
      code: 'INTERNAL_SERVER_ERROR',
    };
  }
}
