import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../../Service/categories/categories-service';

@Component({
  selector: 'app-add-categories-form-model',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-categories-form-model.html',
  styleUrl: './add-categories-form-model.css',
})
export class AddCategoriesFormModel {
  @Output() close = new EventEmitter<void>();

  category = {
    name: '',
    slug: '',
    status: 2, // Default to Approved (2) or Pending (1) as a number
    description: '',
    image: null as File | null,
  };

  constructor(private categoriesService: CategoriesService) { }

  saveCategory() {
    const formData = new FormData();

    formData.append('Name', this.category.name);
    formData.append('Slug', this.category.slug);
    formData.append('Description', this.category.description);

    // Send the status as a string representation of the integer enum value
    formData.append('Status', this.category.status.toString());

    if (this.category.image) {
      formData.append('Image', this.category.image, this.category.image.name);
    }

    this.categoriesService.createCategory(formData).subscribe({
      next: (response) => {
        console.log('Category created successfully', response);
        this.close.emit();
      },
      error: (error) => {
        console.error('Error creating category', error);
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