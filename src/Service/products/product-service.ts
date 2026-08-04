import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:5117/api/Product';
  private variantApiUrl = 'http://localhost:5117/api/ProductVariant';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  createProduct(productData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, productData, { headers });
  }

  // 👇 Updated to accept pageNumber and pageSize and send them as query params
  getAllProduct(pageNumber: number = 1, pageSize: number = 10): Observable<any> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<any>(this.apiUrl, { headers, params });
  }

  getProductVariants(productId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.variantApiUrl}/product/${productId}`, { headers });
  }
}