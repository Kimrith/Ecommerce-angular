import { Component } from '@angular/core';
import { ProductTables } from '../../../components/sellers/product-tables/product-tables';
import { ProductFormModal } from '../../../components/sellers/product-form-modal/product-form-modal';

@Component({
  selector: 'app-products',
  imports: [ProductTables, ProductFormModal],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {
  showProductModal = false;

  openProductModal() {
    this.showProductModal = true;
  }

  closeProductModal() {
    this.showProductModal = false;
  }
}
