import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddSellerFormModel } from '../../../components/admin/add-seller-form-model/add-seller-form-model';
import { Auths } from '../../../Service/Auth/auths';
import { environment } from '../../../environments/environment.development';
import { ToastComponent } from '../../../shared/components/toast';
import { SellerViewDetail } from '../../../components/admin/seller-view-detail/seller-view-detail';
import { Pagination } from '../../../shared/components/admin/pagination/pagination';

@Component({
  selector: 'app-seller',
  standalone: true,
  imports: [CommonModule, AddSellerFormModel, FormsModule, ToastComponent,
    SellerViewDetail, Pagination
  ],
  templateUrl: './seller.html',
  styleUrl: './seller.css',
})
export class Seller implements OnInit {
  showAddSellerModal = false;
  allSellers: any[] = [];
  sellers: any[] = [];
  paginatedSellers: any[] = [];
  imageUrl = environment.apiUrl;

  // Pagination states
  pageNumber: number = 1;
  pageSize: number = 7;
  totalItems: number = 0;
  totalPages: number = 1;

  // Track the seller selected for editing
  selectedSellerForEdit: any = null;

  showDetailModal = false;
  selectedSellerDetails: any = null;

  showSuccessToast = false;
  toastMessage = '';

  // Filter & Search state variables
  searchTerm: string = '';
  selectedStatus: string = '';

  stats = {
    totalSellers: 0,
    activeSellers: 0,
    suspendedSellers: 0
  };

  constructor(
    private authService: Auths,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadSellers();
  }

  // Helper method to trigger the toast anywhere you want
  triggerToast(message: string) {
    this.toastMessage = message;
    this.showSuccessToast = false; // Reset to re-trigger animation if triggered back-to-back
    setTimeout(() => {
      this.showSuccessToast = true;
      this.cdr.detectChanges();
    }, 50);
  }

  loadSellers() {
    this.authService.getAllseller().subscribe({
      next: (data) => {
        console.log('Raw sellers data from API:', data);
        let rawSellers = [];
        if (Array.isArray(data)) {
          rawSellers = data;
        } else if (data) {
          if (Array.isArray(data.$values)) {
            rawSellers = data.$values;
          } else if (data.sellers) {
            rawSellers = Array.isArray(data.sellers) ? data.sellers : (data.sellers.$values || []);
          } else if (data.data) {
            rawSellers = Array.isArray(data.data) ? data.data : (data.data.$values || []);
          } else {
            rawSellers = [data];
          }
        }
        this.allSellers = rawSellers;
        console.log('Processed allSellers:', this.allSellers);
        this.calculateStats();
        this.applyFilters(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading sellers:', err);
      }
    });
  }

  calculateStats() {
    this.stats.totalSellers = this.allSellers.length;
    this.stats.activeSellers = this.allSellers.filter(s => this.getStatusValue(s.status) === 'Active').length;
    this.stats.suspendedSellers = this.allSellers.filter(s => this.getStatusValue(s.status) === 'Suspended').length;
  }

  getStatusValue(statusStr: any): string {
    if (!statusStr) return '';
    const s = statusStr.toString().trim().toLowerCase();
    if (s === 'active') return 'Active';
    if (s === 'suspended' || s === 'inactive') return 'Suspended';
    return statusStr.toString().trim();
  }

  applyFilters(resetPage: boolean = true) {
    if (resetPage) {
      this.pageNumber = 1;
    }

    let temp = [...this.allSellers];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase().trim();
      temp = temp.filter(seller =>
        (seller.fullName && seller.fullName.toLowerCase().includes(search)) ||
        (seller.shopName && seller.shopName.toLowerCase().includes(search)) ||
        (seller.email && seller.email.toLowerCase().includes(search))
      );
    }

    if (this.selectedStatus && this.selectedStatus !== '') {
      const statusVal = this.selectedStatus.toLowerCase();
      temp = temp.filter(seller => {
        const sStatus = (seller.status || '').toLowerCase();
        if (statusVal === 'active') {
          return sStatus === 'active';
        } else if (statusVal === 'suspended') {
          return sStatus === 'suspended' || sStatus === 'inactive';
        }
        return sStatus === statusVal;
      });
    }

    this.sellers = temp;
    this.totalItems = temp.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;

    // Reset/Clamp pageNumber if it exceeds totalPages
    if (this.pageNumber > this.totalPages) {
      this.pageNumber = this.totalPages;
    }

    this.updatePaginatedSellers();
  }

  updatePaginatedSellers() {
    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedSellers = this.sellers.slice(start, end);
    console.log('Paginated sellers for current page:', this.paginatedSellers);
  }

  onPageChange(newPage: number) {
    this.pageNumber = newPage;
    this.updatePaginatedSellers();
    this.cdr.detectChanges();
  }

  suspendSeller(sellerId: number) {
    this.authService.suspendSeller(sellerId).subscribe({
      next: () => {
        this.triggerToast('Seller suspended successfully!');
        this.loadSellers();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error suspending seller:', err)
    });
  }

  reactivateSeller(sellerId: number) {
    this.authService.reactivateSeller(sellerId).subscribe({
      next: () => {
        this.triggerToast('Seller reactivated successfully!');
        this.loadSellers();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error reactivating seller:', err)
    });
  }

  // Open modal for creating a new seller
  openAddSellerModal() {
    this.selectedSellerForEdit = null; // Clear out data for create mode
    this.showAddSellerModal = true;
  }

  // Open modal for editing an existing seller
  editSeller(sellerId: number) {
    const foundSeller = this.allSellers.find(s => s.userId === sellerId);
    if (foundSeller) {
      this.selectedSellerForEdit = foundSeller;
      this.showAddSellerModal = true;
    }
  }

  viewSeller(userId: number) {
    const found = this.allSellers.find(s => s.userId === userId);
    if (found) {
      this.selectedSellerDetails = found;
      this.showDetailModal = true;
      this.cdr.detectChanges();
    }
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedSellerDetails = null;
    this.cdr.detectChanges();
  }

  closeAddSellerModal() {
    this.showAddSellerModal = false;
    this.selectedSellerForEdit = null;
    this.loadSellers();
  }

  searchSellers() {
    this.applyFilters(true);
    this.cdr.detectChanges();
  }

  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.applyFilters(true);
    this.cdr.detectChanges();
  }
}