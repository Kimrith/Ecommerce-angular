import { Routes } from '@angular/router';
import { MainLayout } from '../layout/main-layout/main-layout/main-layout';
import { Login } from '../pages/main/login/login';
import { Register } from '../pages/main/register/register';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./routes/main/main.route').then(m => m.routes)
      }
    ]
  },
  {
    path: 'auth/register',
    component: Register
  },
  {
    path: 'auth/login',
    component: Login
  }
];