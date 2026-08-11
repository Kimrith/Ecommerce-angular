import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../../Service/Coupon/coupon';
import { Coupon as CouponModel, CouponType } from '../../../type/coupon';
import { Pagination } from '../../../shared/components/admin/pagination/pagination';
import { ToastComponent } from '../../../shared/components/toast';

@Component({
  selector: 'app-coupon',
  standalone: true,
  imports: [CommonModule, FormsModule, Pagination, ToastComponent],
  templateUrl: './coupon.html',
  styleUrl: './coupon.css',
})
export class Coupon implements OnInit {
  allCoupons: CouponModel[] = [];
  coupons: CouponModel[] = [];
  paginatedCoupons: CouponModel[] = [];

  // Statistics
  stats = {
    total: 0,
    active: 0,
    expiredOrInactive: 0
  };

  // Pagination states
  pageNumber: number = 1;
  pageSize: number = 6;
  totalItems: number = 0;
  totalPages: number = 1;

  // Filters & Search
  searchTerm: string = '';
  selectedType: string = ''; // '', '0', '1', '2'
  selectedStatus: string = ''; // '', 'active', 'inactive'

  // Modal & Form states
  showAddCouponModal = false;
  selectedCouponToEdit: CouponModel | null = null;

  couponForm = {
    code: '',
    description: '',
    discountType: CouponType.Percentage as CouponType,
    discountValue: 0,
    minimumAmount: null as number | null,
    maximumDiscountAmount: null as number | null,
    usageLimit: null as number | null,
    usageLimitPerUser: null as number | null,
    isActive: true,
    startsAt: '',
    expiresAt: ''
  };

  // Toast notifications
  showSuccessToast = false;
  toastMessage = '';

