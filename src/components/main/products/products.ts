import { Component } from '@angular/core';
import { ProductCart } from '../../../shared/components/main-layout/product-cart/product-cart';
import { Pagination } from '../../../shared/components/main-layout/pagination/pagination';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    ProductCart,
    Pagination
  ],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {}