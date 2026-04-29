import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

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

  listAll(): Observable<Route[]> {
    return this.list(1).pipe(
      switchMap((firstPage) => {
        const totalPages = firstPage.pagination.totalPages;

        if (totalPages <= 1) {
          return of(firstPage.data);
        }

        const remainingRequests = Array.from({ length: totalPages - 1 }, (_value, index) =>
          this.list(index + 2)
        );

        return forkJoin(remainingRequests).pipe(
          map((remainingPages) => [
            ...firstPage.data,
            ...remainingPages.flatMap((page) => page.data)
          ])
        );
      })
    );
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
