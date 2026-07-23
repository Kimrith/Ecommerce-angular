import { Routes } from '@angular/router';
import { mainRoutes } from './routes/main/main.route';
import { sellersRoutes } from './routes/sellers/sellers.route';



export const routes: Routes = [
  ...mainRoutes,
  ...sellersRoutes
];