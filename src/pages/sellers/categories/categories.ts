import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesTables } from '../../../components/sellers/categories-tables/categories-tables';
import { CategoriesFormModel } from '../../../components/sellers/categories-form-model/categories-form-model';
import { Pagination } from '../../../shared/components/sellers-layout/pagination/pagination';
import { CategoriesService } from '../../../Service/categories/categories-service';
import { CategoryStatistics } from '../../../type/categories';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CategoriesTables, CategoriesFormModel, Pagination, CommonModule, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  @ViewChild('categoryTable') categoryTable!: CategoriesTables;

  showCategoryModal = false;
  selectedStatus: string = '';
  selectedCategory: any = null;

  pageNumber: number = 1;
  pageSize: number = 7;
  totalItems: number = 0;
  totalPages: number = 1;

  private _searchTerm: string = '';
  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(val: string) {
    this._searchTerm = val;
    this.pageNumber = 1;
  }

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
    private categoriesService: CategoriesService, // Fixed name context
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadSellerStatistics();
  }

  private getSellerId(): number {
    const storedUser = localStorage.getItem('userData') || localStorage.getItem('currentUser');
    const currentUser = storedUser ? JSON.parse(storedUser) : {};
    return currentUser.userId || currentUser.sellerId || 24;
  }

  loadSellerStatistics() {
    const sellerId = this.getSellerId();

    this.categoriesService.CategoriesStatistics(sellerId).subscribe({
      next: (data) => {
        this.stats = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load seller category statistics', err);
      }
    });
  }

  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.pageNumber = 1;
    this.cdr.detectChanges();
  }

  onPageChanged(page: number) {
    this.pageNumber = page;
    this.cdr.detectChanges();
  }

  openCategoryModal() {
    this.selectedCategory = null;
    this.showCategoryModal = true;
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
    this.selectedCategory = null;
    this.loadSellerStatistics();
  }

  onEditCategory(category: any) {
    this.selectedCategory = category;
    this.showCategoryModal = true;
    this.cdr.detectChanges();
  }

  onDeleteCategory(category: any) {
    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      this.categoriesService.deleteCategory(category.id).subscribe({
        next: () => {
          console.log('Category deleted successfully');
          if (this.categoryTable) {
            this.categoryTable.getSellerCategories();
          }
          this.loadSellerStatistics();
        },
        error: (err) => {
          console.error('Failed to delete category', err);
          alert(err.error?.message || 'Failed to delete category.');
        }
      });
    }
  }
}