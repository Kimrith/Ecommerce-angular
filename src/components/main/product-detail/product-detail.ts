import { Location, CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { finalize } from 'rxjs';
import { ProductService } from '../../../Service/products/product-service';
import { ToastComponent } from '../../../shared/components/toast';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ToastComponent],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  imageUrl = environment.apiUrl;
  product: any = null;
  productId: number = 0;
  quantity: number = 1;
  isLoading = true;

  productVariants: any[] = [];
  selectedVariant: any = null;
  imgProductViaraints: any[] = [];
  selectedSize: string = '';
  selectedColor: string = '';

  showToast = false;
  toastMessage = '';

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showToast = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = true;
      this.cdr.detectChanges();
    }, 10);
  }

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private productService: ProductService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.productId = +idParam;
        this.loadProduct();
      } else {
        this.isLoading = false;
      }
    });
  }

  getProductVariants() {
    this.productService.getProductVariants(this.productId).subscribe({
      next: (res) => {
        let rawVariants = [];
        if (Array.isArray(res)) {
          rawVariants = res;
        } else if (res && Array.isArray(res.$values)) {
          rawVariants = res.$values;
        } else if (res && Array.isArray(res.data)) {
          rawVariants = res.data;
        } else if (res && Array.isArray(res.items)) {
          rawVariants = res.items;
        }
        this.productVariants = rawVariants.filter((v: any) => v.isActive);
        this.imgProductViaraints = this.productVariants;
        
        // Auto-select variant based on selectedSize / selectedColor or default to first variant
        if (this.selectedSize || this.selectedColor) {
          const matching = this.productVariants.find(
            (v) =>
              (!this.selectedSize || (v.size && v.size.trim().toLowerCase() === this.selectedSize.trim().toLowerCase())) &&
              (!this.selectedColor || (v.color && v.color.trim().toLowerCase() === this.selectedColor.trim().toLowerCase()))
          );
          if (matching) {
            this.selectedVariant = matching;
          }
        } else if (this.productVariants.length > 0) {
          const firstVariant = this.productVariants[0];
          this.selectedSize = firstVariant.size || '';
          this.selectedColor = firstVariant.color || '';
          this.selectedVariant = firstVariant;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading product variants:', err);
        this.productVariants = [];
        this.cdr.detectChanges();
      },
    });
  }

  loadProduct() {
    this.isLoading = true;

    this.productService
      .getProductById(this.productId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          this.product = res;
          
          // Set default size from product.size
          if (this.product?.size) {
            const sizes = this.product.size.split(',').map((s: string) => s.trim()).filter((s: string) => s);
            if (sizes.length > 0) {
              this.selectedSize = sizes[0];
            }
          }
          // Set default color from product.color
          if (this.product?.color) {
            const colors = this.product.color.split(',').map((c: string) => c.trim()).filter((c: string) => c);
            if (colors.length > 0) {
              this.selectedColor = colors[0];
            }
          }
          
          this.getProductVariants();
        },
        error: (err) => {
          console.error('Error loading product details:', err);
        },
      });
  }

  incrementQuantity() {
    if (this.quantity < this.getMaxQuantity()) {
      this.quantity++;
    }
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  selectVariant(variant: any) {
    if (this.selectedVariant && this.selectedVariant.id === variant.id) {
      this.selectedVariant = null;
      this.selectedSize = '';
      this.selectedColor = '';
    } else {
      this.selectedVariant = variant;
      this.selectedSize = variant.size || '';
      this.selectedColor = variant.color || '';
    }
    const maxQty = this.getMaxQuantity();
    if (this.quantity > maxQty) {
      this.quantity = maxQty;
    }
    this.cdr.detectChanges();
  }

  getCombinedSizes(): string[] {
    const sizes = new Set<string>();
    if (this.product?.size) {
      this.product.size.split(',').forEach((s: string) => {
        const trimmed = s.trim();
        if (trimmed) sizes.add(trimmed);
      });
    }
    if (this.productVariants) {
      this.productVariants.forEach((v: any) => {
        if (v.size) {
          const trimmed = v.size.trim();
          if (trimmed) sizes.add(trimmed);
        }
      });
    }
    return Array.from(sizes);
  }

  getCombinedColors(): string[] {
    const colors = new Set<string>();
    if (this.product?.color) {
      this.product.color.split(',').forEach((c: string) => {
        const trimmed = c.trim();
        if (trimmed) colors.add(trimmed);
      });
    }
    if (this.productVariants) {
      this.productVariants.forEach((v: any) => {
        if (v.color) {
          const trimmed = v.color.trim();
          if (trimmed) colors.add(trimmed);
        }
      });
    }
    return Array.from(colors);
  }

  onSizeChange(event: any) {
    this.selectedSize = event.target.value;
    
    if (this.selectedSize) {
      // 1. Try to find a variant matching both size and current color
      let matching = this.productVariants.find(
        (v) =>
          v.size && v.size.trim().toLowerCase() === this.selectedSize.trim().toLowerCase() &&
          (!this.selectedColor || (v.color && v.color.trim().toLowerCase() === this.selectedColor.trim().toLowerCase()))
      );
      
      // 2. If not found, find any variant matching this size
      if (!matching) {
        matching = this.productVariants.find(
          (v) => v.size && v.size.trim().toLowerCase() === this.selectedSize.trim().toLowerCase()
        );
      }
      
      if (matching) {
        this.selectedVariant = matching;
        this.selectedSize = matching.size || '';
        this.selectedColor = matching.color || '';
      } else {
        this.selectedVariant = null;
      }
    } else {
      this.selectedVariant = null;
    }
    this.cdr.detectChanges();
  }

  onColorChange(event: any) {
    this.selectedColor = event.target.value;
    
    if (this.selectedColor) {
      // 1. Try to find a variant matching both current size and new color
      let matching = this.productVariants.find(
        (v) =>
          (!this.selectedSize || (v.size && v.size.trim().toLowerCase() === this.selectedSize.trim().toLowerCase())) &&
          v.color && v.color.trim().toLowerCase() === this.selectedColor.trim().toLowerCase()
      );
      
      // 2. If not found, find any variant matching this color
      if (!matching) {
        matching = this.productVariants.find(
          (v) => v.color && v.color.trim().toLowerCase() === this.selectedColor.trim().toLowerCase()
        );
      }
      
      if (matching) {
        this.selectedVariant = matching;
        this.selectedSize = matching.size || '';
        this.selectedColor = matching.color || '';
      } else {
        this.selectedVariant = null;
      }
    } else {
      this.selectedVariant = null;
    }
    this.cdr.detectChanges();
  }

  getMaxQuantity(): number {
    if (this.selectedVariant) {
      return this.selectedVariant.availableQuantity ?? 0;
    }
    return this.product?.availableQuantity ?? 0;
  }

  getDisplayPrice(): number {
    if (this.selectedVariant) {
      return this.selectedVariant.discountPrice && this.selectedVariant.discountPrice > 0
        ? this.selectedVariant.discountPrice
        : this.selectedVariant.price;
    }
    if (this.product) {
      return this.product.discountPrice && this.product.discountPrice > 0
        ? this.product.discountPrice
        : this.product.price;
    }
    return 0;
  }

  getOriginalPrice(): number {
    if (this.selectedVariant) {
      return this.selectedVariant.price;
    }
    if (this.product) {
      return this.product.price;
    }
    return 0;
  }

  hasDiscount(): boolean {
    if (this.selectedVariant) {
      return !!(this.selectedVariant.discountPrice && this.selectedVariant.discountPrice > 0);
    }
    if (this.product) {
      return !!(this.product.discountPrice && this.product.discountPrice > 0);
    }
    return false;
  }

  getDisplayImage(): string {
    if (this.selectedVariant && this.selectedVariant.imageUrl) {
      return this.imageUrl + this.selectedVariant.imageUrl;
    }
    if (this.product && this.product.imageUrl) {
      return this.imageUrl + this.product.imageUrl;
    }
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';
  }

  buyNow() {
    if (!this.product) return;

    const cartItem = {
      productId: this.productId,
      variantId: this.selectedVariant ? this.selectedVariant.id : null,
      variantTitle: this.selectedVariant ? this.selectedVariant.title : null,
      name: this.product.name,
      imageUrl: this.selectedVariant && this.selectedVariant.imageUrl ? this.selectedVariant.imageUrl : this.product.imageUrl,
      price: this.getDisplayPrice(),
      quantity: this.quantity
    };

    let cart = [];
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        cart = JSON.parse(storedCart);
        if (!Array.isArray(cart)) {
          cart = [];
        }
      } catch (e) {
        cart = [];
      }
    }

    const existingIndex = cart.findIndex((item: any) =>
      item.productId === this.productId &&
      item.variantId === (this.selectedVariant ? this.selectedVariant.id : null)
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += this.quantity;
      const maxQty = this.getMaxQuantity();
      if (cart[existingIndex].quantity > maxQty) {
        cart[existingIndex].quantity = maxQty;
      }
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));

    this.triggerToast(`Added ${this.product.name}${this.selectedVariant ? ' (' + this.selectedVariant.title + ')' : ''} to cart successfully!`);
  }

  goBack() {
    this.location.back();
  }
}