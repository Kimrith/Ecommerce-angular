import { Location, CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { finalize, switchMap } from 'rxjs';
import { ProductService } from '../../../Service/products/product-service';
import { AddressService } from '../../../Service/Address/address-service';
import { OrderService } from '../../../Service/Order/order';
import { ToastComponent } from '../../../shared/components/toast';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ToastComponent],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit, OnDestroy {
  imageUrl = environment.apiUrl;
  product: any = null;
  productId: number = 0;
  quantity: number = 1;
  isLoading = true;

  productVariants: any[] = [];
  selectedVariant: any = null;

  // Checkout and Payment state
  showPaymentModal = false;
  isPlacingOrder = false;
  isVerifyingPayment = false;
  qrImageBase64: string = '';
  md5: string = '';
  orderId: number = 0;
  orderNumber: string = '';
  totalAmount: number = 0;
  paymentStatusMessage = 'Waiting for payment scan...';

  private pollingInterval: any = null;

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
    private productService: ProductService,
    private addressService: AddressService,
    private orderService: OrderService
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

  ngOnDestroy() {
    this.stopPolling();
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
    } else {
      this.selectedVariant = variant;
    }
    const maxQty = this.getMaxQuantity();
    if (this.quantity > maxQty) {
      this.quantity = maxQty;
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

  proceedToCheckout(userId: number, shippingAddressId: number) {
    const checkoutPayload = {
      orderDetails: {
        shippingAddressId: shippingAddressId,
        billingAddressId: shippingAddressId,
        notes: `Quick purchase of ${this.product?.name}` + (this.selectedVariant ? ` (${this.selectedVariant.title})` : ''),
      },
      cartItems: [
        {
          productId: this.productId,
          variantId: this.selectedVariant ? this.selectedVariant.id : null,
          price: this.getDisplayPrice(),
          quantity: this.quantity,
        },
      ],
      currency: 'USD',
    };

    this.isPlacingOrder = true;
    this.cdr.detectChanges();

    this.orderService
      .createOrder(checkoutPayload)
      .pipe(
        switchMap((orderResponse: any) => {
          this.orderId = orderResponse.id;
          this.orderNumber = orderResponse.orderNumber;
          this.totalAmount = orderResponse.totalAmount;
          this.cdr.detectChanges();
          return this.orderService.generateQrCode(orderResponse.id);
        }),
        finalize(() => {
          this.isPlacingOrder = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (qrResponse: any) => {
          const qrData = qrResponse.data || qrResponse;
          this.qrImageBase64 = qrData.qrImageBase64 || qrData.qrCode || qrData.qrCodeImage || '';
          this.md5 = qrData.md5 || qrData.transactionId || '';

          this.showPaymentModal = true;
          this.startPollingPayment();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to checkout:', err);
          alert(err.error?.message || 'Failed to place order or generate QR code. Please try again.');
        },
      });
  }

  startPollingPayment() {
    this.isVerifyingPayment = true;
    this.paymentStatusMessage = 'Waiting for payment scan...';
    this.cdr.detectChanges();

    this.stopPolling();

    this.pollingInterval = setInterval(() => {
      this.orderService
        .verifyPayment(this.orderId)
        .subscribe({
          next: (res) => {
            if (res.status === 'PAID') {
              this.stopPolling();
              this.paymentStatusMessage = 'Payment successful!';
              this.cdr.detectChanges();
              setTimeout(() => {
                this.closeModal();
                this.router.navigate(['/orders']);
              }, 1500);
            }
          },
          error: (err) => {
            console.error('Error verifying payment:', err);
          },
        });
    }, 3000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  closeModal() {
    this.showPaymentModal = false;
    this.isVerifyingPayment = false;
    this.stopPolling();
    this.cdr.detectChanges();
  }

  goBack() {
    this.location.back();
  }
}