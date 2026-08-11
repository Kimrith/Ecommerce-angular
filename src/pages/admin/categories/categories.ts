import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddCategoriesFormModel } from '../../../components/admin/add-categories-form-model/add-categories-form-model';
import { CategoriesService, Category } from '../../../Service/categories/categories-service';
import { environment } from '../../../environments/environment.development';
import { CategoryStatistics } from '../../../type/categories';
import { Pagination } from '../../../shared/components/admin/pagination/pagination';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, AddCategoriesFormModel, FormsModule, Pagination],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  showAddCategoryModal = false;
  selectedCategoryToEdit: any = null;
  allCategories: Category[] = [];
  categories: Category[] = [];
  paginatedCategories: Category[] = [];
  imageUrl = environment.apiUrl;

  // Pagination states
  pageNumber: number = 1;
  pageSize: number = 7;
  totalItems: number = 0;
  totalPages: number = 1;

  // Filter & Search state variables
  searchTerm: string = '';
  selectedStatus: string = '';

  // Add stats property with default initial values
  stats: CategoryStatistics = {
    totalCategories: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
    suspended: 0
  };

  constructor(
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadStatistics(); // Fetch stats on init
  }

  loadCategories() {
    this.categoriesService.getCategories().subscribe({
      next: (data) => {
        this.allCategories = data;
        this.applyFilters(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  applyFilters(resetPage: boolean = true) {
    if (resetPage) {
      this.pageNumber = 1;
    }

    let temp = [...this.allCategories];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase().trim();
      temp = temp.filter(cat =>
        (cat.name && cat.name.toLowerCase().includes(search)) ||
        (cat.slug && cat.slug.toLowerCase().includes(search)) ||
        (cat.description && cat.description.toLowerCase().includes(search))
      );
    }

    if (this.selectedStatus && this.selectedStatus !== '') {
      const statusVal = this.getStatusValue(this.selectedStatus);
      temp = temp.filter(cat => this.getStatusValue(cat.status) === statusVal);
    }

    this.categories = temp;
    this.totalItems = temp.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;

    // Reset/Clamp pageNumber if it exceeds totalPages
    if (this.pageNumber > this.totalPages) {
      this.pageNumber = this.totalPages;
    }

    this.updatePaginatedCategories();
  }

  updatePaginatedCategories() {
    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedCategories = this.categories.slice(start, end);
  }

  onPageChange(newPage: number) {
    this.pageNumber = newPage;
    this.updatePaginatedCategories();
    this.cdr.detectChanges();
  }

  searchCategories() {
    this.applyFilters(true);
    this.cdr.detectChanges();
  }

  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.applyFilters(true);
    this.cdr.detectChanges();
  }

  getStatusValue(statusStr: string | number | null | undefined): number {
    if (statusStr === null || statusStr === undefined) return -1;
    if (typeof statusStr === 'number') return statusStr;
    switch (statusStr.toString().trim().toLowerCase()) {
      case 'draft': case '0': return 0;
      case 'pending': case '1': return 1;
      case 'approved': case 'active': case '2': return 2;
      case 'rejected': case '3': return 3;
      case 'archived': case '4': return 4;
      case 'suspended': case '5': return 5;
      default: return -1;
    }
  }

  loadStatistics() {
    this.categoriesService.CategoriesStatistics().subscribe({
      next: (data) => {
        this.stats = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading category statistics:', error);
      }
    });
  }

  openAddCategoryModal() {
    this.selectedCategoryToEdit = null;
    this.showAddCategoryModal = true;
  }

  openEditCategoryModal(category: Category) {
    this.selectedCategoryToEdit = category;
    this.showAddCategoryModal = true;
  }

  closeAddCategoryModal() {
    this.showAddCategoryModal = false;
    this.selectedCategoryToEdit = null;
    this.loadCategories();
    this.loadStatistics(); // Refresh stats when modal closes incase counts changed
  }

  deleteCategory(category: Category) {
    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      this.categoriesService.deleteCategory(category.id).subscribe({
        next: () => {
          alert('Category deleted successfully');
          this.loadCategories();
          this.loadStatistics(); // Refresh stats after deletion
        },
        error: (err) => {
          console.error('Error deleting category:', err);
          const errorMessage = err.error?.message || err.error?.Message || err.error;
          alert(typeof errorMessage === 'string' ? errorMessage : 'Failed to delete category because it contains products.');
        }
      });
    }
  }
}