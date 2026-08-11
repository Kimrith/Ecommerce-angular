import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/api/Order`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    let token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    token = token.trim();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getOrders(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(this.apiUrl, { headers });
  }

  createOrder(orderPayload: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, orderPayload, { headers });
  }

  getOrderStatistics(sellerId?: number): Observable<any> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    if (sellerId !== undefined && sellerId !== null) {
      params = params.set('sellerId', sellerId.toString());
    }
    return this.http.get<any>(`${this.apiUrl}/statistics`, { headers, params });
  }

  updateOrderStatus(orderId: number | string, numericStatus: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(`${this.apiUrl}/${orderId}/status`, { status: numericStatus }, { headers });
  }

  // 👇 Added OrderItems API method with response mapping
  getOrderItemsByOrderId(orderId: number | string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    // Note: OrderItems uses a different route base, so it references environment.apiUrl directly
    return this.http.get<any>(`${environment.apiUrl}/api/OrderItems/order/${orderId}`, { headers }).pipe(
      map((res: any) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.$values)) return res.$values;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      })
    );
  }

  // GetSellerOrder with Pagination and filtering support
  getSellerOrder(sellerId: number, params?: { pageNumber: number; pageSize: number; status?: string; searchTerm?: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    let httpParams = new HttpParams();

    if (params) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.status) {
        httpParams = httpParams.set('status', params.status);
      }
      if (params.searchTerm) {
        httpParams = httpParams.set('searchTerm', params.searchTerm);
      }
    }

    return this.http.get<any>(`${this.apiUrl}/seller/${sellerId}`, { headers, params: httpParams });
  }

  verifyPayment(orderId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${environment.apiUrl}/api/Payment/verify-payment/${orderId}`, { headers });
  }

  generateQrCode(orderId: number | string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${environment.apiUrl}/api/GenerateQROrders/${orderId}/generate-qr`, { headers });
  }
}