import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderTables } from '../../../components/sellers/order-tables/order-tables';
import { Pagination } from '../../../shared/components/sellers-layout/pagination/pagination';
import { OrderService } from '../../../Service/Order/order';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [OrderTables, Pagination, CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  selectedStatus: string = '';
  pageNumber: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;

  stats: any = {
    totalOrders: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0
  };

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics() {
    const userDataStr = localStorage.getItem('userData');
    const currentUser = userDataStr ? JSON.parse(userDataStr) : {};
    const sellerId = currentUser.userId || currentUser.sellerId || 24;

    this.orderService.getOrderStatistics(sellerId).subscribe({
      next: (res: any) => {
        this.stats = {
          totalOrders: res.totalOrders ?? 0,
          pending: res.pendingCount ?? res.pending ?? 0,
          processing: res.processingCount ?? res.processing ?? 0,
          shipped: res.shippedCount ?? res.shipped ?? 0,
          delivered: res.completedCount ?? res.deliveredCount ?? res.completed ?? res.delivered ?? 0,
          cancelled: res.cancelledCount ?? res.cancelled ?? 0,
          refunded: res.refundedCount ?? res.refunded ?? 0
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load order statistics', err);
      }
    });
  }

  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.pageNumber = 1;
    this.cdr.detectChanges();
  }

  onPageChanged(page: number) {
    this.pageNumber = page;
    this.cdr.detectChanges();
  }
}
