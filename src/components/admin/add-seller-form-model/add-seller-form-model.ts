import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auths } from '../../../Service/Auth/auths';
import { SellerForm } from '../../../type/auth';
import { ToastComponent } from '../../../shared/components/toast'; // Adjust path to your toast component
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-add-seller-form-model',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './add-seller-form-model.html',
  styleUrl: './add-seller-form-model.css',
})
export class AddSellerFormModel implements OnInit {
  @Input() sellerData: any | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() sellerAdded = new EventEmitter<any>();

  toastMessage = '';
  showSuccessToast = false;

  private authService = inject(Auths);
  private cdr = inject(ChangeDetectorRef);

  isEditMode = false;
  imageUrl = environment.apiUrl;
  defaultProfileImage = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-YKwoMPIgLj0eGd4fimf49IclMWAIbMJQRe_r21HTcJ0TCmDfQk9CJSU&s=10';

  seller: SellerForm = {
    firstName: '',
    lastName: '',
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

  isLoading = false;

  ngOnInit() {
    if (this.sellerData) {
      this.isEditMode = true;
      let fName = this.sellerData.firstName || '';
      let lName = this.sellerData.lastName || '';
      if (!fName && this.sellerData.fullName) {
        const parts = this.sellerData.fullName.trim().split(' ');
        fName = parts[0] || '';
        lName = parts.slice(1).join(' ') || '';
      }

      this.seller = {
        userId: this.sellerData.userId,
        firstName: fName,
        lastName: lName,
        email: this.sellerData.email || '',
        phone: this.sellerData.phoneNumber || this.sellerData.phone || '',
        password: '',
        confirmPassword: '',
        shopName: this.sellerData.shopName || '',
        role: this.sellerData.role || 'Seller',
        status: this.sellerData.status || 'Active',
        address: this.sellerData.address || '',
        image: this.sellerData.profileImageUrl || null,
      };
    }
  }

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showSuccessToast = false;
    setTimeout(() => {
      this.showSuccessToast = true;
      this.cdr.detectChanges();
    }, 50);
  }

  saveSeller() {
    if (!this.isEditMode || this.seller.password) {
      if (this.seller.password !== this.seller.confirmPassword) {
        this.triggerToast('Passwords do not match!');
        return;
      }
    }

    const formData = new FormData();
    formData.append('FirstName', this.seller.firstName);
    formData.append('LastName', this.seller.lastName);
    formData.append('FullName', `${this.seller.firstName} ${this.seller.lastName}`.trim());
    formData.append('Email', this.seller.email);
    formData.append('PhoneNumber', this.seller.phone);
    formData.append('Role', this.seller.role);
    formData.append('ShopName', this.seller.shopName);
    formData.append('Status', this.seller.status);
    formData.append('Address', this.seller.address);

    if (this.seller.password) {
      formData.append('Password', this.seller.password);
      formData.append('ConfirmPassword', this.seller.confirmPassword || '');
    }

    if (this.seller.image instanceof File) {
      formData.append('ProfileImage', this.seller.image);
    }

    this.isLoading = true;

    const request$ = this.isEditMode
      ? this.authService.updateSeller(this.seller.userId!, formData)
      : this.authService.register(formData);

    request$.subscribe({
      next: (response) => {
        this.sellerAdded.emit(response);
        this.closeModal();
      },
      error: (err) => {
        console.error('Error saving seller:', err);
        this.triggerToast(err?.error?.message || 'Failed to save seller. Please try again.');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  closeModal() {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    this.closeModal();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.seller.image = file;
    }
  }
}