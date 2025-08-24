import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { Ad, AdDto } from '../models/ad';

@Injectable({ providedIn: 'root' })
export class AdsService {
  private base = 'https://localhost:7054';
  ads$ = new BehaviorSubject<Ad[]>([]);

  constructor(private http: HttpClient) {}

  list(filters?: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    lat?: number;
    lng?: number;
    radiusMeters?: number;
  }) {
    let p = new HttpParams();
    Object.entries(filters ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http
      .get<Ad[]>(`${this.base}/ads`, { params: p })
      .pipe(tap((ads) => this.ads$.next(ads)));
  }

  get(id: string) {
    return this.http.get<Ad>(`${this.base}/ads/${id}`);
  }
  create(dto: AdDto) {
    return this.http.post<Ad>(`${this.base}/ads`, dto).pipe(tap(() => this.list().subscribe()));
  }
  update(id: string, dto: AdDto) {
    return this.http
      .put<Ad>(`${this.base}/ads/${id}`, dto)
      .pipe(tap(() => this.list().subscribe()));
  }
  remove(id: string) {
    return this.http.delete(`${this.base}/ads/${id}`).pipe(tap(() => this.list().subscribe()));
  }
}
