import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/api/Review`;

  constructor(private http: HttpClient) { }

  getAllReviews(isApproved?: boolean): Observable<any[]> {
    let params = new HttpParams();
    if (isApproved !== undefined && isApproved !== null) {
      params = params.set('isApproved', isApproved.toString());
    }
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.$values)) return res.$values;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      })
    );
  }

  getReview(userId: number) {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`);
  }

  postReview(reviewData: any) {
    return this.http.post<any>(`${this.apiUrl}`, reviewData);
  }

  deleteReview(reviewId: number) {
    return this.http.delete<any>(`${this.apiUrl}/${reviewId}`);
  }

  editReview(reviewId: number, reviewData: any) {
    return this.http.put<any>(`${this.apiUrl}/${reviewId}`, reviewData);
  }

  getReviewByOrderId(orderId: number) {
    return this.http.get<any>(`${this.apiUrl}/order/${orderId}`);
  }

  getProductReview(productId: number) {
    return this.http.get<any>(`${this.apiUrl}/product/${productId}`);
  }
}