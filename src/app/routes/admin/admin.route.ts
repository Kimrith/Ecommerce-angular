import { Routes } from "@angular/router";
import { AdminLayout } from "../../../layout/admin/admin-layout/admin-layout";
import { Dashboard } from "../../../pages/admin/dashboard/dashboard";
import { Customer } from "../../../pages/admin/customer/customer";
import { Seller } from "../../../pages/admin/seller/seller";
import { Product } from "../../../pages/admin/product/product";
import { Categories } from "../../../pages/admin/categories/categories";
import { Order } from "../../../pages/admin/order/order";
import { Report } from "../../../pages/admin/report/report";
import { Setting } from "../../../pages/admin/setting/setting";
import { Payment } from "../../../pages/admin/payment/payment";
import { Login } from "../../../shared/auth/login/login";
import { AuthGuard } from "../../../Service/Guard/auth-guard";

export const adminRoutes: Routes = [
    {
        path: 'admin',
        component: AdminLayout,
        canActivate: [AuthGuard], // Protects all admin child routes
        children: [
            {
                path: '',
                component: Dashboard
            },
            {
                path: 'customer',
                component: Customer
            },
            {
                path: 'sellers',
                component: Seller
            },
            {
                path: "products",
                component: Product
            },
            {
                path: 'categories',
                component: Categories
            },
            {
                path: 'orders',
                component: Order
            },
            {
                path: 'reports',
                component: Report
            },
            {
                path: 'settings',
                component: Setting
            },
            {
                path: 'payments',
                component: Payment
            }
        ]
    },
    {
        path: 'login',
        component: Login
    }
];