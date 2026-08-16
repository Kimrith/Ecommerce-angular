import { HttpInterceptorFn } from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  let token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
  token = token.trim();

  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const customReq = req.clone({
    setHeaders: headers
  });

  return next(customReq);
};