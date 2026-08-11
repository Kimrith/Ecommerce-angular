import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class Auths {
  private authUrl = `${environment.apiUrl}/api/Auth`;
  private userUrl = `${environment.apiUrl}/api/User`; // Base URL for User endpoints

  constructor(private http: HttpClient) { }

  // Helper method to generate auth headers with the JWT token
  private getAuthHeaders(): HttpHeaders {
    let token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    token = token.trim();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  register(registerData: FormData): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/register`, registerData);
  }

  login(loginData: any): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, loginData);
  }

  getAllusers() {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.userUrl}`, { headers });
  }

  // Updated method using the correct user endpoint and auth headers
  getAllseller(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.userUrl}/sellers`, { headers });
  }

  updateSeller(id: number | string, sellerData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.userUrl}/${id}`, sellerData, { headers });
  }

  suspendSeller(sellerId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.userUrl}/${sellerId}/suspend`, {}, { headers });
  }

  reactivateSeller(sellerId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.userUrl}/${sellerId}/reactivate`, {}, { headers });
  }

  suspendUser(userId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.userUrl}/${userId}/suspend`, {}, { headers });
  }

  reactivateUser(userId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch<any>(`${this.userUrl}/${userId}/reactivate`, {}, { headers });
  }

  getUserById(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.userUrl}/${id}`, { headers });
  }

  updateUserById(id: number | string, userData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.userUrl}/${id}`, userData, { headers });
  }
}