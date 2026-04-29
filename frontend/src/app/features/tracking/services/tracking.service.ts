import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Shipment } from '../../../core/models/shipment.model';
import { API_URL } from '../../../core/services/api-url';

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  track(trackingNumber: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.apiUrl}/tracking/${trackingNumber}`);
  }
}
