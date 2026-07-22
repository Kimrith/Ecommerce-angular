import { Routes } from "@angular/router";
import { AdminLayout } from "../../../layout/admin-layout/admin-layout/admin-layout";
import { Dashboard } from "../../../pages/admin/dashboard/dashboard";
import { Products } from "../../../pages/admin/products/products";
import { Categories } from "../../../pages/admin/categories/categories";


export const adminRoutes: Routes = [
    {
        path: 'admin',
        component: AdminLayout,
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
            }
        ]
    }
]