import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Coupon } from '../../type/coupon';

@Injectable({
  providedIn: 'root',
})
export class CouponService {
  private apiUrl = `${environment.apiUrl}/api/Coupon`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');

    if (!token) {
      console.warn('Auth token not found in localStorage!');
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getCoupons(): Observable<Coupon[]> {
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

  getCouponById(id: number): Observable<Coupon> {
    const headers = this.getAuthHeaders();
    return this.http.get<Coupon>(`${this.apiUrl}/${id}`, { headers });
  }

  getCouponByCode(code: string): Observable<Coupon> {
    const headers = this.getAuthHeaders();
    return this.http.get<Coupon>(`${this.apiUrl}/code/${code}`, { headers });
  }

  postCoupon(couponData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, couponData, { headers });
  }

  updateCoupon(id: number, couponData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${id}`, couponData, { headers });
  }

  deleteCoupon(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }
}
