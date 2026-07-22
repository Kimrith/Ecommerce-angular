import { Component } from '@angular/core';
import { ProductTables } from '../../../components/admin/product-tables/product-tables';

@Component({
  selector: 'app-products',
  imports: [ProductTables],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {}
