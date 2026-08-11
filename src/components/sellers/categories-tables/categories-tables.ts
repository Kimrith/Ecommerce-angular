import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriesService } from '../../../Service/categories/categories-service';
import { ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-categories-tables',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories-tables.html',
  styleUrl: './categories-tables.css',
})
export class CategoriesTables implements OnInit, OnChanges {
  @Input() selectedStatus: string = '';
  @Input() searchTerm: string = '';
  @Input() pageNumber: number = 1;
  @Input() pageSize: number = 7;
  @Output() totalItemsChange = new EventEmitter<number>();
  @Output() totalPagesChange = new EventEmitter<number>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  categories: any[] = [];
  imgBaseUrl = environment.apiUrl;

  getStatusValue(statusStr: string | number | null | undefined): number {
    if (statusStr === null || statusStr === undefined) return -1;
    const num = Number(statusStr);
    if (!isNaN(num) && statusStr.toString().trim() !== '') return num;
    switch (statusStr.toString().trim().toLowerCase()) {
      case 'draft': return 0;
      case 'pending': return 1;
      case 'approved': case 'active': return 2;
      case 'rejected': return 3;
      case 'archived': return 4;
      case 'suspended': return 5;
      default: return -1;
    }
  }

  get allFilteredCategories() {
    let temp = [...this.categories];
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase().trim();
      temp = temp.filter(c =>
        (c.name && c.name.toLowerCase().includes(search)) ||
        (c.description && c.description.toLowerCase().includes(search))
      );
    }
    if (this.selectedStatus !== undefined && this.selectedStatus !== '') {
      const targetVal = this.getStatusValue(this.selectedStatus);
      temp = temp.filter(c => this.getStatusValue(c.status) === targetVal);
    }
    return temp;
  }

  get filteredCategories() {
    const page = Number(this.pageNumber || 1);
    const size = Number(this.pageSize || 7);
    const startIndex = (page - 1) * size;
    return this.allFilteredCategories.slice(startIndex, startIndex + size);
  }

  get totalItems(): number {
    return this.allFilteredCategories.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  constructor(private categoryService: CategoriesService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getSellerCategories();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.emitPaginationInfo();
  }

  emitPaginationInfo(): void {
    setTimeout(() => {
      this.totalItemsChange.emit(this.totalItems);
      this.totalPagesChange.emit(this.totalPages);
    });
  }

  getSellerCategories() {
    const storedUser = localStorage.getItem('userData') || localStorage.getItem('currentUser');
    const currentUser = storedUser ? JSON.parse(storedUser) : {};
    const sellerId = currentUser.userId || currentUser.sellerId || 24;

    this.categoryService.getAllCategoriesSeller(sellerId).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.categories = res;
        } else if (res && Array.isArray((res as any).$values)) {
          this.categories = (res as any).$values;
        } else if (res && Array.isArray((res as any).data)) {
          this.categories = (res as any).data;
        } else {
          this.categories = [];
        }

        this.cdr.detectChanges();
        this.emitPaginationInfo();
      },
      error: (err) => {
        console.error('Failed to fetch categories', err);
      }
    });
  }
}