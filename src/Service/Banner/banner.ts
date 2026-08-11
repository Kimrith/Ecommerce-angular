import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Banner } from '../../type/banner'; // Import the interface

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private apiUrl = `${environment.apiUrl}/api/Banner`;

  constructor(private http: HttpClient) { } // <-- Added HttpClient injection

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');

    if (!token) {
      console.warn('Auth token not found in localStorage!');
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getBanners(): Observable<Banner[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(this.apiUrl, { headers }).pipe(
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
    const headers = this.getAuthHeaders();
    return this.http.get<Banner>(`${this.apiUrl}/${id}`, { headers });
  }

  postBanners(bannerData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, bannerData, { headers });
  }

  updateBanners(id: number, bannerData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${id}`, bannerData, { headers });
  }

  deleteBanners(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }
}