import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ProductStatistics } from '../../type/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/api/Product`;
  private variantApiUrl = `${environment.apiUrl}/api/ProductVariant`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // admin
  createProduct(productData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, productData, { headers });
  }

  updateProduct(productId: number, productData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${productId}`, productData, { headers });
  }

  updateProductStatus(productId: number, status: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/${productId}/status`, { status }, { headers });
  }

  suspendProduct(productId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/${productId}/suspend`, {}, { headers });
  }

  // 👇 Updated to accept pageNumber, pageSize, and optional filters
  getAllProduct(
    pageNumber: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    categoryId?: number | null,
    status?: number | string | null
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (categoryId !== undefined && categoryId !== null) {
      params = params.set('categoryId', categoryId.toString());
    }
    if (status !== undefined && status !== null) {
      // Map status number/string representation to string enum name for maximum reliability with ASP.NET Core enum model binding
      const statusNum = Number(status);
      let statusStr = status.toString();
      if (!isNaN(statusNum)) {
        const names = ['Draft', 'Pending', 'Approved', 'Rejected', 'Archived', 'Suspended'];
        statusStr = names[statusNum] || statusStr;
      }
      params = params.set('status', statusStr);
    }

    return this.http.get<any>(this.apiUrl, { headers, params });
  }

  getProductById(productId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/${productId}`, { headers });
  }

  getProductVariants(productId: number): Observable<any> {
    // const headers = this.getAuthHeaders();
    // return this.http.get<any>(`${this.variantApiUrl}/product/${productId}`, { headers });
    return this.http.get<any>(`${this.variantApiUrl}/product/${productId}`);
  }

  deleteProductWithVariants(productId: number): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.getProductVariants(productId).pipe(
      switchMap((variantsResponse) => {
        // Safely extract variants array matching your backend structure
        let variants: any[] = [];
        if (Array.isArray(variantsResponse)) {
          variants = variantsResponse;
        } else if (variantsResponse && Array.isArray(variantsResponse.$values)) {
          variants = variantsResponse.$values;
        } else if (variantsResponse && Array.isArray(variantsResponse.data)) {
          variants = variantsResponse.data;
        }

        // If there are variants, delete all of them in parallel first using forkJoin
        if (variants.length > 0) {
          const variantDeleteObservables = variants.map(variant =>
            this.http.delete<any>(`${this.variantApiUrl}/${variant.id}`, { headers })
          );

          return forkJoin(variantDeleteObservables).pipe(
            // Once all variants are successfully deleted, delete the main product
            switchMap(() => this.http.delete<any>(`${this.apiUrl}/${productId}`, { headers }))
          );
        }

        // If no variants exist, just delete the main product directly
        return this.http.delete<any>(`${this.apiUrl}/${productId}`, { headers });
      }),
      catchError((err) => {
        // Fallback: If fetching variants fails entirely, try deleting the main product directly
        return this.http.delete<any>(`${this.apiUrl}/${productId}`, { headers });
      })
    );
  }

  addProductVariant(data: any): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.post<any>(
      this.variantApiUrl,
      data,
      { headers }
    );
  }

  updateProductVariant(variantId: number, data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.variantApiUrl}/${variantId}`, data, { headers });
  }

  deleteProductVariant(variantId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.variantApiUrl}/${variantId}`, { headers });
  }

  ProductStatiStics(sellerId?: number): Observable<ProductStatistics> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    if (sellerId !== undefined && sellerId !== null) {
      params = params.set('sellerId', sellerId.toString());
    }
    return this.http.get<ProductStatistics>(`${this.apiUrl}/statistics`, { headers, params });
  }

  getBestSellers(limit: number = 5): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/best-sellers?limit=${limit}`, { headers });
  }

  // seller

  getProductSeller(sellerId: number, pageNumber: number = 1, pageSize: number = 1000) {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<any>(`${this.apiUrl}/seller/${sellerId}`, { headers, params });
  }
}