import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpClient) { }

  getPayments(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/Payment`);
  }

  getPaymentStatistics(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/Payment/statistics`);
  }

  getSellerBakongConfig(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/SellerBakong/me`);
  }

  upsertSellerBakongConfig(config: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/SellerBakong/me`, config);
  }

  // Seller
  sellerPayments(sellerId: number, pageNumber: number, pageSize: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/Payment/seller/${sellerId}?pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }
}