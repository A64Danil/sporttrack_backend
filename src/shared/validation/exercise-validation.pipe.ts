import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isIsoDate = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
};

const toOptionalNumber = (
  value: unknown,
  fieldName: string,
  options?: { min?: number; max?: number },
): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed)) {
    throw new BadRequestException(`${fieldName} must be an integer`);
  }

  if (options?.min !== undefined && parsed < options.min) {
    throw new BadRequestException(`${fieldName} must be >= ${options.min}`);
  }

  if (options?.max !== undefined && parsed > options.max) {
    throw new BadRequestException(`${fieldName} must be <= ${options.max}`);
  }

  return parsed;
};

const validateMetricMap = (metrics: unknown): Record<string, number> => {
  if (!isPlainObject(metrics)) {
    throw new BadRequestException('metrics must be an object');
  }

  const entries = Object.entries(metrics);
  if (entries.length === 0) {
    throw new BadRequestException('metrics cannot be empty');
  }

  const result: Record<string, number> = {};

  for (const [key, value] of entries) {
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      throw new BadRequestException(
        `Invalid metric key: "${key}". Use only alphanumeric characters and underscores.`,
      );
    }

    const numericValue =
      typeof value === 'number' ? value : Number.parseFloat(String(value));

    if (!Number.isFinite(numericValue)) {
      throw new BadRequestException(
        `Metric value for "${key}" must be a valid number`,
      );
    }

    if (numericValue < 0) {
      throw new BadRequestException(
        `Metric value for "${key}" must be non-negative`,
      );
    }

    result[key] = numericValue;
  }

  return result;
};

