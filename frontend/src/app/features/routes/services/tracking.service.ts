import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../../../core/services/api-url';
import { RouteTracking } from '../models/route-tracking.model';

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getRouteTracking(routeId: string): Observable<RouteTracking> {
    return this.http.get<RouteTracking>(`${this.apiUrl}/routes/tracking/${routeId}`);
  }
}
