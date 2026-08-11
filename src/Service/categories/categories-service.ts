import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Category, CategoryStatistics } from '../../type/categories';
export type { Category, CategoryStatistics };

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private apiUrl = `${environment.apiUrl}/api/Categories`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');

    if (!token) {
      console.warn('Auth token not found in localStorage!');
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getCategories(): Observable<Category[]> {
    const headers = this.getAuthHeaders(); // <-- Added headers here
    return this.http.get<any>(this.apiUrl, { headers }).pipe( // <-- Passed headers into the GET request
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
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, categoryData, { headers });
  }

  updateCategory(categoryId: number, categoryData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${categoryId}`, categoryData, { headers });
  }

  deleteCategory(categoryId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/${categoryId}`, { headers });
  }

  CategoriesStatistics(sellerId?: number): Observable<CategoryStatistics> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    if (sellerId !== undefined && sellerId !== null) {
      params = params.set('sellerId', sellerId.toString());
    }
    return this.http.get<CategoryStatistics>(`${this.apiUrl}/statistics`, { headers, params });
  }

  // seller 

  getAllCategoriesSeller(sellerId: number) {
    const headers = this.getAuthHeaders();
    return this.http.get<Category[]>(`${this.apiUrl}/seller/${sellerId}`, { headers });
  }
}