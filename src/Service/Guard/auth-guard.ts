import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auths } from '../Auth/auths';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export const AuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authsService = inject(Auths);
  const token = localStorage.getItem('authToken');
  const userDataString = localStorage.getItem('userData');

  if (token && userDataString) {
    try {
      const userData = JSON.parse(userDataString);
      const userRole = userData.role || (userData.user && userData.user.role);
      const userId = userData.userId || userData.id || (userData.user && (userData.user.userId || userData.user.id));

      // If trying to access Admin routes, verify role is Admin
      if (state.url.startsWith('/admin')) {
        if (userRole === 'Admin') {
          return true;
        } else {
          // Seller or Customer trying to access Admin -> Block & redirect
          router.navigate(['login']);
          return false;
        }
      }

      // If trying to access Seller routes, verify role is Seller
      if (state.url.startsWith('/sellers')) {
        if (userRole === 'Seller') {
          if (userId) {
            return authsService.getUserById(Number(userId)).pipe(
              map((res: any) => {
                const data = res?.data || res;
                const status = (data?.status || data?.Status || '').toString().trim().toLowerCase();

                // Update status in localStorage to keep it sync
                const updatedUserData = { ...userData };
                if (updatedUserData.user) {
                  updatedUserData.user.status = data?.status || updatedUserData.user.status;
                } else {
                  updatedUserData.status = data?.status || updatedUserData.status;
                }
                localStorage.setItem('userData', JSON.stringify(updatedUserData));

                if (status === 'suspended' || status === 'inactive') {
                  router.navigate(['seller-suspended']);
                  return false;
                }
                return true;
              }),
              catchError((error) => {
                console.error('Error verifying seller status', error);
                if (error.status === 401 || error.status === 403) {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userData');
                  router.navigate(['login']);
                  return of(false);
                }
                // Fallback to local storage on network/server errors
                const status = (userData.status || (userData.user && userData.user.status) || '').toString().trim().toLowerCase();
                if (status === 'suspended' || status === 'inactive') {
                  router.navigate(['seller-suspended']);
                  return of(false);
                }
                return of(true);
              })
            );
          }

          // Fallback to local storage status check if userId is not found
          const status = (userData.status || (userData.user && userData.user.status) || '').toString().trim().toLowerCase();
          if (status === 'suspended' || status === 'inactive') {
            router.navigate(['seller-suspended']);
            return false;
          }
          return true;
        } else {
          // Admin or Customer trying to access Seller -> Block & redirect
          router.navigate(['login']);
          return false;
        }
      }

      // If Customer, verify status is active
      if (userRole === 'Customer') {
        if (userId) {
          return authsService.getUserById(Number(userId)).pipe(
            map((res: any) => {
              const data = res?.data || res;
              const status = (data?.status || data?.Status || '').toString().trim().toLowerCase();

              // Update status in localStorage to keep it sync
              const updatedUserData = { ...userData };
              if (updatedUserData.user) {
                updatedUserData.user.status = data?.status || updatedUserData.user.status;
              } else {
                updatedUserData.status = data?.status || updatedUserData.status;
              }
              localStorage.setItem('userData', JSON.stringify(updatedUserData));

              if (status === 'suspended' || status === 'inactive') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                router.navigate(['customer-suspended']);
                return false;
              }
              return true;
            }),
            catchError((error) => {
              console.error('Error verifying customer status', error);
              if (error.status === 401 || error.status === 403) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                router.navigate(['login']);
                return of(false);
              }
              // Fallback to local storage on network/server errors
              const status = (userData.status || (userData.user && userData.user.status) || '').toString().trim().toLowerCase();
              if (status === 'suspended' || status === 'inactive') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                router.navigate(['customer-suspended']);
                return of(false);
              }
              return of(true);
            })
          );
        }

        // Fallback to local storage check
        const status = (userData.status || (userData.user && userData.user.status) || '').toString().trim().toLowerCase();
        if (status === 'suspended' || status === 'inactive') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          router.navigate(['customer-suspended']);
          return false;
        }
        return true;
      }

      return true;
    } catch (e) {
      console.error('Error parsing user data from localStorage', e);
    }
  }

  // Not logged in
  router.navigate(['login']);
  return false;
};