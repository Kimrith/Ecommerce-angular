import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, shareReplay, Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  private apiUrl = `${environment.apiUrl}/api/Favorite`;

  private favoritesObservable$: Observable<any[]> | null = null;
  private currentUserId: number | null = null;

  // Subject to notify components when favorite status changes
  private favoriteChanges = new Subject<void>();
  favoriteChanges$ = this.favoriteChanges.asObservable();

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

  // 1. GET: Get all favorites by user ID with caching and shareReplay
  getAllFavorite(userId: number, forceRefresh = false): Observable<any[]> {
    if (forceRefresh) {
      this.favoritesObservable$ = null;
    }

    if (this.favoritesObservable$ && this.currentUserId === userId) {
      return this.favoritesObservable$;
    }

    this.currentUserId = userId;
    const headers = this.getAuthHeaders();
    this.favoritesObservable$ = this.http.get<any>(`${this.apiUrl}/user/${userId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        } else if (response && Array.isArray(response.$values)) {
          return response.$values;
        } else if (response && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      }),
      shareReplay(1)
    );

    return this.favoritesObservable$;
  }

  // 2. POST: Add item to favorites
  postFavorite(favoriteData: { productId: number }): Observable<any> {
    this.favoritesObservable$ = null; // Clear cache
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, favoriteData, { headers }).pipe(
      tap(() => this.favoriteChanges.next())
    );
  }

  // 3. DELETE: Remove favorite by product ID
  deleteFavoriteByProduct(productId: number): Observable<any> {
    this.favoritesObservable$ = null; // Clear cache
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/product/${productId}`, { headers }).pipe(
      tap(() => this.favoriteChanges.next())
    );
  }
}