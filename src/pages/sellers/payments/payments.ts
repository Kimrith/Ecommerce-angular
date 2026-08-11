import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../Service/Payment/payment';
import { OrderService } from '../../../Service/Order/order';
import { ToastComponent } from '../../../shared/components/toast';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class Payments implements OnInit {
  sellerId: number = 0;

  // Summary Stats
  stats = {
    totalRevenue: 0,
    pendingPayout: 0,
    availableBalance: 0
  };

  // Transaction list (from payments)
  transactions: any[] = [];

  // Bakong Config Form
  config = {
    bakongId: '',
    merchantName: '',
    merchantCity: 'Phnom Penh',
    acquiringId: '',
    apiBaseUrl: 'https://api-bakong.nbc.gov.kh',
    token: '',
    qrString: '',
    qrImageBase64: ''
  };

  // UI Control States
  showConfigModal = false;
  showToast = false;
  toastMessage = '';

  // Helper map for your PaymentStatus enum
  private paymentStatusMap: { [key: number]: string } = {
    0: 'Pending',
    1: 'Completed',
    2: 'Failed',
    3: 'Refunded',
    4: 'Cancelled'
  };

  constructor(
    private paymentService: PaymentService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      const currentUser = JSON.parse(userDataStr);
      this.sellerId = currentUser.userId || currentUser.sellerId || 0;
      if (this.sellerId) {
        this.loadData();
      }
    }
  }

  loadData(): void {
    // 1. Load Seller Statistics
    this.orderService.getOrderStatistics(this.sellerId).subscribe({
      next: (res: any) => {
        this.stats.totalRevenue = res.totalRevenue || 0;
        this.stats.pendingPayout = (res.pendingCount || 0) * 15;
        this.stats.availableBalance = Math.max(0, this.stats.totalRevenue - this.stats.pendingPayout);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load payment statistics', err)
    });

    // 2. Load Transactions from Seller Payments Service matching your exact PascalCase payload
    this.paymentService.sellerPayments(this.sellerId, 1, 10).subscribe({
      next: (res: any) => {
        const paymentList = res.data || res.$values || [];

        let calculatedRevenue = 0;

        this.transactions = paymentList.map((p: any) => {
          // Since StatusString is "1" (the number as string), use PaymentStatus enum lookup
          let resolvedStatus = this.paymentStatusMap[p.Status] || 'Unknown';

          // Accumulate revenue if Completed (Status === 1)
          if (p.Status === 1) {
            calculatedRevenue += p.Amount || 0;
          }

          return {
            transactionId: p.OrderNumber || `#PAY-${p.Id}`,
            date: p.CreatedAt,
            amount: p.Amount,
            status: resolvedStatus
          };
        });

        this.stats.totalRevenue = calculatedRevenue;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load transaction history', err)
    });

    // 3. Load Bakong KHQR configuration
    this.paymentService.getSellerBakongConfig().subscribe({
      next: (res: any) => {
        if (res) {
          this.config = {
            bakongId: res.bakongId || '',
            merchantName: res.merchantName || '',
            merchantCity: res.merchantCity || 'Phnom Penh',
            acquiringId: res.acquiringId || '',
            apiBaseUrl: res.apiBaseUrl || 'https://api-bakong.nbc.gov.kh',
            token: res.token || '',
            qrString: res.qrString || '',
            qrImageBase64: res.qrImageBase64 || ''
          };
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.log('No existing KHQR config found', err);
      }
    });
  }

  saveConfig(): void {
    if (!this.config.bakongId || !this.config.merchantName) {
      this.triggerToast('Bakong ID and Merchant Name are required.');
      return;
    }

    this.paymentService.upsertSellerBakongConfig(this.config).subscribe({
      next: (res: any) => {
        this.triggerToast('KHQR configuration saved successfully.');
        this.showConfigModal = false;
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to save config', err);
        this.triggerToast(err.error?.message || 'Failed to save configuration.');
      }
    });
  }

  triggerToast(message: string): void {
    this.toastMessage = message;
    this.showToast = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = true;
      this.cdr.detectChanges();
    }, 10);
  }
}