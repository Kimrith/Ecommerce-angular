import { Component, EventEmitter, HostListener, Output, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../../Service/categories/categories-service';
import { ToastComponent } from '../../../shared/components/toast';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-categories-form-model',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './categories-form-model.html',
  styleUrl: './categories-form-model.css',
})
export class CategoriesFormModel implements OnInit {

  @Input() categoryData: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() categoryAdded = new EventEmitter<void>();

  imgBaseUrl = environment.apiUrl;

  category = {
    name: '',
    description: ''
  };

  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  toastMessage = '';
  showSuccessToast = false;

  constructor(
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.categoryData) {
      this.category.name = this.categoryData.name || '';
      this.category.description = this.categoryData.description || '';
      if (this.categoryData.imageUrl) {
        this.imagePreview = this.imgBaseUrl + this.categoryData.imageUrl;
      }
    }
  }

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showSuccessToast = false;
    setTimeout(() => {
      this.showSuccessToast = true;
      this.cdr.detectChanges();
    }, 50);
  }

  private getSellerId(): number {
    const storedUser = localStorage.getItem('userData') || localStorage.getItem('currentUser');
    const currentUser = storedUser ? JSON.parse(storedUser) : {};
    return currentUser.userId || currentUser.sellerId || 24;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  removeImage() {
    this.selectedImageFile = null;
    this.imagePreview = null;
  }

  postCategoriesSeller() {
    if (!this.category.name) {
      this.triggerToast('Please enter a category name.');
      return;
    }

    const formData = new FormData();
    formData.append('Name', this.category.name);
    formData.append('Description', this.category.description || '');
    formData.append('SellerId', this.getSellerId().toString());

    if (this.selectedImageFile) {
      formData.append('Image', this.selectedImageFile, this.selectedImageFile.name);
    }

    if (this.categoryData) {
      this.categoriesService.updateCategory(this.categoryData.id, formData).subscribe({
        next: (response) => {
          console.log('Category updated successfully', response);
          this.triggerToast('Category updated successfully!');
          this.categoryAdded.emit();
          setTimeout(() => {
            this.closeModal();
          }, 1500);
        },
        error: (error) => {
          console.error('Error updating category', error);
          this.triggerToast('Failed to update category.');
        }
      });
    } else {
      this.categoriesService.createCategory(formData).subscribe({
        next: (response) => {
          console.log('Category created successfully', response);
          this.triggerToast('Category created successfully!');
          this.categoryAdded.emit();
          setTimeout(() => {
            this.closeModal();
          }, 1500);
        },
        error: (error) => {
          console.error('Error creating category', error);
          this.triggerToast('Failed to create category.');
        }
      });
    }
  }

  closeModal() {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeModal();
  }
}