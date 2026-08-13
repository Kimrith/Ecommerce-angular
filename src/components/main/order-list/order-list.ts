import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment.development';
import { OrderService } from '../../../Service/Order/order';
import { AddressService } from '../../../Service/Address/address-service';
import { CouponService } from '../../../Service/Coupon/coupon';
import { ToastComponent } from '../../../shared/components/toast';
import { switchMap, finalize } from 'rxjs';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, ToastComponent, FormsModule],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css',
})
export class OrderList implements OnInit, OnDestroy {
  cartItems: any[] = [];
  subtotal: number = 0;
  hasCartData: boolean = false;

  imageUrl = environment.apiUrl;

  // Payment states
  showPaymentModal = false;
  isPlacingOrder = false;
  isVerifyingPayment = false;
  orderId: number = 0;
  orderNumber: string = '';
  totalAmount: number = 0;
  qrImageBase64: string = '';
  md5: string = '';
  paymentStatusMessage = 'Waiting for payment scan...';

  // Coupon states
  couponCode: string = '';
  appliedCoupon: any = null;
  discountAmount: number = 0;
  couponError: string = '';
  isApplyingCoupon: boolean = false;

  private pollingInterval: any = null;

  // Toast states
  showToast = false;
  toastMessage = '';

  private router = inject(Router);
  private orderService = inject(OrderService);
  private addressService = inject(AddressService);
  private couponService = inject(CouponService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadCart();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showToast = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = true;
      this.cdr.detectChanges();
    }, 10);
  }

  reqOrder() {
    if (this.cartItems.length === 0) return;

    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
      this.triggerToast('Please log in to proceed to checkout');
      this.router.navigate(['/login']);
      return;
    }

    this.isPlacingOrder = true;
    this.cdr.detectChanges();

    try {
      const userData = JSON.parse(userDataStr);
      const userId = userData.userId || userData.id;

      // 1. Fetch user addresses from backend
      this.addressService.getUserAddresses(userId).subscribe({
        next: (addresses: any) => {
          let addressList: any[] = [];
          if (Array.isArray(addresses)) {
            addressList = addresses;
          } else if (addresses && Array.isArray(addresses.$values)) {
            addressList = addresses.$values;
          } else if (addresses && Array.isArray(addresses.data)) {
            addressList = addresses.data;
          }

          if (addressList.length > 0) {
            // Address exists, use the first/default address ID
            const selectedAddressId = addressList.find(addr => addr.isDefault)?.id || addressList[0].id;
            this.createOrderWithAddress(selectedAddressId);
          } else {
            // No addresses found, redirect user to settings to complete address details
            this.isPlacingOrder = false;
            this.triggerToast('Please add a shipping address in settings first!');
            this.cdr.detectChanges();
            setTimeout(() => {
              this.router.navigate(['/setting']);
            }, 1500);
          }
        },
        error: (err) => {
          console.error('Failed to fetch addresses:', err);
          this.isPlacingOrder = false;
          this.triggerToast('Could not load shipping addresses. Please try again.');
          this.cdr.detectChanges();
        }
      });
    } catch (e) {
      console.error('Error parsing user data:', e);
      this.isPlacingOrder = false;
      this.cdr.detectChanges();
    }
  }

  createOrderWithAddress(addressId: number) {
    const orderPayload = {
      orderDetails: {
        shippingAddressId: addressId,
        billingAddressId: addressId,
        notes: 'Order placed from cart list',
        couponCode: this.appliedCoupon ? this.appliedCoupon.code : null
      },
      cartItems: this.cartItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId || null,
        price: item.price,
        quantity: item.quantity
      })),
      currency: 'USD'
    };

    this.orderService.createOrder(orderPayload).pipe(
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
      })
    ).subscribe({
      next: (qrResponse: any) => {
        const qrData = qrResponse.data || qrResponse;
        this.qrImageBase64 = qrData.qrImageBase64 || qrData.qrCode || qrData.qrCodeImage || '';
        this.md5 = qrData.md5 || qrData.transactionId || '';

        this.showPaymentModal = true;
        this.startPollingPayment();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error placing order or generating QR code:', err);
        this.triggerToast(err.error?.message || 'Failed to complete checkout. Please try again.');
        this.cdr.detectChanges();
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
              this.triggerToast('Order paid successfully!');
              this.clearCart();
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

  loadCart() {
    const savedCart = localStorage.getItem('cart');

    if (savedCart !== null && savedCart !== '') {
      this.hasCartData = true;
      try {
        this.cartItems = JSON.parse(savedCart);
        this.calculateTotal();
      } catch (e) {
        this.cartItems = [];
        this.hasCartData = false;
      }
    } else {
      this.hasCartData = false;
    }
  }

  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
      this.updateCartStorage();
    } else {
      this.removeFromCart(item);
    }
  }

  increaseQuantity(item: any) {
    item.quantity++;
    this.updateCartStorage();
  }

  removeFromCart(item: any) {
    this.cartItems = this.cartItems.filter(cartItem => 
      !(cartItem.productId === item.productId && cartItem.variantId === item.variantId)
    );
    this.updateCartStorage();
  }

  updateCartStorage() {
    if (this.cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(this.cartItems));
      this.hasCartData = true;
    } else {
      localStorage.removeItem('cart');
      this.hasCartData = false;
    }
    this.calculateTotal();
    window.dispatchEvent(new Event('cartUpdated'));
    this.cdr.detectChanges();
  }

  calculateTotal() {
    this.subtotal = this.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    this.calculateDiscount();
  }

  applyCoupon() {
    const code = this.couponCode.trim();
    if (!code) {
      this.couponError = 'Please enter a coupon code.';
      return;
    }

    this.isApplyingCoupon = true;
    this.couponError = '';
    this.cdr.detectChanges();

    this.couponService.getCouponByCode(code).subscribe({
      next: (coupon: any) => {
        this.isApplyingCoupon = false;

        // Perform validation checks client-side for immediate user feedback
        if (!coupon.isActive) {
          this.couponError = 'This coupon is inactive.';
          this.cdr.detectChanges();
          return;
        }

        // Validate dates if set
        const now = new Date();
        if (coupon.startsAt && new Date(coupon.startsAt) > now) {
          this.couponError = 'This coupon is not active yet.';
          this.cdr.detectChanges();
          return;
        }
        if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
          this.couponError = 'This coupon has expired.';
          this.cdr.detectChanges();
          return;
        }

        // Validate minimum amount requirement
        if (coupon.minimumAmount && this.subtotal < coupon.minimumAmount) {
          this.couponError = `Subtotal must be at least $${coupon.minimumAmount} to use this coupon.`;
          this.cdr.detectChanges();
          return;
        }

        // Validate usage limits
        if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
          this.couponError = 'This coupon usage limit has been reached.';
          this.cdr.detectChanges();
          return;
        }

        // Coupon is valid! Apply it.
        this.appliedCoupon = coupon;
        this.calculateDiscount();
        this.triggerToast('Coupon applied successfully!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isApplyingCoupon = false;
        console.error('Error fetching coupon:', err);
        this.couponError = err.error?.message || 'Invalid coupon code or not found.';
        this.cdr.detectChanges();
      }
    });
  }

  calculateDiscount() {
    if (!this.appliedCoupon) {
      this.discountAmount = 0;
      return;
    }

    const type = this.appliedCoupon.discountType;
    const value = this.appliedCoupon.discountValue;

    if (type === 'Percentage') {
      let discount = this.subtotal * (value / 100);
      if (this.appliedCoupon.maximumDiscountAmount && discount > this.appliedCoupon.maximumDiscountAmount) {
        discount = this.appliedCoupon.maximumDiscountAmount;
      }
      this.discountAmount = Math.round(discount * 100) / 100;
    } else if (type === 'FixedAmount') {
      let discount = value;
      if (discount > this.subtotal) {
        discount = this.subtotal;
      }
      this.discountAmount = Math.round(discount * 100) / 100;
    } else {
      this.discountAmount = 0;
    }
  }

  removeCoupon() {
    this.appliedCoupon = null;
    this.discountAmount = 0;
    this.couponCode = '';
    this.couponError = '';
    this.cdr.detectChanges();
  }

  clearCart() {
    localStorage.removeItem('cart');
    this.cartItems = [];
    this.hasCartData = false;
    this.subtotal = 0;
    this.removeCoupon();
    window.dispatchEvent(new Event('cartUpdated'));
  }
}