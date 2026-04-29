import { parse } from 'csv-parse/sync';
import { z } from 'zod';

import { ROUTE_STATUSES } from '../../../domain/constants/route-status.js';
import type { ImportRouteParams } from '../../../domain/ports/route-repository.js';
import { positiveDecimal, sanitizeText, sanitizedText } from '../../helpers/validation/sanitizers.js';
import { ROUTE_NUMERIC_LIMITS } from './create-route-request.dto.js';

type CsvRecord = Record<string, unknown>;

export interface ImportRouteRowErrorDto {
  row: number;
  message: string;
}

export interface ParsedRoutesCsvDto {
  routes: ImportRouteParams[];
  failed: number;
  errors: ImportRouteRowErrorDto[];
}

export class InvalidRoutesCsvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoutesCsvError';
  }
}

const routeCsvRowSchema = z.object({
  originCity: sanitizedText(120),
  destinationCity: sanitizedText(120),
  distanceKm: positiveDecimal(ROUTE_NUMERIC_LIMITS.distanceKm),
  estimatedTimeHours: positiveDecimal(ROUTE_NUMERIC_LIMITS.estimatedTimeHours),
  vehicleType: sanitizedText(80),
  carrier: sanitizedText(120),
  costUsd: positiveDecimal(ROUTE_NUMERIC_LIMITS.costUsd),
  status: z
    .string()
    .transform((status) => sanitizeText(status).toUpperCase())
    .pipe(z.enum(ROUTE_STATUSES)),
  createdAt: z.coerce.date().optional()
});

const getCsvValue = (record: CsvRecord, names: string[]) => {
  for (const name of names) {
    if (record[name] !== undefined) {
      return record[name];
    }
  }

  return undefined;
};

const normalizeRouteRecord = (record: CsvRecord) => ({
  originCity: getCsvValue(record, ['originCity', 'origin_city']),
  destinationCity: getCsvValue(record, ['destinationCity', 'destination_city']),
  distanceKm: getCsvValue(record, ['distanceKm', 'distance_km']),
  estimatedTimeHours: getCsvValue(record, ['estimatedTimeHours', 'estimated_time_hours']),
  vehicleType: getCsvValue(record, ['vehicleType', 'vehicle_type', 'vehicule_type']),
  carrier: getCsvValue(record, ['carrier']),
  costUsd: getCsvValue(record, ['costUsd', 'cost_usd']),
  status: getCsvValue(record, ['status']),
  createdAt: getCsvValue(record, ['createdAt', 'created_at'])
});

const formatZodIssues = (error: z.ZodError) =>
  error.issues
    .map((issue) => `${issue.path.join('.') || 'row'}: ${issue.message}`)
    .join('; ');

export const parseRoutesCsv = (csvContent: string): ParsedRoutesCsvDto => {
  let records: CsvRecord[];

  try {
    records = parse(csvContent, {
      bom: true,
      columns: true,
      delimiter: [',', ';'],
      skip_empty_lines: true,
      trim: true
    }) as CsvRecord[];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo leer el CSV';

    throw new InvalidRoutesCsvError(message);
  }

  const routes: ImportRouteParams[] = [];
  const errors: ImportRouteRowErrorDto[] = [];

  records.forEach((record, index) => {
    const row = index + 2;
    const parsedRoute = routeCsvRowSchema.safeParse(normalizeRouteRecord(record));

    if (!parsedRoute.success) {
      errors.push({
        row,
        message: formatZodIssues(parsedRoute.error)
      });
      return;
    }

    routes.push(parsedRoute.data);
  });

  return {
    routes,
    failed: errors.length,
    errors
  };
};
