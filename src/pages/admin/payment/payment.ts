import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../Service/Payment/payment';
import { Pagination } from '../../../shared/components/admin/pagination/pagination';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, Pagination],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class Payment implements OnInit {
  stats = {
    totalRevenue: 0,
    completedPayments: 0,
    pendingPayments: 0,
    refunds: 0
  };

  allPayments: any[] = [];
  payments: any[] = []; // Used in template loop
  paginatedPayments: any[] = [];
  selectedStatus: string = '';
  searchTerm: string = '';

  // Pagination states
  pageNumber: number = 1;
  pageSize: number = 7;
  totalItems: number = 0;
  totalPages: number = 1;

  constructor(
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPayments();
    this.loadStats();
  }

  loadPayments() {
    this.paymentService.getPayments().subscribe({
      next: (res) => {
        console.log('Raw payments data from API:', res);
        let rawPayments = [];
        if (Array.isArray(res)) {
          rawPayments = res;
        } else if (res) {
          if (Array.isArray(res.$values)) {
            rawPayments = res.$values;
          } else if (res.payments) {
            rawPayments = Array.isArray(res.payments) ? res.payments : (res.payments.$values || []);
          } else if (res.data) {
            rawPayments = Array.isArray(res.data) ? res.data : (res.data.$values || []);
          } else {
            rawPayments = [res];
          }
        }

        this.allPayments = rawPayments.map((p: any) => {
          const statusVal = p.Status !== undefined ? p.Status : p.status;
          const statusStr = p.StatusString || p.statusString || '';
          return {
            ...p,
            StatusText: this.getStatusText(statusVal, statusStr)
          };
        });
        console.log('Processed allPayments:', this.allPayments);
        this.applyFilters(false);
      },
      error: (err) => {
        console.error('Failed to load payments:', err);
      }
    });
  }

  getStatusText(statusVal: any, statusStr: string): string {
    const str = (statusStr || '').toString().trim();
    if (str && str !== '0' && str !== '1' && str !== '2' && str !== '3' && str !== '4' && str !== '5') {
      return str; // e.g. "Completed", "Pending", "Failed"
    }

    // Fallback to numeric checks
    const val = parseInt(statusVal ?? str, 10);
    switch (val) {
      case 0: return 'Pending';
      case 1: return 'Completed';
      case 2: return 'Failed';
      case 3: return 'Refunded';
      case 4: return 'Cancelled';
      default: return str || 'Unknown';
    }
  }

  loadStats() {
    this.paymentService.getPaymentStatistics().subscribe({
      next: (res) => {
        this.stats.totalRevenue = res.totalRevenue ?? 0;
        this.stats.completedPayments = res.completedCount ?? 0;
        this.stats.pendingPayments = res.pendingCount ?? 0;
        this.stats.refunds = res.refundAmount ?? 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load stats:', err);
      }
    });
  }

  applyFilters(resetPage: boolean = true) {
    if (resetPage) {
      this.pageNumber = 1;
    }

    let temp = [...this.allPayments];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase().trim();
      temp = temp.filter((p: any) => {
        const id = p.Id !== undefined ? p.Id : p.id;
        const orderNumber = p.OrderNumber || p.orderNumber || '';
        const customerName = p.CustomerName || p.customerName || '';
        const customerEmail = p.CustomerEmail || p.customerEmail || '';
        return (
          (id && id.toString().includes(search)) ||
          (orderNumber && orderNumber.toLowerCase().includes(search)) ||
          (customerName && customerName.toLowerCase().includes(search)) ||
          (customerEmail && customerEmail.toLowerCase().includes(search))
        );
      });
    }

    if (this.selectedStatus && this.selectedStatus !== '') {
      const statusVal = this.selectedStatus.toLowerCase();
      temp = temp.filter((p: any) => (p.StatusText || '').toLowerCase() === statusVal);
    }

    this.payments = temp;
    this.totalItems = temp.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;

    // Reset/Clamp pageNumber if it exceeds totalPages
    if (this.pageNumber > this.totalPages) {
      this.pageNumber = this.totalPages;
    }

    this.updatePaginatedPayments();
    this.cdr.detectChanges();
  }

  updatePaginatedPayments() {
    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedPayments = this.payments.slice(start, end);
    console.log('Paginated payments for current page:', this.paginatedPayments);
  }

  onPageChange(newPage: number) {
    this.pageNumber = newPage;
    this.updatePaginatedPayments();
    this.cdr.detectChanges();
  }

  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.applyFilters(true);
  }

  viewPayment(payment: any) {
    alert(`Payment Details:\nTransaction ID: ${payment.Id || payment.id}\nOrder ID: ${payment.OrderId || payment.orderId || 'N/A'}\nCustomer: ${payment.CustomerName || payment.customerName || 'N/A'}\nAmount: $${payment.Amount || payment.amount || 0}\nStatus: ${payment.StatusText || 'N/A'}\nCreated At: ${payment.CreatedAt || payment.createdAt || 'N/A'}`);
  }
}
