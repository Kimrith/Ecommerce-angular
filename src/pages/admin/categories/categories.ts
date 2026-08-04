import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddCategoriesFormModel } from '../../../components/admin/add-categories-form-model/add-categories-form-model';
import { CategoriesService, Category } from '../../../Service/categories/categories-service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, AddCategoriesFormModel],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  showAddCategoryModal = false;
  categories: Category[] = [];

  constructor(
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef // 1. Inject ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories() {
    this.categoriesService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.detectChanges(); // 2. Force UI to render the array immediately
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  openAddCategoryModal() {
    this.showAddCategoryModal = true;
  }

  closeAddCategoryModal() {
    this.showAddCategoryModal = false;
    this.loadCategories();
  }
}