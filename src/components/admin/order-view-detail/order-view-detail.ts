import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../Service/Order/order';

@Component({
  selector: 'app-order-view-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-view-detail.html'
})
export class OrderViewDetail implements OnInit {
  @Input() order: any = null;
  @Output() close = new EventEmitter<void>();

  orderItems: any[] = [];
  isLoading = true;

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadOrderItems();
  }

  loadOrderItems() {
    if (!this.order?.id) return;
    this.isLoading = true;
    this.cdr.detectChanges();

    this.orderService.getOrderItemsByOrderId(this.order.id).subscribe({
      next: (items) => {
        console.log('API Response Items:', items);
        this.orderItems = items || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching order items:', err);
        this.orderItems = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeModal() {
    this.close.emit();
  }
}