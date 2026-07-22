import { Component } from '@angular/core';
import { ProductCart } from '../product-cart/product-cart';
import { Pagination } from '../../../shared/components/main-layout/pagination/pagination';

@Component({
  selector: 'app-category-detail',
  imports: [ProductCart, Pagination],
  templateUrl: './category-detail.html',
  styleUrl: './category-detail.css',
})
export class CategoryDetail {
  imgs = [
    {
      id: 1,
      img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1600'
    },
  ];
}
