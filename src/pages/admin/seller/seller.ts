import { Component } from '@angular/core';
import { AddSellerFormModel } from '../../../components/admin/add-seller-form-model/add-seller-form-model';

@Component({
  selector: 'app-seller',
  imports: [AddSellerFormModel],
  templateUrl: './seller.html',
  styleUrl: './seller.css',
})
export class Seller {
  showAddSellerModal = false;

  openAddSellerModal() {
    this.showAddSellerModal = true;
  }

  closeAddSellerModal() {
    this.showAddSellerModal = false;
  }
}
