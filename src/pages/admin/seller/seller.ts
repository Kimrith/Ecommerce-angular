import { Component } from '@angular/core';
import { AddSellerPopup } from '../../../components/admin/add-seller-popup/add-seller-popup';

@Component({
  selector: 'app-seller',
  imports: [AddSellerPopup],
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