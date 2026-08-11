import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../../Service/categories/categories-service';
import { CreateCategoryRequest } from '../../../type/categories';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-add-categories-form-model',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-categories-form-model.html',
  styleUrl: './add-categories-form-model.css',
})
export class AddCategoriesFormModel implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Input() editCategory: any = null;

  imageUrl = environment.apiUrl;
  existingImageUrl: string | null = null;

  // Explicitly typed using the interface
  category: CreateCategoryRequest = {
    name: '',
    slug: '',
    status: 2, // Default to Approved (2)
    description: '',
    image: null,
  };

  constructor(private categoriesService: CategoriesService) { }

  ngOnInit(): void {
    if (this.editCategory) {
      this.category.name = this.editCategory.name || '';
      this.category.slug = this.editCategory.slug || '';
      this.category.description = this.editCategory.description || '';
      this.category.status = this.getStatusValue(this.editCategory.status);
      this.existingImageUrl = this.editCategory.imageUrl || null;
    }
  }

  getStatusValue(statusStr: string | number): number {
    if (typeof statusStr === 'number') return statusStr;
    if (!statusStr) return 2;
    switch (statusStr.toLowerCase()) {
      case 'draft': return 0;
      case 'pending': return 1;
      case 'approved': return 2;
      case 'rejected': return 3;
      case 'archived': return 4;
      default:
        const parsed = parseInt(statusStr, 10);
        return isNaN(parsed) ? 2 : parsed;
    }
  }

  saveCategory() {
    const formData = new FormData();

    formData.append('Name', this.category.name);
    if (this.category.slug) {
      formData.append('Slug', this.category.slug);
    }
    formData.append('Description', this.category.description || '');
    formData.append('Status', this.category.status.toString());

    if (this.category.image) {
      formData.append('Image', this.category.image, this.category.image.name);
    }

    const request$ = this.editCategory
      ? this.categoriesService.updateCategory(this.editCategory.id, formData)
      : this.categoriesService.createCategory(formData);

    request$.subscribe({
      next: (response) => {
        console.log(this.editCategory ? 'Category updated successfully' : 'Category created successfully', response);
        this.close.emit();
      },
      error: (error) => {
        console.error(this.editCategory ? 'Error updating category' : 'Error creating category', error);
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files?.length) {
      this.category.image = input.files[0];
    }
  }
}