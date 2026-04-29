import type { ImportRouteRowErrorDto } from './import-routes-csv.dto.js';

export interface ImportRoutesResponseDto {
  imported: number;
  failed: number;
  errors: ImportRouteRowErrorDto[];
}
