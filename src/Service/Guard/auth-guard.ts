import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auths } from '../Auth/auths';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const AuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authsService = inject(Auths);
  const token = localStorage.getItem('authToken');
  const userDataString = localStorage.getItem('userData');

  if (token && userDataString) {
    try {
      const userData = JSON.parse(userDataString);
      const userRole = userData.role || (userData.user && userData.user.role);
      const userId = userData.userId || userData.sellerId || userData.id || (userData.user && (userData.user.userId || userData.user.sellerId || userData.user.id));

      // If trying to access Seller routes, verify role is Seller
      if (state.url.startsWith('/sellers')) {
        if (userRole === 'Seller') {
          if (userId) {
            return authsService.getUserById(userId).pipe(
              map((res: any) => {
                const data = res.data || res;
                const status = (data.status || data.Status || '').toString().trim().toLowerCase();

                if (status === 'suspended' || status === 'inactive') {
                  router.navigate(['/seller-suspended']);
                  return false;
                }

                // Keep userData cached status in sync
                if (userData.user) {
                  userData.user.status = data.status || data.Status;
                } else {
                  userData.status = data.status || data.Status;
                }
                localStorage.setItem('userData', JSON.stringify(userData));

                return true;
              }),
              catchError((err) => {
                console.error('Error checking seller status in AuthGuard, falling back to local data', err);
                const localStatus = (userData.status || (userData.user && userData.user.status) || '').toString().trim().toLowerCase();
                if (localStatus === 'suspended' || localStatus === 'inactive') {
                  router.navigate(['/seller-suspended']);
                  return of(false);
                }
                return of(true);
              })
            );
          }

          // Fallback to local storage if userId not found
          const localStatus = (userData.status || (userData.user && userData.user.status) || '').toString().trim().toLowerCase();
          if (localStatus === 'suspended' || localStatus === 'inactive') {
            router.navigate(['/seller-suspended']);
            return false;
          }
          return true;
        } else {
          // Admin or Customer trying to access Seller -> Block & redirect
          router.navigate(['/login']);
          return false;
        }
      }

      // If trying to access Admin routes, verify role is Admin
      if (state.url.startsWith('/admin')) {
        if (userRole === 'Admin') {
          return true;
        } else {
          // Seller or Customer trying to access Admin -> Block & redirect
          router.navigate(['/login']);
          return false;
        }
      }

      return true;
    } catch (e) {
      console.error('Error parsing user data from localStorage', e);
    }
  }

  // Not logged in
  router.navigate(['/login']);
  return false;
};