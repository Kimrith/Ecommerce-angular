import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Category {
  id: number;
  name: string;
  slug: string;
  status: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
  userId: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private apiUrl = 'http://localhost:5117/api/Categories';

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
}