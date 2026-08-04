import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../Service/products/product-service';

@Component({
  selector: 'app-product-view-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-view-detail.html',
  styleUrl: './product-view-detail.css'
})
export class ProductViewDetail implements OnInit, OnChanges {
  @Input() product: any = {};
  @Output() close = new EventEmitter<void>();

  variants: any[] = [];
  showVariants: boolean = false; // Controls dropdown expansion

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    this.checkAndFetchVariants();
  }

  // Ensures variants reload if the selected product changes dynamically
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && !changes['product'].firstChange) {
      this.checkAndFetchVariants();
    }
  }

  private checkAndFetchVariants() {
    this.showVariants = false; // Reset dropdown state on product switch
    if (this.product && this.product.id) {
      this.fetchVariants(this.product.id);
    } else {
      this.variants = [];
    }
  }

  fetchVariants(productId: number) {
    this.productService.getProductVariants(productId).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.variants = res;
        } else if (res && Array.isArray(res.$values)) {
          this.variants = res.$values;
        } else if (res && Array.isArray(res.data)) {
          this.variants = res.data;
        } else if (res && Array.isArray(res.items)) {
          this.variants = res.items;
        } else {
          this.variants = [];
        }
      },
      error: (err) => {
        console.error('Error fetching variants:', err);
        this.variants = [];
      }
    });
  }

  toggleVariants() {
    this.showVariants = !this.showVariants; // Toggles dropdown open/close
  }

  closeModal() {
    this.close.emit();
  }
}