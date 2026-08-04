import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auths {
  private baseUrl = 'http://localhost:5117/api/Auth';

  constructor(private http: HttpClient) { }

  register(registerData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, registerData);
  }

  login(loginData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, loginData);
  }
}