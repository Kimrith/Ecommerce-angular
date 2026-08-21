import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { forkJoin, Observable } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ProductStatistics } from '../../type/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/api/Product`;
  private variantApiUrl = `${environment.apiUrl}/api/ProductVariant`;

  constructor(private http: HttpClient) { }

  // admin
  createProduct(productData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, productData);
  }

  updateProduct(productId: number, productData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${productId}`, productData);
  }

  updateProductStatus(productId: number, status: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${productId}/status`, { status });
  }

  suspendProduct(productId: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${productId}/suspend`, {});
  }

  getAllProduct(
    pageNumber: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    categoryId?: number | null,
    status?: number | string | null,
    sortBy?: string
  ): Observable<any> {
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
      const statusNum = Number(status);
      let statusStr = status.toString();
      if (!isNaN(statusNum)) {
        const names = ['Draft', 'Pending', 'Approved', 'Rejected', 'Archived', 'Suspended'];
        statusStr = names[statusNum] || statusStr;
      }
      params = params.set('status', statusStr);
    }
    if (sortBy) {
      params = params.set('sortBy', sortBy);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  getProductById(productId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${productId}`);
  }

  getProductVariants(productId: number): Observable<any> {
    return this.http.get<any>(`${this.variantApiUrl}/product/${productId}`);
  }

  deleteProductWithVariants(productId: number): Observable<any> {
    return this.getProductVariants(productId).pipe(
      switchMap((variantsResponse) => {
        let variants: any[] = [];
        if (Array.isArray(variantsResponse)) {
          variants = variantsResponse;
        } else if (variantsResponse && Array.isArray(variantsResponse.$values)) {
          variants = variantsResponse.$values;
        } else if (variantsResponse && Array.isArray(variantsResponse.data)) {
          variants = variantsResponse.data;
        }

        if (variants.length > 0) {
          const variantDeleteObservables = variants.map(variant =>
            this.http.delete<any>(`${this.variantApiUrl}/${variant.id}`)
          );

          return forkJoin(variantDeleteObservables).pipe(
            switchMap(() => this.http.delete<any>(`${this.apiUrl}/${productId}`))
          );
        }

        return this.http.delete<any>(`${this.apiUrl}/${productId}`);
      }),
      catchError(() => {
        return this.http.delete<any>(`${this.apiUrl}/${productId}`);
      })
    );
  }

  addProductVariant(data: any): Observable<any> {
    return this.http.post<any>(this.variantApiUrl, data);
  }

  updateProductVariant(variantId: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.variantApiUrl}/${variantId}`, data);
  }

  deleteProductVariant(variantId: number): Observable<any> {
    return this.http.delete<any>(`${this.variantApiUrl}/${variantId}`);
  }

  ProductStatiStics(sellerId?: number): Observable<ProductStatistics> {
    let params = new HttpParams();
    if (sellerId !== undefined && sellerId !== null) {
      params = params.set('sellerId', sellerId.toString());
    }
    return this.http.get<ProductStatistics>(`${this.apiUrl}/statistics`, { params });
  }

  getBestSellers(limit: number = 5): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/best-sellers?limit=${limit}`);
  }

  // seller

  getProductSeller(
    sellerId: number,
    pageNumber: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    categoryId?: string | number | null,
    status?: string | number | null
  ) {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      params = params.set('categoryId', categoryId.toString());
    }
    if (status !== undefined && status !== null && status !== '') {
      const statusNum = Number(status);
      let statusStr = status.toString();
      if (!isNaN(statusNum)) {
        const names = ['Draft', 'Pending', 'Approved', 'Rejected', 'Archived', 'Suspended'];
        statusStr = names[statusNum] || statusStr;
      }
      params = params.set('status', statusStr);
    }

    return this.http.get<any>(`${this.apiUrl}/seller/${sellerId}`, { params });
  }
}