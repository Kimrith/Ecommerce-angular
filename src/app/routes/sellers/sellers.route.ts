import { Routes } from "@angular/router";
import { Dashboard } from "../../../pages/sellers/dashboard/dashboard";
import { Products } from "../../../pages/sellers/products/products";
import { Categories } from "../../../pages/sellers/categories/categories";
import { Orders } from "../../../pages/sellers/orders/orders";
import { Setting } from "../../../pages/sellers/setting/setting";
import { Payments } from "../../../pages/sellers/payments/payments";
import { SellersLayout } from "../../../layout/sellers-layout/sellers-layout/sellers-layout";
import { Feedback } from "../../../pages/sellers/feedback/feedback";
import { AuthGuard } from "../../../Service/Guard/auth-guard";
import { Login } from "../../../shared/auth/login/login";
import { Suspended } from "../../../pages/sellers/suspended/suspended";


export const sellersRoutes: Routes = [
    {
        path: 'sellers',
        component: SellersLayout,
        canActivate: [AuthGuard], // for seller
        children: [
            {
                path: '',
                component: Dashboard
            },
            {
                path: 'products',
                component: Products
            },
            {
                path: 'categories',
                component: Categories
            },
            {
                path: 'orders',
                component: Orders
            },
            {
                path: 'setting',
                component: Setting
            },
            {
                path: 'payments',
                component: Payments
            },
            {
                path: 'feedback',
                component: Feedback
            },
        ]
    },
    {
        path: 'seller-suspended',
        component: Suspended // Route to show when suspended
    },
    {
        path: "login",
        component: Login
    }
]