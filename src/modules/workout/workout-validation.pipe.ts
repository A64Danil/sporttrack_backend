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

const toInteger = (value: unknown, fieldName: string): number => {
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed)) {
    throw new BadRequestException(`${fieldName} must be an integer`);
  }

  return parsed;
};

const toNonNegativeInteger = (value: unknown, fieldName: string): number => {
  const parsed = toInteger(value, fieldName);

  if (parsed < 0) {
    throw new BadRequestException(`${fieldName} must be >= 0`);
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
      throw new BadRequestException(`Invalid metric key: "${key}"`);
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
export class WorkoutValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    const dtoName = metadata.metatype?.name;

    switch (dtoName) {
      case 'CreateWorkoutDto':
        return this.validateCreateWorkoutDto(value);
      case 'CreateWorkoutBlockDto':
        return this.validateCreateWorkoutBlockDto(value);
      case 'CreateWorkoutItemDto':
        return this.validateCreateWorkoutItemDto(value);
      case 'CompleteWorkoutDto':
        return this.validateCompleteWorkoutDto(value);
      default:
        return value;
    }
  }

  private validateCreateWorkoutDto(value: unknown) {
    if (!isPlainObject(value)) {
      throw new BadRequestException('Request body must be an object');
    }

    if (value.name !== undefined && value.name !== null && !isNonEmptyString(value.name)) {
      throw new BadRequestException('name must be a string');
    }

    return {
      name: value.name === undefined ? undefined : String(value.name).trim(),
    };
  }

  private validateCreateWorkoutBlockDto(value: unknown) {
    if (!isPlainObject(value)) {
      throw new BadRequestException('Request body must be an object');
    }

    if (value.name !== undefined && value.name !== null && typeof value.name !== 'string') {
      throw new BadRequestException('name must be a string or null');
    }

    return {
      name:
          value.name === undefined
            ? undefined
            : value.name === null
            ? null
            : String(value.name).trim(),
      orderIndex: toNonNegativeInteger(value.orderIndex, 'orderIndex'),
    };
  }

  private validateCreateWorkoutItemDto(value: unknown) {
    if (!isPlainObject(value)) {
      throw new BadRequestException('Request body must be an object');
    }

    if (!isNonEmptyString(value.exerciseTypeId)) {
      throw new BadRequestException('exerciseTypeId is required');
    }

    if (value.workoutBlockId !== undefined && value.workoutBlockId !== null && !isNonEmptyString(value.workoutBlockId)) {
      throw new BadRequestException('workoutBlockId must be a string or null');
    }

    return {
      exerciseTypeId: String(value.exerciseTypeId).trim(),
      orderIndex: toNonNegativeInteger(value.orderIndex, 'orderIndex'),
      workoutBlockId:
        value.workoutBlockId === undefined
          ? undefined
          : value.workoutBlockId === null
            ? null
            : String(value.workoutBlockId).trim(),
    };
  }

  private validateCompleteWorkoutDto(value: unknown) {
    if (!isPlainObject(value)) {
      throw new BadRequestException('Request body must be an object');
    }

    if (!Array.isArray(value.entries) || value.entries.length === 0) {
      throw new BadRequestException('entries must be a non-empty array');
    }

    const entries = value.entries.map((entry, index) => {
      if (!isPlainObject(entry)) {
        throw new BadRequestException(`entries[${index}] must be an object`);
      }

      if (!isNonEmptyString(entry.workoutItemId)) {
        throw new BadRequestException(`entries[${index}].workoutItemId is required`);
      }

      const metrics = validateMetricMap(entry.metrics);

      if (entry.performedAt !== undefined && !isIsoDate(entry.performedAt)) {
        throw new BadRequestException(
          `entries[${index}].performedAt must be a valid ISO date`,
        );
      }

      return {
        workoutItemId: String(entry.workoutItemId).trim(),
        metrics,
        performedAt:
          entry.performedAt === undefined
            ? undefined
            : String(entry.performedAt),
      };
    });

    return { entries };
  }
}
