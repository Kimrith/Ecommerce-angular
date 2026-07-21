import { Routes } from '@angular/router';
import { MainLayout } from '../../../layout/main-layout/main-layout/main-layout';
import { Dashboard } from '../../../pages/main/dashboard/dashboard';
import { About } from '../../../pages/main/about/about';
import { Contact } from '../../../pages/main/contact/contact';
import { Setting } from '../../../pages/main/setting/setting';
import { Order } from '../../../pages/main/order/order';
import { Paymentmethod } from '../../../pages/main/paymentmethod/paymentmethod';

export const routes: Routes = [
    {
        path: '',
        component: Dashboard
    },
    {
        path: "about",
        component: About
    },
    {
        path: "contact",
        component: Contact
    },
    {
        path: "setting",
        component: Setting
    },
    {
        path: "orders",
        component: Order
    },
    {
        path: 'paymentmethod',
        component: Paymentmethod
    }
];