import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ListRoutesResponse, Route, RoutePayload } from '../../../core/models/route.model';
import { API_URL } from '../../../core/services/api-url';

@Injectable({ providedIn: 'root' })
export class RoutesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(page: number): Observable<ListRoutesResponse> {
    return this.http.get<ListRoutesResponse>(`${this.apiUrl}/routes`, {
      params: { page }
    });
  }

  create(payload: RoutePayload): Observable<Route> {
    return this.http.post<Route>(`${this.apiUrl}/routes`, payload);
  }

  update(id: string, payload: RoutePayload): Observable<Route> {
    return this.http.put<Route>(`${this.apiUrl}/routes/${id}`, payload);
  }

  delete(id: string): Observable<Route> {
    return this.http.delete<Route>(`${this.apiUrl}/routes/${id}`);
  }
}
