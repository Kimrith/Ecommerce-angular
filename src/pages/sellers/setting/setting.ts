import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auths } from '../../../Service/Auth/auths';
import { ToastComponent } from '../../../shared/components/toast';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './setting.html',
  styleUrl: './setting.css',
})
export class Setting implements OnInit {

  imgBaseUrl = environment.apiUrl;

  state: any = {
    userId: null,
    sellerId: null,
    fullName: '',
    email: '',
    phoneNumber: '',
    shopName: '',
    role: '',
    status: '',
    profileImageUrl: null,
    addresses: [],
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  sellerId: number = 0;
  selectedFile: File | null = null;

  // Toast states
  showToast = false;
  toastMessage = '';

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showToast = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = true;
      this.cdr.detectChanges();
    }, 10);
  }

  constructor(
    private auths: Auths,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      const currentUser = JSON.parse(userDataStr);
      this.sellerId = currentUser.userId || currentUser.sellerId || 0;
      if (this.sellerId) {
        this.getSellerById(this.sellerId);
      }
    }
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;

        // Generate a local preview URL immediately
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.state.profileImageUrl = e.target.result;
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      }
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getSellerById(id: number): void {
    this.auths.getUserById(id).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.state.userId = data.userId || data.UserId || null;
        this.state.sellerId = data.sellerId || data.SellerId || null;
        this.state.fullName = data.fullName || data.FullName || '';
        this.state.email = data.email || data.Email || '';
        this.state.phoneNumber = data.phoneNumber || data.PhoneNumber || '';
        this.state.shopName = data.shopName || data.ShopName || '';
        this.state.role = data.role || data.Role || '';
        this.state.status = data.status || data.Status || '';
        this.state.profileImageUrl = data.profileImageUrl || data.ProfileImageUrl || null;
        this.state.addresses = data.addresses || data.Addresses || [];

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch seller info', err);
      }
    });
  }

  updateSeller() {
    const formData = new FormData();
    formData.append('FullName', this.state.fullName);
    formData.append('Email', this.state.email);
    formData.append('PhoneNumber', this.state.phoneNumber);
    formData.append('ShopName', this.state.shopName || '');

    if (this.selectedFile) {
      formData.append('ProfileImage', this.selectedFile);
    }

    this.auths.updateUserById(this.sellerId, formData).subscribe({
      next: (res: any) => {
        console.log('Seller updated successfully', res);
        this.triggerToast('Profile updated successfully.');
        this.getSellerById(this.sellerId);
      },
      error: (err) => {
        console.error('Failed to update seller', err);
        this.triggerToast(err.error?.message || err.error?.Message || 'Failed to update profile.');
      }
    });
  }

  changePassword() {
    if (!this.state.newPassword) {
      this.triggerToast('New password cannot be empty.');
      return;
    }

    if (this.state.newPassword !== this.state.confirmPassword) {
      this.triggerToast('New passwords do not match.');
      return;
    }

    const formData = new FormData();
    formData.append('FullName', this.state.fullName);
    formData.append('Email', this.state.email);
    formData.append('PhoneNumber', this.state.phoneNumber);
    formData.append('ShopName', this.state.shopName || '');
    formData.append('Password', this.state.newPassword);
    formData.append('ConfirmPassword', this.state.confirmPassword);

    this.auths.updateUserById(this.sellerId, formData).subscribe({
      next: (res: any) => {
        console.log('Password updated successfully', res);
        this.triggerToast('Password changed successfully.');
        this.state.currentPassword = '';
        this.state.newPassword = '';
        this.state.confirmPassword = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to change password', err);
        this.triggerToast(err.error?.message || err.error?.Message || 'Failed to change password.');
      }
    });
  }
}