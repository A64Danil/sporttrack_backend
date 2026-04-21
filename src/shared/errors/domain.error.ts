export class DomainError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, metadata);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string = 'Resource not found', metadata?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', 404, metadata);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized', metadata?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', 401, metadata);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Forbidden', metadata?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', 403, metadata);
    this.name = 'ForbiddenError';
  }
}