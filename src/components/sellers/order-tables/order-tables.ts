import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../Service/Order/order';
import { forkJoin, of, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { OrderViewDetail } from '../../admin/order-view-detail/order-view-detail';
import { ToastComponent } from '../../../shared/components/toast';

@Component({
  selector: 'app-order-tables',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderViewDetail, ToastComponent],
  templateUrl: './order-tables.html',
  styleUrl: './order-tables.css',
})
export class OrderTables implements OnInit, OnChanges {
  @Output() totalItemsChange = new EventEmitter<number>();
  @Output() totalPagesChange = new EventEmitter<number>();
  @Output() statusChanged = new EventEmitter<void>();

  selectedOrder: any = null;
  showViewDetail = false;
  showToast = false;
  toastMessage = '';
  orders: any[] = [];
  totalItems = 0;
  totalPages = 1;
  searchTerm: string = '';
  status = '';

  private _selectedStatus: string = '';
  @Input()
  get selectedStatus(): string {
    return this._selectedStatus;
  }
  set selectedStatus(val: string) {
    this._selectedStatus = val;
    this._pageNumber = 1;
    this.loadOrders();
  }

  private _pageNumber: number = 1;
  @Input()
  get pageNumber(): number {
    return this._pageNumber;
  }
  set pageNumber(val: number) {
    this._pageNumber = val;
    this.loadOrders();
  }

  private _pageSize: number = 10;
  @Input()
  get pageSize(): number {
    return this._pageSize;
  }
  set pageSize(val: number) {
    this._pageSize = val;
    this.loadOrders();
  }

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.emitPaginationInfo();
  }

  emitPaginationInfo(): void {
    setTimeout(() => {
      this.totalItemsChange.emit(this.totalItems);
      this.totalPagesChange.emit(this.totalPages);
    });
  }

  loadOrders(): void {
    const userDataStr = localStorage.getItem('userData');
    const currentUser = userDataStr ? JSON.parse(userDataStr) : {};
    const sellerId = currentUser.userId || currentUser.sellerId || 24;

    const params = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      status: this.selectedStatus || undefined,
      searchTerm: this.searchTerm || undefined
    };
    
    console.log('loadOrders called with params:', params);

    // 1. Fetch orders from the API first
    this.orderService.getSellerOrder(sellerId, params).subscribe({
      next: (res: any) => {
        console.log('loadOrders API Response:', res);
        const orderList = res.data || [];

        // Map initial order state and set payment status to 'Checking...'
        this.orders = orderList.map((order: any) => ({
          ...order,
          statusString: this.mapOrderStatus(order.status),
          paymentStatus: 'Checking...'
        }));

        this.totalItems = res.totalItems || 0;
        this.totalPages = res.totalPages || 1;
        this.cdr.detectChanges();
        this.emitPaginationInfo();

        // 2. Verify payments individually in the background
        this.orders.forEach((order: any, index: number) => {
          this.orderService.verifyPayment(order.id).subscribe({
            next: (paymentRes: any) => {
              let rawStatus = 'Unpaid';
              if (paymentRes) {
                if (paymentRes.message && paymentRes.message.toLowerCase().includes('not found')) {
                  rawStatus = 'Unpaid';
                } else {
                  rawStatus = paymentRes?.status || paymentRes?.paymentStatus || paymentRes?.data?.status || (paymentRes === true || paymentRes?.success === true ? 'Paid' : 'Unpaid');
                }
              }

              // Create new reference to trigger change detection
              this.orders[index] = { ...order, paymentStatus: rawStatus };
              this.cdr.markForCheck();
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error(`Failed to verify payment for order ${order.id}`, err);

              let rawStatus = 'Failed';
              const errorBody = err?.error;
              if (errorBody && (errorBody.message || errorBody.Message)) {
                const msg = (errorBody.message || errorBody.Message).toLowerCase();
                if (msg.includes('not found')) {
                  rawStatus = 'Unpaid';
                }
              }

              this.orders[index] = { ...order, paymentStatus: rawStatus };
              this.cdr.markForCheck();
              this.cdr.detectChanges();
            }
          });
        });
      },
      error: (err) => {
        console.error('Failed to load seller orders', err);
      }
    });
  }

  onSearchChange() {
    this._pageNumber = 1;
    this.loadOrders();
  }

  get filteredOrders() {
    let temp = [...this.orders];

    if (this.selectedStatus !== undefined && this.selectedStatus !== '') {
      temp = temp.filter(o => {
        const orderStatusVal = o.status;
        const filterStatusVal = this.selectedStatus;

        if (o.statusString?.toLowerCase() === filterStatusVal.toLowerCase()) return true;

        const orderStatusNum = Number(orderStatusVal);
        const filterStatusNum = Number(filterStatusVal);
        if (!isNaN(orderStatusNum) && !isNaN(filterStatusNum) && orderStatusNum === filterStatusNum) return true;

        return false;
      });
    }

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase().trim();
      temp = temp.filter(o =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(search)) ||
        (o.customerName && o.customerName.toLowerCase().includes(search)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(search))
      );
    }

    return temp;
  }

  mapOrderStatus(status: any): string {
    if (typeof status === 'number') {
      switch (status) {
        case 0: return 'Pending';
        case 1: return 'Processing';
        case 2: return 'Shipped';
        case 3: return 'Delivered';
        case 4: return 'Cancelled';
        case 5: return 'Refunded';
        case 6: return 'Suspended';
        default: return 'Unknown';
      }
    }

    switch (status?.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      case 'refunded': return 'Refunded';
      case 'suspended': return 'Suspended';
      default: return status || 'Unknown';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-slate-100 text-slate-700';
      case 'processing': return 'bg-yellow-100 text-yellow-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'completed':
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled':
      case 'refunded': return 'bg-red-100 text-red-700';
      case 'suspended': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'success':
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending':
      case 'processing': return 'bg-yellow-100 text-yellow-700';
      case 'checking...': return 'bg-yellow-100 text-yellow-700 animate-pulse';
      case 'failed':
      case 'unpaid': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  viewOrder(order: any) {
    this.selectedOrder = order;
    this.showViewDetail = true;
  }

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showToast = false;
    setTimeout(() => {
      this.showToast = true;
      this.cdr.detectChanges();
    }, 10);
  }

  onStatusChange(order: any, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newStatusVal = select.value;

    let numericStatus = 0;
    switch (newStatusVal) {
      case 'Pending': numericStatus = 0; break;
      case 'Processing': numericStatus = 1; break;
      case 'Shipped': numericStatus = 2; break;
      case 'Delivered': numericStatus = 3; break;
      case 'Cancelled': numericStatus = 4; break;
      case 'Refunded': numericStatus = 5; break;
      case 'Suspended': numericStatus = 6; break;
      default: return;
    }

    this.orderService.updateOrderStatus(order.id, numericStatus).subscribe({
      next: () => {
        order.statusString = newStatusVal;
        order.status = numericStatus;
        this.triggerToast(`Order status updated to ${newStatusVal} successfully.`);
        this.statusChanged.emit();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.triggerToast(err.error?.message || err.error?.Message || 'Failed to update order status.');
        select.value = order.statusString;
        this.cdr.detectChanges();
      }
    });
  }
}