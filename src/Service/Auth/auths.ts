import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class Auths {
  private authUrl = `${environment.apiUrl}/api/Auth`;
  private userUrl = `${environment.apiUrl}/api/User`;

  constructor(private http: HttpClient) { }

  register(registerData: FormData): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/register`, registerData);
  }

  login(loginData: any): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, loginData);
  }

  getAllusers(): Observable<any> {
    return this.http.get<any>(`${this.userUrl}`);
  }

  getAllseller(): Observable<any> {
    return this.http.get<any>(`${this.userUrl}/sellers`);
  }

  updateSeller(id: number | string, sellerData: FormData): Observable<any> {
    return this.http.put<any>(`${this.userUrl}/${id}`, sellerData);
  }

  suspendSeller(sellerId: number): Observable<any> {
    return this.http.patch<any>(`${this.userUrl}/${sellerId}/suspend`, {});
  }

  reactivateSeller(sellerId: number): Observable<any> {
    return this.http.patch<any>(`${this.userUrl}/${sellerId}/reactivate`, {});
  }

  suspendUser(userId: number): Observable<any> {
    return this.http.patch<any>(`${this.userUrl}/${userId}/suspend`, {});
  }

  reactivateUser(userId: number): Observable<any> {
    return this.http.patch<any>(`${this.userUrl}/${userId}/reactivate`, {});
  }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.userUrl}/${id}`);
  }

  updateUserById(id: number | string, userData: FormData): Observable<any> {
    return this.http.put<any>(`${this.userUrl}/${id}`, userData);
  }
}