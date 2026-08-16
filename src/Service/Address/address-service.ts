import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = `${environment.apiUrl}/api/Addresses`;

  constructor(private http: HttpClient) { }

  getUserAddresses(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`);
  }

  createAddress(userId: number, addressData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/user/${userId}`, addressData);
  }

  updateAddress(id: number, userId: number, addressData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/user/${userId}`, addressData);
  }

  deleteAddress(id: number, userId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/user/${userId}`);
  }
}