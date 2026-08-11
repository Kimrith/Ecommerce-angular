import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { OrderService } from '../../../Service/Order/order';
import { AddressService } from '../../../Service/Address/address-service';
import { ToastComponent } from '../../../shared/components/toast';
import { switchMap, finalize } from 'rxjs';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, ToastComponent],
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

  private pollingInterval: any = null;

  // Toast states
  showToast = false;
  toastMessage = '';

  private router = inject(Router);
  private orderService = inject(OrderService);
  private addressService = inject(AddressService);
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
        couponCode: null
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

  calculateTotal() {
    this.subtotal = this.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  clearCart() {
    localStorage.removeItem('cart');
    this.cartItems = [];
    this.hasCartData = false;
    this.subtotal = 0;
    window.dispatchEvent(new Event('cartUpdated'));
  }
}