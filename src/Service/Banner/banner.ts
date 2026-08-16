import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Banner } from '../../type/banner';

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private apiUrl = `${environment.apiUrl}/api/Banner`;

  constructor(private http: HttpClient) { }

  getBanners(): Observable<Banner[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        } else if (response && Array.isArray(response.$values)) {
          return response.$values;
        } else if (response && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      })
    );
  }

  getBannerById(id: number): Observable<Banner> {
    return this.http.get<Banner>(`${this.apiUrl}/${id}`);
  }

  postBanners(bannerData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, bannerData);
  }

  updateBanners(id: number, bannerData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, bannerData);
  }

  deleteBanners(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}