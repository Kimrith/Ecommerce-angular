import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Category, CategoryStatistics } from '../../type/categories';
export type { Category, CategoryStatistics };

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private apiUrl = `${environment.apiUrl}/api/Categories`;

  constructor(private http: HttpClient) { }

  getCategories(): Observable<Category[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        // Handles if the response is wrapped in an object or directly an array
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

  createCategory(categoryData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, categoryData);
  }

  updateCategory(categoryId: number, categoryData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${categoryId}`, categoryData);
  }

  deleteCategory(categoryId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${categoryId}`);
  }

  CategoriesStatistics(sellerId?: number): Observable<CategoryStatistics> {
    let params = new HttpParams();
    if (sellerId !== undefined && sellerId !== null) {
      params = params.set('sellerId', sellerId.toString());
    }
    return this.http.get<CategoryStatistics>(`${this.apiUrl}/statistics`, { params });
  }

  // seller 

  getAllCategoriesSeller(sellerId: number): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/seller/${sellerId}`);
  }
}