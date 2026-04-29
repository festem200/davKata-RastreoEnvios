import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';

import { prisma } from '../src/infrastructure/database/prisma.js';

const seedDirectory = dirname(fileURLToPath(import.meta.url));
const routesCsvPath = join(seedDirectory, 'seed-data', 'routes_dataset.csv');

const routeSeedSchema = z.object({
  originCity: z.string().trim().min(1),
  destinationCity: z.string().trim().min(1),
  distanceKm: z.coerce.number().positive(),
  estimatedTimeHours: z.coerce.number().positive(),
  vehicleType: z.string().trim().min(1),
  carrier: z.string().trim().min(1),
  costUsd: z.coerce.number().nonnegative(),
  status: z.enum(['ACTIVA', 'INACTIVA', 'SUSPENDIDA', 'EN_MANTENIMIENTO']),
  createdAt: z.coerce.date()
});

type CsvRecord = Record<string, unknown>;

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
  vehicleType: getCsvValue(record, ['vehicleType', 'vehicle_type']),
  carrier: getCsvValue(record, ['carrier']),
  costUsd: getCsvValue(record, ['costUsd', 'cost_usd']),
  status: String(getCsvValue(record, ['status']) ?? '').trim().toUpperCase(),
  createdAt: getCsvValue(record, ['createdAt', 'created_at'])
});

const formatZodIssues = (error: z.ZodError) =>
  error.issues
    .map((issue) => `${issue.path.join('.') || 'row'}: ${issue.message}`)
    .join('; ');

const seedRoutesFromCsv = async () => {
  if (!existsSync(routesCsvPath)) {
    console.warn(`Routes CSV not found. Skipping route seed: ${routesCsvPath}`);
    return;
  }

  const csvContent = readFileSync(routesCsvPath, 'utf8');
  const records = parse(csvContent, {
    bom: true,
    columns: true,
    delimiter: [',', ';'],
    skip_empty_lines: true,
    trim: true
  }) as CsvRecord[];

  const routes = records.map((record, index) => {
    const parsedRoute = routeSeedSchema.safeParse(normalizeRouteRecord(record));

    if (!parsedRoute.success) {
      throw new Error(`Invalid route CSV row ${index + 2}: ${formatZodIssues(parsedRoute.error)}`);
    }

    return parsedRoute.data;
  });

  if (routes.length === 0) {
    console.warn(`Routes CSV is empty. Skipping route seed: ${routesCsvPath}`);
    return;
  }

  await prisma.route.deleteMany();
  await prisma.route.createMany({ data: routes });
  console.log(`Seeded ${routes.length} routes from ${routesCsvPath}`);
};

try {
  await seedRoutesFromCsv();
} finally {
  await prisma.$disconnect();
}
