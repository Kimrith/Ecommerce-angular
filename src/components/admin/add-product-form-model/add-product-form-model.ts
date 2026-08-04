import { Component, EventEmitter, HostListener, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../Service/products/product-service';
import { CategoriesService, Category } from '../../../Service/categories/categories-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-product-form-model',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-product-form-model.html',
  styleUrl: './add-product-form-model.css',
})
export class AddProductFormModel implements OnInit {
  @Output() close = new EventEmitter<void>();

  product = {
    name: '',
    sku: '',
    categoryId: '',
    brand: '',
    price: 0,
    discount: 0,
    stock: 0,
    status: 0,
    description: '',
    images: [] as File[],
  };

  categories: Category[] = [];

  constructor(
    private productService: ProductService,
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef // <-- Inject ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories() {
    this.categoriesService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        console.log('Categories data:', data);
        this.cdr.detectChanges(); // <-- Manually trigger change detection to update view
      },
      error: (error) => {
        console.error('Error fetching categories', error);
      }
    });
  }

  saveProduct() {
    const formData = new FormData();

    formData.append('Name', this.product.name);
    formData.append('SKU', this.product.sku);
    formData.append('CategoryId', this.product.categoryId);
    formData.append('Brand', this.product.brand);
    formData.append('Price', this.product.price.toString());
    formData.append('DiscountPrice', this.product.discount.toString());
    formData.append('InitialStock', this.product.stock.toString());
    formData.append('Status', this.product.status.toString());
    formData.append('Description', this.product.description);

    this.product.images.forEach((file) => {
      formData.append('Images', file, file.name);
    });

    this.productService.createProduct(formData).subscribe({
      next: (response) => {
        console.log('Product created successfully', response);
        this.close.emit();
      },
      error: (error) => {
        console.error('Error creating product', error);
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

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files) {
      this.product.images = Array.from(input.files);
    }
  }
}