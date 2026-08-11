import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BannerService } from '../../../Service/Banner/banner';
import { Banner as BannerType } from '../../../type/banner';
import { environment } from '../../../environments/environment.development';
import { Pagination } from '../../../shared/components/admin/pagination/pagination';
import { ToastComponent } from '../../../shared/components/toast';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, Pagination, ToastComponent],
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})
export class Banner implements OnInit {
  allBanners: BannerType[] = [];
  banners: BannerType[] = [];
  paginatedBanners: BannerType[] = [];
  imageUrl = environment.apiUrl;

  // Pagination states
  pageNumber: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;
  totalPages: number = 1;

  // Filter & Search states
  searchTerm: string = '';
  selectedStatus: string = ''; // '', 'active', 'inactive'
  selectedPosition: string = '';

  // Form Modal States
  showAddBannerModal = false;
  selectedBannerToEdit: BannerType | null = null;
  existingImageUrl: string | null = null;

  showSuccessToast = false;
  toastMessage = '';

  bannerForm = {
    title: '',
    subtitle: '',
    targetUrl: '',
    position: 'MainHome',
    displayOrder: 0,
    isActive: true,
    startsAt: '',
    expiresAt: '',
    image: null as File | null
  };

  constructor(
    private bannerService: BannerService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadBanners();
  }

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showSuccessToast = false;
    setTimeout(() => {
      this.showSuccessToast = true;
      this.cdr.detectChanges();
    }, 50);
  }

  loadBanners() {
    this.bannerService.getBanners().subscribe({
      next: (data) => {
        this.allBanners = data;
        this.applyFilters(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading banners:', error);
      }
    });
  }

  applyFilters(resetPage: boolean = true) {
    if (resetPage) {
      this.pageNumber = 1;
    }

    let temp = [...this.allBanners];

    // Search filter (title, subtitle or position)
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase().trim();
      temp = temp.filter(b =>
        (b.title && b.title.toLowerCase().includes(search)) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(search)) ||
        (b.position && b.position.toLowerCase().includes(search))
      );
    }

    // Status filter
    if (this.selectedStatus !== '') {
      const activeVal = this.selectedStatus === 'active';
      temp = temp.filter(b => b.isActive === activeVal);
    }

    // Position filter
    if (this.selectedPosition !== '') {
      temp = temp.filter(b => b.position === this.selectedPosition);
    }

    this.banners = temp;
    this.totalItems = temp.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;

    if (this.pageNumber > this.totalPages) {
      this.pageNumber = this.totalPages;
    }

    this.updatePaginatedBanners();
  }

  updatePaginatedBanners() {
    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedBanners = this.banners.slice(start, end);
  }

  onPageChange(newPage: number) {
    this.pageNumber = newPage;
    this.updatePaginatedBanners();
    this.cdr.detectChanges();
  }

  // Get list of unique positions for the filter dropdown
  get uniquePositions(): string[] {
    const positions = this.allBanners.map(b => b.position).filter(Boolean);
    return Array.from(new Set(positions));
  }

  openAddModal() {
    this.selectedBannerToEdit = null;
    this.existingImageUrl = null;
    this.bannerForm = {
      title: '',
      subtitle: '',
      targetUrl: '',
      position: 'MainHome',
      displayOrder: 0,
      isActive: true,
      startsAt: '',
      expiresAt: '',
      image: null
    };
    this.showAddBannerModal = true;
  }

  openEditModal(banner: BannerType) {
    this.selectedBannerToEdit = banner;
    this.existingImageUrl = banner.imageUrl || null;

    // Format dates to YYYY-MM-DDTHH:MM for datetime-local input
    const formatDateTimeLocal = (dateStr?: string): string => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      // Offset timezone to get local ISO string
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
      return localISOTime;
    };

    this.bannerForm = {
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      targetUrl: banner.targetUrl || '',
      position: banner.position || 'MainHome',
      displayOrder: banner.displayOrder || 0,
      isActive: banner.isActive,
      startsAt: formatDateTimeLocal(banner.startsAt),
      expiresAt: formatDateTimeLocal(banner.expiresAt),
      image: null
    };
    this.showAddBannerModal = true;
  }

  closeModal() {
    this.showAddBannerModal = false;
    this.selectedBannerToEdit = null;
    this.existingImageUrl = null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.bannerForm.image = input.files[0];
    }
  }

  saveBanner() {
    // Basic Validation
    if (!this.bannerForm.title.trim()) {
      this.triggerToast('Banner Title is required.');
      return;
    }

    if (!this.selectedBannerToEdit && !this.bannerForm.image) {
      this.triggerToast('Banner Image is required for new banners.');
      return;
    }

    const formData = new FormData();
    formData.append('Title', this.bannerForm.title.trim());
    formData.append('Subtitle', this.bannerForm.subtitle.trim());
    formData.append('TargetUrl', this.bannerForm.targetUrl.trim());
    formData.append('Position', this.bannerForm.position.trim());
    formData.append('DisplayOrder', this.bannerForm.displayOrder.toString());
    formData.append('IsActive', this.bannerForm.isActive.toString());

    if (this.bannerForm.startsAt) {
      formData.append('StartsAt', new Date(this.bannerForm.startsAt).toISOString());
    } else {
      formData.append('StartsAt', '');
    }

    if (this.bannerForm.expiresAt) {
      formData.append('ExpiresAt', new Date(this.bannerForm.expiresAt).toISOString());
    } else {
      formData.append('ExpiresAt', '');
    }

    if (this.bannerForm.image) {
      formData.append('Image', this.bannerForm.image, this.bannerForm.image.name);
    }

    const request$ = this.selectedBannerToEdit
      ? this.bannerService.updateBanners(this.selectedBannerToEdit.id, formData)
      : this.bannerService.postBanners(formData);

    request$.subscribe({
      next: (response) => {
        console.log(this.selectedBannerToEdit ? 'Banner updated successfully' : 'Banner created successfully', response);
        this.triggerToast(this.selectedBannerToEdit ? 'Banner updated successfully!' : 'Banner created successfully!');
        this.closeModal();
        this.loadBanners();
      },
      error: (error) => {
        console.error(this.selectedBannerToEdit ? 'Error updating banner' : 'Error creating banner', error);
        const errMessage = error.error?.message || error.error?.Message || 'Something went wrong. Please check your inputs.';
        this.triggerToast(errMessage);
      }
    });
  }

  deleteBanner(banner: BannerType) {
    if (confirm(`Are you sure you want to delete the banner "${banner.title}"?`)) {
      this.bannerService.deleteBanners(banner.id).subscribe({
        next: () => {
          this.triggerToast('Banner deleted successfully!');
          this.loadBanners();
        },
        error: (error) => {
          console.error('Error deleting banner:', error);
          this.triggerToast('Failed to delete banner.');
        }
      });
    }
  }
}
