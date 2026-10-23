import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from './toast.service';

export const rateLimitInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse && error.status === 429) {
        let retrySeconds = error.headers?.get('Retry-After');
        let message = 'Rate limit exceeded. Please wait a moment before trying again.';

        if (error.error?.detail) {
          message = error.error.detail;
        } else if (error.error?.message) {
          message = error.error.message;
        }

        if (retrySeconds) {
          message += ` (Retry after ${retrySeconds} seconds)`;
        }

        toastService.show(message, 'warning', 6000);
      }
      return throwError(() => error);
    })
  );
};
