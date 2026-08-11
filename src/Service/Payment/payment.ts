import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    let token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    token = token.trim();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getPayments(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${environment.apiUrl}/api/Payment`, { headers });
  }

  getPaymentStatistics(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${environment.apiUrl}/api/Payment/statistics`, { headers });
  }

  getSellerBakongConfig(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${environment.apiUrl}/api/SellerBakong/me`, { headers });
  }

  upsertSellerBakongConfig(config: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${environment.apiUrl}/api/SellerBakong/me`, config, { headers });
  }

  // Seller
  sellerPayments(sellerId: number, pageNumber: number, pageSize: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${environment.apiUrl}/api/Payment/seller/${sellerId}?pageNumber=${pageNumber}&pageSize=${pageSize}`, { headers });
  }
}
