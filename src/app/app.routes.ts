import { Routes } from '@angular/router';
import { mainRoutes } from './routes/main/main.route';
import { adminRoutes } from './routes/admin/admin.route';



export const routes: Routes = [
  ...mainRoutes,
  ...adminRoutes
];