// main.route.ts

import { Routes } from '@angular/router';
import { MainLayout } from '../../../layout/main-layout/main-layout/main-layout';
import { Dashboard } from '../../../pages/main/dashboard/dashboard';
import { About } from '../../../pages/main/about/about';
import { Contact } from '../../../pages/main/contact/contact';
import { Setting } from '../../../pages/main/setting/setting';
import { Order } from '../../../pages/main/order/order';
import { Paymentmethod } from '../../../pages/main/paymentmethod/paymentmethod';
import { CategoryDetail } from '../../../components/main/category-detail/category-detail';
import { Products } from '../../../components/main/products/products';
import { ProductDetail } from '../../../components/main/product-detail/product-detail';
import { Register } from '../../../shared/auth/register/register';
import { Login } from '../../../shared/auth/login/login';
import { Error } from '../../../shared/components/error/error';
import { OrderList } from '../../../components/main/order-list/order-list';
import { Favorite } from '../../../components/main/favorite/favorite';


export const mainRoutes: Routes = [

  {
    path: '',
    component: MainLayout,
    children: [

      {
        path: '',
        component: Dashboard
      },

      {
        path: 'about',
        component: About
      },

      {
        path: 'contact',
        component: Contact
      },

      {
        path: 'setting',
        component: Setting
      },

      {
        path: 'orders',
        component: Order
      },

      {
        path: 'paymentmethod',
        component: Paymentmethod
      },

      {
        path: 'categories/:id',
        component: CategoryDetail
      },

      {
        path: 'products/:id',
        component: ProductDetail
      },

      {
        path: 'products',
        component: Products
      },

      {
        path: 'order/list',
        component: OrderList
      },

      {
        path: 'favorite',
        component: Favorite
      }
    ]
  },


  {
    path: 'register',
    component: Register
  },

  {
    path: 'login',
    component: Login
  },

  // {
  //   path: '**',
  //   component: Error
  // }

];