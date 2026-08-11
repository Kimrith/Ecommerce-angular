import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auths } from '../../../Service/Auth/auths';
import { AddressService } from '../../../Service/Address/address-service';
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
  // User Profile
  userId: number = 0;
  fullName: string = '';
  email: string = '';
  phoneNumber: string = '';
  profileImageUrl: string = '';
  imageUrl = environment.apiUrl;

  selectedFile: File | null = null;
  imagePreview: string | null = null;

  // Password Update
  newPassword = '';
  confirmPassword = '';

  // Addresses
  addresses: any[] = [];
  isLoadingAddresses = false;

  // Address Form (Modal / inline editor)
  showAddressForm = false;
  isEditingAddress = false;
  editingAddressId: number | null = null;

  // Address fields
  streetAddress = '';
  city = '';
  country = 'Cambodia';
  postalCode = '';
  addressType = 'Shipping';
  isDefault = false;

  // Toast
  showToast = false;
  toastMessage = '';
  
  // Loading states
  isSavingProfile = false;
  isUpdatingPassword = false;
  isSavingAddress = false;

  constructor(
    private authsService: Auths,
    private addressService: AddressService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showToast = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = true;
      this.cdr.detectChanges();
    }, 10);
  }

  loadUserProfile() {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const userData = JSON.parse(userDataStr);
      this.userId = userData.userId || userData.id;

      if (this.userId) {
        // Load fresh user data from server
        this.authsService.getUserById(this.userId).subscribe({
          next: (user: any) => {
            this.fullName = user.fullName || '';
            this.email = user.email || '';
            this.phoneNumber = user.phoneNumber || '';
            this.profileImageUrl = user.profileImageUrl || '';
            
            // Sync local storage if name or image changed on server
            userData.fullName = this.fullName;
            userData.email = this.email;
            userData.profileImageUrl = this.profileImageUrl;
            userData.phoneNumber = this.phoneNumber;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            this.loadAddresses();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Failed to load profile details from server', err);
            // Fallback to local storage
            this.fullName = userData.fullName || '';
            this.email = userData.email || '';
            this.phoneNumber = userData.phoneNumber || '';
            this.profileImageUrl = userData.profileImageUrl || '';
            this.loadAddresses();
            this.cdr.detectChanges();
          }
        });
      }
    } catch (e) {
      console.error(e);
      this.router.navigate(['/login']);
    }
  }

  loadAddresses() {
    if (!this.userId) return;
    this.isLoadingAddresses = true;
    this.cdr.detectChanges();

    this.addressService.getUserAddresses(this.userId).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.addresses = res;
        } else if (res && Array.isArray(res.$values)) {
          this.addresses = res.$values;
        } else if (res && Array.isArray(res.data)) {
          this.addresses = res.data;
        } else {
          this.addresses = [];
        }
        this.isLoadingAddresses = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load addresses', err);
        this.isLoadingAddresses = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    if (!this.fullName.trim() || !this.email.trim()) {
      this.triggerToast('Name and Email are required.');
      return;
    }

    this.isSavingProfile = true;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('FullName', this.fullName);
    formData.append('Email', this.email);
    formData.append('PhoneNumber', this.phoneNumber || '');
    
    // Status is active for logged-in users
    formData.append('Status', 'Active');

    if (this.selectedFile) {
      formData.append('ProfileImage', this.selectedFile);
    }

    this.authsService.updateUserById(this.userId, formData).subscribe({
      next: (res: any) => {
        this.isSavingProfile = false;
        this.triggerToast('Profile updated successfully!');
        
        // Update local storage
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userData.fullName = this.fullName;
          userData.email = this.email;
          userData.phoneNumber = this.phoneNumber;
          if (res.profileImageUrl) {
            userData.profileImageUrl = res.profileImageUrl;
            this.profileImageUrl = res.profileImageUrl;
          }
          localStorage.setItem('userData', JSON.stringify(userData));
        }

        // Notify Navbar to update dynamic avatar
        window.dispatchEvent(new Event('cartUpdated')); 
        this.imagePreview = null;
        this.selectedFile = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingProfile = false;
        this.triggerToast(err.error?.message || 'Failed to update profile.');
        this.cdr.detectChanges();
      }
    });
  }

  updatePassword() {
    if (!this.newPassword) {
      this.triggerToast('New password is required.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.triggerToast('Password must be at least 6 characters.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.triggerToast('Passwords do not match.');
      return;
    }

    this.isUpdatingPassword = true;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('FullName', this.fullName);
    formData.append('Email', this.email);
    formData.append('PhoneNumber', this.phoneNumber || '');
    formData.append('Password', this.newPassword);
    formData.append('ConfirmPassword', this.confirmPassword);
    formData.append('Status', 'Active');

    this.authsService.updateUserById(this.userId, formData).subscribe({
      next: () => {
        this.isUpdatingPassword = false;
        this.newPassword = '';
        this.confirmPassword = '';
        this.triggerToast('Password updated successfully!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUpdatingPassword = false;
        this.triggerToast(err.error?.message || 'Failed to update password.');
        this.cdr.detectChanges();
      }
    });
  }

  // Address CRUD
  openNewAddressForm() {
    this.isEditingAddress = false;
    this.editingAddressId = null;
    this.streetAddress = '';
    this.city = '';
    this.country = 'Cambodia';
    this.postalCode = '';
    this.addressType = 'Shipping';
    this.isDefault = this.addresses.length === 0; // Default if first address
    this.showAddressForm = true;
    this.cdr.detectChanges();
  }

  openEditAddressForm(address: any) {
    this.isEditingAddress = true;
    this.editingAddressId = address.id;
    this.streetAddress = address.streetAddress || '';
    this.city = address.city || '';
    this.country = address.country || 'Cambodia';
    this.postalCode = address.postalCode || '';
    this.addressType = address.addressType || 'Shipping';
    this.isDefault = address.isDefault || false;
    this.showAddressForm = true;
    this.cdr.detectChanges();
  }

  closeAddressForm() {
    this.showAddressForm = false;
    this.cdr.detectChanges();
  }

  saveAddress() {
    if (!this.streetAddress.trim() || !this.city.trim() || !this.country.trim()) {
      this.triggerToast('Street, City, and Country are required.');
      return;
    }

    this.isSavingAddress = true;
    this.cdr.detectChanges();

    const addressPayload = {
      streetAddress: this.streetAddress.trim(),
      city: this.city.trim(),
      country: this.country.trim(),
      postalCode: this.postalCode.trim() || '12000',
      addressType: this.addressType,
      isDefault: this.isDefault
    };

    if (this.isEditingAddress && this.editingAddressId) {
      // Edit
      this.addressService.updateAddress(this.editingAddressId, this.userId, addressPayload).subscribe({
        next: () => {
          this.isSavingAddress = false;
          this.showAddressForm = false;
          this.triggerToast('Address updated successfully!');
          this.loadAddresses();
        },
        error: (err) => {
          this.isSavingAddress = false;
          this.triggerToast(err.error?.message || 'Failed to update address.');
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create
      this.addressService.createAddress(this.userId, addressPayload).subscribe({
        next: () => {
          this.isSavingAddress = false;
          this.showAddressForm = false;
          this.triggerToast('Address added successfully!');
          this.loadAddresses();
        },
        error: (err) => {
          this.isSavingAddress = false;
          this.triggerToast(err.error?.message || 'Failed to add address.');
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteAddress(addressId: number) {
    if (!confirm('Are you sure you want to delete this address?')) return;

    this.addressService.deleteAddress(addressId, this.userId).subscribe({
      next: () => {
        this.triggerToast('Address deleted successfully!');
        this.loadAddresses();
      },
      error: (err) => {
        console.error(err);
        this.triggerToast('Failed to delete address.');
      }
    });
  }

  setAddressAsDefault(address: any) {
    if (address.isDefault) return;

    const addressPayload = {
      streetAddress: address.streetAddress,
      city: address.city,
      country: address.country,
      postalCode: address.postalCode,
      addressType: address.addressType,
      isDefault: true
    };

    this.addressService.updateAddress(address.id, this.userId, addressPayload).subscribe({
      next: () => {
        this.triggerToast('Default address updated!');
        this.loadAddresses();
      },
      error: (err) => {
        console.error(err);
        this.triggerToast('Failed to set address as default.');
      }
    });
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('cart');
    
    // Notify Navbar to reset counts
    window.dispatchEvent(new Event('cartUpdated'));

    this.triggerToast('Logged out successfully!');
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1000);
  }

  deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action is permanent and cannot be undone!')) {
      return;
    }
    // Suspend user on backend and log out
    this.authsService.suspendUser(this.userId).subscribe({
      next: () => {
        this.logout();
      },
      error: (err) => {
        console.error(err);
        this.triggerToast('Failed to delete account. Please try again.');
      }
    });
  }
}