  constructor(
    private couponService: CouponService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCoupons();
  }

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showSuccessToast = false;
    setTimeout(() => {
      this.showSuccessToast = true;
      this.cdr.detectChanges();
    }, 50);
  }

  loadCoupons() {
    this.couponService.getCoupons().subscribe({
      next: (data) => {
        this.allCoupons = data;
        this.calculateStats();
        this.applyFilters(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading coupons:', error);
      }
    });
  }

  calculateStats() {
    const now = new Date();
    this.stats.total = this.allCoupons.length;
    this.stats.active = this.allCoupons.filter(c => {
      if (!c.isActive) return false;
      if (c.expiresAt && new Date(c.expiresAt) < now) return false;
      if (c.startsAt && new Date(c.startsAt) > now) return false;
      if (c.usageLimit && c.timesUsed >= c.usageLimit) return false;
      return true;
    }).length;
    this.stats.expiredOrInactive = this.stats.total - this.stats.active;
  }

  applyFilters(resetPage: boolean = true) {
    if (resetPage) {
      this.pageNumber = 1;
    }

    const now = new Date();
    let temp = [...this.allCoupons];

    // Search filter (code or description)
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase().trim();
      temp = temp.filter(c => 
        c.code.toLowerCase().includes(search) || 
        (c.description && c.description.toLowerCase().includes(search))
      );
    }

    // Discount type filter
    if (this.selectedType !== '') {
      temp = temp.filter(c => c.discountType === this.selectedType);
    }

    // Status filter
    if (this.selectedStatus !== '') {
      const isFilterActive = this.selectedStatus === 'active';
      temp = temp.filter(c => {
        const isCouponActive = c.isActive && 
          (!c.expiresAt || new Date(c.expiresAt) >= now) &&
          (!c.startsAt || new Date(c.startsAt) <= now) &&
          (!c.usageLimit || c.timesUsed < c.usageLimit);
        return isCouponActive === isFilterActive;
      });
    }

    this.coupons = temp;
    this.totalItems = temp.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;

    if (this.pageNumber > this.totalPages) {
      this.pageNumber = this.totalPages;
    }

    this.updatePaginatedCoupons();
  }

  updatePaginatedCoupons() {
    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedCoupons = this.coupons.slice(start, end);
  }

  onPageChange(newPage: number) {
    this.pageNumber = newPage;
    this.updatePaginatedCoupons();
    this.cdr.detectChanges();
  }

  getCouponTypeLabel(type: CouponType): string {
    switch (type) {
      case CouponType.Percentage: return 'Percentage';
      case CouponType.FixedAmount: return 'Fixed Amount';
      case CouponType.FreeShipping: return 'Free Shipping';
      default: return 'Unknown';
    }
  }

  getCouponStatusLabel(coupon: CouponModel): string {
    const now = new Date();
    if (!coupon.isActive) return 'Inactive';
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return 'Expired';
    if (coupon.startsAt && new Date(coupon.startsAt) > now) return 'Upcoming';
    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) return 'Limit Exceeded';
    return 'Active';
  }

  openAddModal() {
    this.selectedCouponToEdit = null;
    this.couponForm = {
      code: '',
      description: '',
      discountType: CouponType.Percentage,
      discountValue: 0,
      minimumAmount: null,
      maximumDiscountAmount: null,
      usageLimit: null,
      usageLimitPerUser: null,
      isActive: true,
      startsAt: '',
      expiresAt: ''
    };
    this.showAddCouponModal = true;
  }

  openEditModal(coupon: CouponModel) {
    this.selectedCouponToEdit = coupon;

    const formatDateTimeLocal = (dateStr?: string): string => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
      return localISOTime;
    };

    this.couponForm = {
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumAmount: coupon.minimumAmount ?? null,
      maximumDiscountAmount: coupon.maximumDiscountAmount ?? null,
      usageLimit: coupon.usageLimit ?? null,
      usageLimitPerUser: coupon.usageLimitPerUser ?? null,
      isActive: coupon.isActive,
      startsAt: formatDateTimeLocal(coupon.startsAt),
      expiresAt: formatDateTimeLocal(coupon.expiresAt)
    };
    this.showAddCouponModal = true;
  }

  closeModal() {
    this.showAddCouponModal = false;
    this.selectedCouponToEdit = null;
  }

  private getErrorMessage(err: any, defaultMsg: string): string {
    if (!err || !err.error) return defaultMsg;
    if (err.error.message || err.error.Message) {
      return err.error.message || err.error.Message;
    }
    if (err.error.errors) {
      const validationErrors = [];
      for (const key in err.error.errors) {
        if (err.error.errors.hasOwnProperty(key)) {
          validationErrors.push(...err.error.errors[key]);
        }
      }
      if (validationErrors.length > 0) {
        return validationErrors.join(' ');
      }
    }
    return defaultMsg;
  }

  saveCoupon() {
    // Validations
    if (!this.couponForm.code.trim()) {
      this.triggerToast('Coupon Code is required.');
      return;
    }
    if (this.couponForm.discountType !== CouponType.FreeShipping && this.couponForm.discountValue <= 0) {
      this.triggerToast('Discount Value must be greater than 0.');
      return;
    }
    if (this.couponForm.discountType === CouponType.Percentage && this.couponForm.discountValue > 100) {
      this.triggerToast('Percentage discount cannot exceed 100%.');
      return;
    }

    const payload: any = {
      code: this.couponForm.code.trim().toUpperCase(),
      description: this.couponForm.description.trim(),
      discountType: this.couponForm.discountType,
      // C# backend validates that DiscountValue must be >= 0.01. For FreeShipping, we send a dummy value of 1.
      discountValue: this.couponForm.discountType === CouponType.FreeShipping ? 1 : Number(this.couponForm.discountValue),
      minimumAmount: this.couponForm.minimumAmount ? Number(this.couponForm.minimumAmount) : null,
      maximumDiscountAmount: this.couponForm.maximumDiscountAmount ? Number(this.couponForm.maximumDiscountAmount) : null,
      usageLimit: this.couponForm.usageLimit ? Number(this.couponForm.usageLimit) : null,
      usageLimitPerUser: this.couponForm.usageLimitPerUser ? Number(this.couponForm.usageLimitPerUser) : null,
      isActive: this.couponForm.isActive,
      startsAt: this.couponForm.startsAt ? new Date(this.couponForm.startsAt).toISOString() : null,
      expiresAt: this.couponForm.expiresAt ? new Date(this.couponForm.expiresAt).toISOString() : null
    };

    if (this.selectedCouponToEdit) {
      payload.id = this.selectedCouponToEdit.id;
      this.couponService.updateCoupon(this.selectedCouponToEdit.id, payload).subscribe({
        next: () => {
          this.triggerToast('Coupon updated successfully!');
          this.closeModal();
          this.loadCoupons();
        },
        error: (err) => {
          console.error('Error updating coupon:', err);
          this.triggerToast(this.getErrorMessage(err, 'Failed to update coupon.'));
        }
      });
    } else {
      this.couponService.postCoupon(payload).subscribe({
        next: () => {
          this.triggerToast('Coupon created successfully!');
          this.closeModal();
          this.loadCoupons();
        },
        error: (err) => {
          console.error('Error creating coupon:', err);
          this.triggerToast(this.getErrorMessage(err, 'Failed to create coupon.'));
        }
      });
    }
  }

  deleteCoupon(coupon: CouponModel) {
    if (confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
      this.couponService.deleteCoupon(coupon.id).subscribe({
        next: () => {
          this.triggerToast('Coupon deleted successfully!');
          this.loadCoupons();
        },
        error: (err) => {
          console.error('Error deleting coupon:', err);
          this.triggerToast('Failed to delete coupon.');
        }
      });
    }
  }
}
