import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = `${environment.apiUrl}/api/Addresses`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    let token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    token = token.trim();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getUserAddresses(userId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`, { headers });
  }

  createAddress(userId: number, addressData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/user/${userId}`, addressData, { headers });
  }

  updateAddress(id: number, userId: number, addressData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${id}/user/${userId}`, addressData, { headers });
  }

  deleteAddress(id: number, userId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/${id}/user/${userId}`, { headers });
  }
}
