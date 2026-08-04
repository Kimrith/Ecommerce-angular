import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const AuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('authToken');
  const userDataString = localStorage.getItem('userData');

  if (token && userDataString) {
    try {
      const userData = JSON.parse(userDataString);
      const userRole = userData.role;

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
          return true;
        } else {
          // Admin or Customer trying to access Seller -> Block & redirect
          router.navigate(['login']);
          return false;
        }
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