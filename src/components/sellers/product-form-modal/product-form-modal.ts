import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../Service/products/product-service';
import { CategoriesService, Category } from '../../../Service/categories/categories-service';
import { ToastComponent } from '../../../shared/components/toast';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-product-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './product-form-modal.html',
  styleUrl: './product-form-modal.css',
})
export class ProductFormModal implements OnInit {

  @Output() close = new EventEmitter<void>();
  @Output() productAdded = new EventEmitter<void>();

  @Input() editProduct: any = null;

  product = {
    name: '',
    sku: '',
    categoryId: '',
    price: 0,
    stock: 0,
    description: '',
    publishImmediately: false,
    size: '',
    color: '',
  };

  categories: Category[] = [];
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  toastMessage = '';
  showSuccessToast = false;

  imgBaseUrl = environment.apiUrl;

  constructor(
    private productService: ProductService,
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    if (this.editProduct) {
      this.product.name = this.editProduct.name || '';
      this.product.sku = this.editProduct.sku || '';
      this.product.categoryId = this.editProduct.categoryId ? this.editProduct.categoryId.toString() : '';
      this.product.price = this.editProduct.price || 0;
      this.product.stock = this.editProduct.stockQuantity ?? this.editProduct.initialStock ?? 0;
      this.product.description = this.editProduct.description || '';
      this.product.publishImmediately = this.editProduct.status === 2 || this.editProduct.status === 'Approved' || this.editProduct.status === 1 || this.editProduct.status === 'Pending';
      this.product.size = this.editProduct.size || '';
      this.product.color = this.editProduct.color || '';
      this.imagePreview = this.editProduct.imageUrl ? this.imgBaseUrl + this.editProduct.imageUrl : null;
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

  loadCategories() {
    // Retrieve logged-in user details from local storage
    const storedUser = localStorage.getItem('userData') || localStorage.getItem('currentUser');
    const currentUser = storedUser ? JSON.parse(storedUser) : {};
    const sellerId = currentUser.userId || currentUser.sellerId || 24;

    this.categoriesService.getAllCategoriesSeller(sellerId).subscribe({
      next: (res: any) => {
        // Handle potential ASP.NET Core list wrappers ($values or data)
        if (Array.isArray(res)) {
          this.categories = res;
        } else if (res && Array.isArray(res.$values)) {
          this.categories = res.$values;
        } else if (res && Array.isArray(res.data)) {
          this.categories = res.data;
        } else {
          this.categories = [];
        }

        this.cdr.detectChanges()
      },
      error: (err) => {
        this.triggerToast('Failed to load categories for seller');
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  removeImage() {
    this.selectedImageFile = null;
    this.imagePreview = null;
  }

  postProductSeller() {
    if (!this.product.name || !this.product.categoryId || this.product.price <= 0 || this.product.stock < 0) {
      this.triggerToast('Please fill out all required fields with valid values.');
      return;
    }

    const formData = new FormData();
    formData.append('Name', this.product.name);
    formData.append('Description', this.product.description || '');
    formData.append('Price', this.product.price.toString());
    formData.append('DiscountPrice', '0');
    formData.append('Brand', 'Seller');
    formData.append('SKU', this.product.sku || '');
    formData.append('InitialStock', this.product.stock.toString());
    formData.append('CategoryId', this.product.categoryId.toString());
    formData.append('Size', this.product.size || '');
    formData.append('Color', this.product.color || '');

    // Status: 1 (Pending) if publishImmediately is checked, otherwise 0 (Draft)
    const status = this.product.publishImmediately ? 1 : 0;
    formData.append('Status', status.toString());

    // SellerId from localStorage
    const rawUserData = localStorage.getItem('userData') || localStorage.getItem('currentUser');
    const currentUser = rawUserData ? JSON.parse(rawUserData) : {};
    const sellerId = currentUser.userId || currentUser.sellerId || 24;
    formData.append('SellerId', sellerId.toString());

    if (this.selectedImageFile) {
      formData.append('Image', this.selectedImageFile, this.selectedImageFile.name);
    }

    const request$ = this.editProduct
      ? this.productService.updateProduct(this.editProduct.id, formData)
      : this.productService.createProduct(formData);

    request$.subscribe({
      next: (response) => {
        console.log(this.editProduct ? 'Product updated successfully' : 'Product created successfully', response);
        this.triggerToast(this.editProduct ? 'Product updated successfully!' : 'Product created successfully!');
        
        // Emit refresh event to parent table immediately
        this.productAdded.emit();
        
        // Delay modal closing so the success toast is fully visible
        setTimeout(() => {
          this.closeModal();
        }, 1500);
      },
      error: (error) => {
        console.error('Error saving product', error);
        this.triggerToast(this.editProduct ? 'Failed to update product. Please try again.' : 'Failed to create product. Please try again.');
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
}