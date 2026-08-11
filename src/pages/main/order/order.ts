import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { OrderService } from '../../../Service/Order/order';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order implements OnInit, OnDestroy {
  imageUrl = environment.apiUrl;
  allOrders: any[] = [];
  filteredOrders: any[] = [];
  selectedFilter = 'all';
  isLoading = true;

  // Order Details Modal State
  selectedOrder: any = null;
  orderItems: any[] = [];
  isLoadingItems = false;

  // Payment Modal State
  showPaymentModal = false;
  orderId: number = 0;
  orderNumber: string = '';
  totalAmount: number = 0;
  qrImageBase64: string = '';
  md5: string = '';
  isVerifyingPayment = false;
  paymentStatusMessage = 'Waiting for payment scan...';
  private pollingInterval: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private orderService: OrderService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.loadUserOrders();
    });
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  getAuthHeaders(): HttpHeaders {
    let token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    token = token.trim();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadUserOrders() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
      this.router.navigate(['/login']);
      return;
    }

    const userData = JSON.parse(userDataStr);
    const userId = userData.userId || userData.id;

    if (!userId) {
      console.error('UserId is missing from session data.');
      return;
    }

    this.isLoading = true;
    const headers = this.getAuthHeaders();
    this.http.get<any>(`${environment.apiUrl}/api/Order`, { headers }).subscribe({
      next: (res) => {
        let rawOrders = [];
        if (Array.isArray(res)) {
          rawOrders = res;
        } else if (res && Array.isArray((res as any).$values)) {
          rawOrders = (res as any).$values;
        } else if (res && Array.isArray((res as any).data)) {
          rawOrders = (res as any).data;
        }

        this.allOrders = rawOrders;
        this.filterOrders('all');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load user orders:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getOrderStatusLower(order: any): string {
    const status = order.status;
    if (status === null || status === undefined) {
      const fallback = order.statusString;
      if (fallback === null || fallback === undefined) return '';
      return fallback.toString().toLowerCase().trim();
    }

    if (typeof status === 'number') {
      switch (status) {
        case 0: return 'pending';
        case 1: return 'processing';
        case 2: return 'shipped';
        case 3: return 'delivered';
        case 4: return 'cancelled';
        case 5: return 'refunded';
        case 6: return 'suspended';
        default: return '';
      }
    }

    const str = status.toString().toLowerCase().trim();
    if (str === '0') return 'pending';
    if (str === '1') return 'processing';
    if (str === '2') return 'shipped';
    if (str === '3') return 'delivered';
    if (str === '4') return 'cancelled';
    if (str === '5') return 'refunded';
    if (str === '6') return 'suspended';

    return str;
  }

  filterOrders(status: string) {
    this.selectedFilter = status;
    if (status === 'all') {
      this.filteredOrders = [...this.allOrders];
    } else if (status === 'pending') {
      this.filteredOrders = this.allOrders.filter(o => this.getOrderStatusLower(o) === 'pending');
    } else if (status === 'shipping') {
      this.filteredOrders = this.allOrders.filter(o => {
        const s = this.getOrderStatusLower(o);
        return s === 'shipped';
      });
    } else if (status === 'completed') {
      this.filteredOrders = this.allOrders.filter(o => {
        const s = this.getOrderStatusLower(o);
        return s === 'processing' || s === 'delivered' || s === 'completed';
      });
    }
  }

  viewOrderDetails(order: any) {
    this.selectedOrder = order;
    this.orderItems = [];
    this.isLoadingItems = true;
    this.cdr.detectChanges();

    this.orderService.getOrderItemsByOrderId(order.id).subscribe({
      next: (items) => {
        this.orderItems = items;
        this.isLoadingItems = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load order items:', err);
        this.isLoadingItems = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeOrderDetails() {
    this.selectedOrder = null;
    this.orderItems = [];
    this.cdr.detectChanges();
  }

  requestPayemtn(order: any) {
    let orderObj = order;
    if (typeof order === 'number' || typeof order === 'string') {
      if (this.selectedOrder && this.selectedOrder.id === order) {
        orderObj = this.selectedOrder;
      } else {
        orderObj = this.allOrders.find(o => o.id === order);
      }
    }

    if (!orderObj) {
      console.error('Order details not found for:', order);
      return;
    }

    this.orderId = orderObj.id;
    this.orderNumber = orderObj.orderNumber;
    this.totalAmount = orderObj.totalAmount;
    this.qrImageBase64 = '';
    this.showPaymentModal = true;
    this.isVerifyingPayment = true;
    this.paymentStatusMessage = 'Generating KHQR...';
    this.cdr.detectChanges();

    this.orderService.generateQrCode(this.orderId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.qrImageBase64 = res.data.qrImageBase64;
          this.md5 = res.data.md5;
          this.startPollingPayment();
        } else {
          console.error('Failed to parse QR response:', res);
          this.paymentStatusMessage = 'Failed to generate QR.';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to generate QR:', err);
        this.paymentStatusMessage = 'Failed to generate QR.';
        this.cdr.detectChanges();
      }
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
                this.closePaymentModal();
                this.closeOrderDetails();
                this.loadUserOrders();
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

  closePaymentModal() {
    this.stopPolling();
    this.showPaymentModal = false;
    this.isVerifyingPayment = false;
    this.qrImageBase64 = '';
    this.cdr.detectChanges();
  }
}
