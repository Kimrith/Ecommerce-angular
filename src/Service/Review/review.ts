import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/api/Review`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllReviews(isApproved?: boolean): Observable<any[]> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    if (isApproved !== undefined && isApproved !== null) {
      params = params.set('isApproved', isApproved.toString());
    }
    return this.http.get<any>(this.apiUrl, { headers, params }).pipe(
      map(res => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.$values)) return res.$values;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      })
    );
  }

  getReview(userId: number) {
    const headers = this.getAuthHeaders();
    // BUG FIX: Changed from environment.apiUrl to this.apiUrl
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`, { headers });
  }

  postReview(reviewData: any) {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}`, reviewData, { headers });
  }

  deleteReview(reviewId: number) {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/${reviewId}`, { headers });
  }

  editReview(reviewId: number, reviewData: any) {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${reviewId}`, reviewData, { headers });
  }

  getReviewByOrderId(orderId: number) {
    const headers = this.getAuthHeaders();
    // BUG FIX: Changed from environment.apiUrl to this.apiUrl
    return this.http.get<any>(`${this.apiUrl}/order/${orderId}`, { headers });
  }

  getProductReview(productId: number) {
    const headers = this.getAuthHeaders();
    // BUG FIX: Changed from environment.apiUrl to this.apiUrl
    return this.http.get<any>(`${this.apiUrl}/product/${productId}`, { headers });
  }
}