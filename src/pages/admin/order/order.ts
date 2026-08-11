import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment.development';
import { ToastComponent } from '../../../shared/components/toast';
import { OrderViewDetail } from '../../../components/admin/order-view-detail/order-view-detail';
import { OrderService } from '../../../Service/Order/order';
import { Pagination } from '../../../shared/components/admin/pagination/pagination';

@Component({
  selector: 'app-order',
  imports: [CommonModule, FormsModule, ToastComponent, OrderViewDetail, Pagination],
  standalone: true,
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order implements OnInit {

  imageUrl = environment.apiUrl;
  allOrders: any[] = [];
  orders: any[] = [];
  paginatedOrders: any[] = [];
  selectedOrder: any = null;
  showViewDetail = false;

  // Pagination states
  pageNumber: number = 1;
  pageSize: number = 7;
  totalItems: number = 0;
  totalPages: number = 1;

  // Toast states
  showToast = false;
  toastMessage = '';

  // Filter & Search state variables
  searchTerm: string = '';
  selectedStatus: string = '';

  stats = {
    totalOrders: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
    suspended: 0
  };

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getOrders().subscribe({
      next: (res) => {
        console.log('Raw orders response:', res);
        let rawOrders = [];
        if (Array.isArray(res)) {
          rawOrders = res;
        } else if (res) {
          if (Array.isArray(res.$values)) {
            rawOrders = res.$values;
          } else if (res.orders) {
            rawOrders = Array.isArray(res.orders) ? res.orders : (res.orders.$values || []);
          } else if (res.data) {
            rawOrders = Array.isArray(res.data) ? res.data : (res.data.$values || []);
          } else {
            rawOrders = [res];
          }
        }

        // Normalize properties to support both C# PascalCase and JS camelCase
        this.allOrders = rawOrders.map((o: any) => {
          const id = o.Id !== undefined ? o.Id : o.id;
          const orderNumber = o.OrderNumber || o.orderNumber || '';
          const customerName = o.CustomerName || o.customerName || '';
          const customerEmail = o.CustomerEmail || o.customerEmail || '';
          const createdAt = o.CreatedAt || o.createdAt;
          const totalAmount = o.TotalAmount !== undefined ? o.TotalAmount : o.totalAmount;
          const currency = o.Currency || o.currency || 'USD';
          const status = o.Status !== undefined ? o.Status : o.status;
          const statusString = o.StatusString || o.statusString || '';

          return {
            ...o,
            id,
            orderNumber,
            customerName,
            customerEmail,
            createdAt,
            totalAmount,
            currency,
            status,
            statusString: this.getStatusText(status, statusString)
          };
        });
        console.log('Processed allOrders:', this.allOrders);
        this.calculateStats();
        this.applyFilters(false);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching orders:', err)
    });
  }

  getStatusText(statusVal: any, statusStr: string): string {
    // 1. If statusVal is a non-numeric string enum (e.g. 'Suspended'), return it directly
    if (typeof statusVal === 'string' && isNaN(Number(statusVal))) {
      return statusVal;
    }

    // 2. If statusStr is a non-numeric string enum, return it directly
    const str = (statusStr || '').toString().trim();
    if (str && isNaN(Number(str))) {
      return str;
    }

    // 3. Fallback to numeric checks
    const val = parseInt(statusVal ?? str, 10);
    switch (val) {
      case 0: return 'Pending';
      case 1: return 'Processing';
      case 2: return 'Shipped';
      case 3: return 'Delivered';
      case 4: return 'Cancelled';
      case 5: return 'Refunded';
      case 6: return 'Suspended';
      default: return str || 'Pending';
    }
  }

  calculateStats() {
    this.stats.totalOrders = this.allOrders.length;
    this.stats.pending = this.allOrders.filter((o: any) => o.statusString === 'Pending').length;
    this.stats.processing = this.allOrders.filter((o: any) => o.statusString === 'Processing').length;
    this.stats.shipped = this.allOrders.filter((o: any) => o.statusString === 'Shipped').length;
    this.stats.delivered = this.allOrders.filter((o: any) => o.statusString === 'Delivered').length;
    this.stats.cancelled = this.allOrders.filter((o: any) => o.statusString === 'Cancelled').length;
    this.stats.refunded = this.allOrders.filter((o: any) => o.statusString === 'Refunded').length;
    this.stats.suspended = this.allOrders.filter((o: any) => o.statusString === 'Suspended').length;
  }

  loadStats() {
    // Stats are calculated locally to support all order statuses.
  }

  applyFilters(resetPage: boolean = true) {
    if (resetPage) {
      this.pageNumber = 1;
    }

    let temp = [...this.allOrders];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase().trim();
      const cleanSearch = search.startsWith('#') ? search.substring(1) : search;
      temp = temp.filter((order: any) =>
        (order.id && order.id.toString().includes(cleanSearch)) ||
        (order.orderNumber && order.orderNumber.toLowerCase().includes(search)) ||
        (order.customerName && order.customerName.toLowerCase().includes(search)) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(search))
      );
    }

    if (this.selectedStatus && this.selectedStatus !== '') {
      const statusVal = this.selectedStatus.toLowerCase();
      temp = temp.filter((order: any) => {
        const oStatus = (order.statusString || '').toLowerCase();
        if (statusVal === 'completed' || statusVal === 'delivered') {
          return oStatus === 'completed' || oStatus === 'delivered';
        }
        return oStatus === statusVal;
      });
    }

    this.orders = temp;
    this.totalItems = temp.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;

    if (this.pageNumber > this.totalPages) {
      this.pageNumber = this.totalPages;
    }

    this.updatePaginatedOrders();
  }

  updatePaginatedOrders() {
    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedOrders = this.orders.slice(start, end);
  }

  onPageChange(newPage: number) {
    this.pageNumber = newPage;
    this.updatePaginatedOrders();
    this.cdr.detectChanges();
  }

  searchOrders() {
    this.applyFilters(true);
    this.cdr.detectChanges();
  }

  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.applyFilters(true);
    this.cdr.detectChanges();
  }

  viewOrder(order: any) {
    this.selectedOrder = order;
    this.showViewDetail = true;
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
        this.calculateStats();
        this.applyFilters(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.triggerToast(err.error?.message || err.error?.Message || 'Failed to update order status.');
        select.value = order.statusString;
      }
    });
  }

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showToast = false;
    setTimeout(() => {
      this.showToast = true;
      this.cdr.detectChanges();
    }, 10);
  }
}