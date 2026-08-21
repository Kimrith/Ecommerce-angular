import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';
import { Auths } from '../../Service/Auth/auths';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/<script[^>]*>([\S\s]*?)<\/script>/gi, '') // Strip script tags completely
      .replace(/on\w+\s*=\s*(['"])(.*?)\1/gi, '') // Remove inline handlers like onload, onclick, onerror
      .replace(/javascript:\s*/gi, ''); // Remove javascript: protocol
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }
  if (data !== null && typeof data === 'object') {
    if (data instanceof FormData) {
      const sanitizedFormData = new FormData();
      data.forEach((value: any, key: string) => {
        if (value instanceof File) {
          sanitizedFormData.append(key, value, value.name);
        } else if (typeof value === 'string') {
          sanitizedFormData.append(key, sanitizeInput(value));
        } else {
          sanitizedFormData.append(key, value);
        }
      });
      return sanitizedFormData;
    }
    if (data instanceof File || data instanceof Blob || data instanceof Date || data instanceof RegExp) {
      return data;
    }
    const sanitized: any = {};
    for (const key of Object.keys(data)) {
      sanitized[key] = sanitizeInput(data[key]);
    }
    return sanitized;
  }
  return data;
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authsService = inject(Auths);

  let token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
  token = token.trim();

  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = req.body;
  if (body) {
    body = sanitizeInput(body);
  }

  const customReq = req.clone({
    setHeaders: headers,
    body: body
  });

  return next(customReq).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          // If the request itself failed on refresh token endpoint, do not retry to avoid infinite loop
          if (req.url.includes('/api/Auth/refresh-token')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            router.navigate(['login']);
            return throwError(() => error);
          }

          const userDataString = localStorage.getItem('userData');
          let refreshToken = '';
          if (userDataString) {
            try {
              const userData = JSON.parse(userDataString);
              refreshToken = userData.refreshToken;
            } catch (e) {
              console.error('Error parsing user data in interceptor', e);
            }
          }

          if (refreshToken) {
            if (!isRefreshing) {
              isRefreshing = true;
              refreshTokenSubject.next(null);

              return authsService.refreshToken(refreshToken).pipe(
                switchMap((response: any) => {
                  isRefreshing = false;
                  const newAccessToken = response.token;
                  localStorage.setItem('authToken', newAccessToken);
                  localStorage.setItem('userData', JSON.stringify(response));
                  refreshTokenSubject.next(newAccessToken);

                  // Retry the original request with the new access token
                  const retriedReq = req.clone({
                    setHeaders: {
                      ...headers,
                      'Authorization': `Bearer ${newAccessToken}`
                    }
                  });
                  return next(retriedReq);
                }),
                catchError((refreshErr) => {
                  isRefreshing = false;
                  refreshTokenSubject.next(null);
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userData');
                  router.navigate(['login']);
                  return throwError(() => refreshErr);
                })
              );
            } else {
              // Wait for the token refresh process to finish
              return refreshTokenSubject.pipe(
                filter(token => token !== null),
                take(1),
                switchMap(newToken => {
                  const retriedReq = req.clone({
                    setHeaders: {
                      ...headers,
                      'Authorization': `Bearer ${newToken}`
                    }
                  });
                  return next(retriedReq);
                })
              );
            }
          } else {
            // No refresh token available, redirect to login
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            router.navigate(['login']);
          }
        } else if (error.status === 403) {
          const userDataString = localStorage.getItem('userData');
          let userRole = '';
          let status = '';
          if (userDataString) {
            try {
              const userData = JSON.parse(userDataString);
              userRole = userData.role || (userData.user && userData.user.role);
              status = (userData.status || (userData.user && userData.user.status) || '').toString().trim().toLowerCase();
            } catch (e) {
              console.error('Error parsing user data in interceptor', e);
            }
          }

          // Clear local storage upon auth authorization failure
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');

          if (userRole === 'Seller') {
            router.navigate(['seller-suspended']);
          } else if (userRole === 'Customer') {
            const isSuspended = status === 'suspended' || status === 'inactive' || 
                                (error.error?.message && (error.error.message.toLowerCase().includes('suspended') || error.error.message.toLowerCase().includes('inactive'))) ||
                                (error.error?.Message && (error.error.Message.toLowerCase().includes('suspended') || error.error.Message.toLowerCase().includes('inactive')));
            if (isSuspended) {
              router.navigate(['customer-suspended']);
            } else {
              router.navigate(['login']);
            }
          } else {
            router.navigate(['login']);
          }
        }
      }
      return throwError(() => error);
    })
  );
};