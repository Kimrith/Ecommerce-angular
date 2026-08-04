import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-seller-form-model',
  imports: [FormsModule],
  templateUrl: './add-seller-form-model.html',
  styleUrl: './add-seller-form-model.css',
})
export class AddSellerFormModel {
  @Output() close = new EventEmitter<void>();

  seller = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    role: 'Seller',
    status: 'Active',
    address: '',
    image: null,
  };

  saveSeller() {
    if (this.seller.password !== this.seller.confirmPassword) {
      alert('Password does not match!');
      return;
    }

    console.log(this.seller);
  }

  closeModal() {
    this.close.emit();
  }

  // Press ESC to close popup
  @HostListener('document:keydown.escape')
  handleEscape() {
    this.closeModal();
  }

  onFileSelected(event: any) {
    this.seller.image = event.target.files[0];
  }
}
