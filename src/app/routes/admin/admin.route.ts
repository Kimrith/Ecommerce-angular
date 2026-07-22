import { Routes } from "@angular/router";
import { AdminLayout } from "../../../layout/admin-layout/admin-layout/admin-layout";
import { Dashboard } from "../../../pages/admin/dashboard/dashboard";


export const adminRoutes: Routes = [
    {
        path: 'admin',
        component: AdminLayout,
        children: [
            {
                path: '',
                component: Dashboard
            }
        ]
    }
]