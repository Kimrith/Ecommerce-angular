import { Component, EventEmitter, HostListener, OnInit, Output, Input, ChangeDetectorRef } from '@angular/core';
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
  @Input() editProduct: any = null; // If passed, we are in edit mode
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
    size: '',
    color: '',
  };

  categories: Category[] = [];
  existingImageUrl: string | null = null; // Track existing image URL if editing

  constructor(
    private productService: ProductService,
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    if (this.editProduct) {
      this.product.name = this.editProduct.name || '';
      this.product.sku = this.editProduct.sku || '';
      this.product.categoryId = this.editProduct.categoryId ? this.editProduct.categoryId.toString() : '';
      this.product.brand = this.editProduct.brand || '';
      this.product.price = this.editProduct.price || 0;
      this.product.discount = this.editProduct.discountPrice || 0;
      this.product.stock = this.editProduct.stockQuantity ?? this.editProduct.initialStock ?? 0;
      this.product.status = this.editProduct.status ?? 0;
      this.product.description = this.editProduct.description || '';
      this.product.size = this.editProduct.size || '';
      this.product.color = this.editProduct.color || '';
      this.existingImageUrl = this.editProduct.imageUrl || null;
    }
  }

  loadCategories() {
    this.categoriesService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        console.log('Categories data:', data);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching categories', error);
      }
    });
  }

  saveProduct() {
    const formData = new FormData();

    // Map fields matching your backend API expectations exactly
    formData.append('Name', this.product.name || '');
    formData.append('Description', this.product.description || '');
    formData.append('Price', this.product.price.toString());
    formData.append('DiscountPrice', this.product.discount.toString());

    // If your backend expects SKU or Brand, ensure they are appended 
    formData.append('SKU', this.product.sku || '');
    formData.append('Brand', this.product.brand || '');
    formData.append('Size', this.product.size || '');
    formData.append('Color', this.product.color || '');
    
    formData.append('InitialStock', this.product.stock.toString());
    formData.append('CategoryId', this.product.categoryId ? this.product.categoryId.toString() : '');
    formData.append('Status', this.product.status.toString());

    // Append files to the 'Image' key matching your backend form setup
    this.product.images.forEach((file) => {
      formData.append('Image', file, file.name);
    });

    if (this.editProduct) {
      this.productService.updateProduct(this.editProduct.id, formData).subscribe({
        next: (response) => {
          console.log('Product updated successfully', response);
          this.close.emit();
        },
        error: (error) => {
          console.error('Error updating product', error);
        }
      });
    } else {
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