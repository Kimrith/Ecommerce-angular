import { Component } from '@angular/core';
import { ProductCart } from '../../../components/main/product-cart/product-cart';
import { Pagination } from '../../../shared/components/main-layout/pagination/pagination';
import { Sidebar } from '../../../layout/main-layout/sidebar/sidebar';
import { Banner } from '../../../shared/components/main-layout/banner/banner';

@Component({
  selector: 'app-dashboard',
  imports: [ProductCart,
    Pagination, 
    Banner
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {}