@Injectable()
export class ExerciseValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    const dtoName = metadata.metatype?.name;

    switch (dtoName) {
      case 'CreateExerciseLogDto':
        return this.validateCreateExerciseLogDto(value);
      case 'UpdateExerciseLogDto':
        return this.validateUpdateExerciseLogDto(value);
      case 'CreateExerciseTypeDto':
        return this.validateCreateExerciseTypeDto(value);
      case 'UpdateExerciseTypeDto':
        return this.validateUpdateExerciseTypeDto(value);
      case 'GetExerciseLogsQueryDto':
        return this.validateGetExerciseLogsQueryDto(value);
      case 'CreateExerciseCategoryDto':
        return this.validateCreateExerciseCategoryDto(value);
      case 'UpdateExerciseCategoryDto':
        return this.validateUpdateExerciseCategoryDto(value);
      default:
        return value;
    }
  }

  private validateCreateExerciseLogDto(value: unknown) {
    if (!isPlainObject(value)) {
      throw new BadRequestException('Request body must be an object');
    }

    if (!isNonEmptyString(value.exerciseTypeId)) {
      throw new BadRequestException('exerciseTypeId is required');
    }

    if (value.performedAt !== undefined && !isIsoDate(value.performedAt)) {
      throw new BadRequestException('performedAt must be a valid ISO date');
    }

    const metrics = validateMetricMap(value.metrics);

    return {
      exerciseTypeId: value.exerciseTypeId.trim(),
      metrics,
      performedAt: value.performedAt ? String(value.performedAt) : undefined,
    };
  }

  private validateUpdateExerciseLogDto(value: unknown) {
    if (!isPlainObject(value)) {
      throw new BadRequestException('Request body must be an object');
    }

    if (value.performedAt !== undefined && !isIsoDate(value.performedAt)) {
      throw new BadRequestException('performedAt must be a valid ISO date');
    }

    return {
      performedAt: value.performedAt ? String(value.performedAt) : undefined,
    };
  }

  private validateCreateExerciseTypeDto(value: unknown) {
    if (!isPlainObject(value)) {
      throw new BadRequestException('Request body must be an object');
    }

    if (!isNonEmptyString(value.name)) {
      throw new BadRequestException('name is required');
    }

    if (!isNonEmptyString(value.primaryMetric)) {
      throw new BadRequestException('primaryMetric is required');
    }

    if (!isNonEmptyString(value.equipmentType)) {
      throw new BadRequestException('equipmentType is required');
    }

    if (value.categoryId !== undefined && !isNonEmptyString(value.categoryId)) {
      throw new BadRequestException('categoryId must be a string');
    }

    if (
      value.description !== undefined &&
      value.description !== null &&
      typeof value.description !== 'string'
    ) {
      throw new BadRequestException('description must be a string');
    }

    if (
      value.mainMediaUrl !== undefined &&
      value.mainMediaUrl !== null &&
      typeof value.mainMediaUrl !== 'string'
    ) {
      throw new BadRequestException('mainMediaUrl must be a string');
    }

    return {
      ...value,
      name: value.name.trim(),
      primaryMetric: value.primaryMetric.trim(),
      equipmentType: value.equipmentType.trim(),
      categoryId: value.categoryId ? String(value.categoryId).trim() : undefined,
      description:
        value.description === undefined ? undefined : String(value.description),
      mainMediaUrl:
        value.mainMediaUrl === undefined
          ? undefined
          : String(value.mainMediaUrl),
    };
  }

  private validateUpdateExerciseTypeDto(value: unknown) {
    if (!isPlainObject(value)) {
      throw new BadRequestException('Request body must be an object');
    }

    if (value.name !== undefined && !isNonEmptyString(value.name)) {
      throw new BadRequestException('name must be a string');
    }

    if (
      value.description !== undefined &&
      value.description !== null &&
      typeof value.description !== 'string'
    ) {
      throw new BadRequestException('description must be a string');
    }

    if (
      value.mainMediaUrl !== undefined &&
      value.mainMediaUrl !== null &&
      typeof value.mainMediaUrl !== 'string'
    ) {
      throw new BadRequestException('mainMediaUrl must be a string');
    }

    return {
      name: value.name === undefined ? undefined : String(value.name).trim(),
      description:
        value.description === undefined ? undefined : String(value.description),
      mainMediaUrl:
        value.mainMediaUrl === undefined
          ? undefined
          : String(value.mainMediaUrl),
    };
  }

  private validateGetExerciseLogsQueryDto(value: unknown) {
    if (!isPlainObject(value)) {
      throw new BadRequestException('Query must be an object');
    }

    if (value.from !== undefined && !isIsoDate(value.from)) {
      throw new BadRequestException('from must be a valid ISO date');
    }

    if (value.to !== undefined && !isIsoDate(value.to)) {
      throw new BadRequestException('to must be a valid ISO date');
    }

    if (
      value.exerciseTypeId !== undefined &&
      !isNonEmptyString(value.exerciseTypeId)
    ) {
      throw new BadRequestException('exerciseTypeId must be a string');
    }

    const limit = toOptionalNumber(value.limit, 'limit', { min: 1, max: 1000 });
    const offset = toOptionalNumber(value.offset, 'offset', { min: 0 });

    return {
      from: value.from === undefined ? undefined : String(value.from),
      to: value.to === undefined ? undefined : String(value.to),
      exerciseTypeId:
        value.exerciseTypeId === undefined
          ? undefined
          : String(value.exerciseTypeId).trim(),
      limit,
      offset,
    };
  }

  private validateCreateExerciseCategoryDto(value: unknown) {
    if (!isPlainObject(value)) {
      throw new BadRequestException('Request body must be an object');
    }

    if (!isNonEmptyString(value.name)) {
      throw new BadRequestException('name is required');
    }

    if (value.parentId !== undefined && !isNonEmptyString(value.parentId)) {
      throw new BadRequestException('parentId must be a string');
    }

    return {
      name: value.name.trim(),
      parentId: value.parentId ? String(value.parentId).trim() : undefined,
    };
  }

  private validateUpdateExerciseCategoryDto(value: unknown) {
    if (!isPlainObject(value)) {
      throw new BadRequestException('Request body must be an object');
    }

    if (value.name !== undefined && !isNonEmptyString(value.name)) {
      throw new BadRequestException('name must be a string');
    }

    if (value.parentId !== undefined && value.parentId !== null) {
      if (!isNonEmptyString(value.parentId)) {
        throw new BadRequestException('parentId must be a string or null');
      }
    }

    return {
      name: value.name === undefined ? undefined : String(value.name).trim(),
      parentId:
        value.parentId === undefined
          ? undefined
          : value.parentId === null
            ? null
            : String(value.parentId).trim(),
    };
  }
}
