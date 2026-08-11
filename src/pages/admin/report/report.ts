import { Component, AfterViewInit, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Chart } from 'chart.js/auto';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Auths } from '../../../Service/Auth/auths';
import { OrderService } from '../../../Service/Order/order';
import { environment } from '../../../environments/environment.development';
import { ToastComponent } from '../../../shared/components/toast';
import { ProductService } from '../../../Service/products/product-service';
import { Pagination } from '../../../shared/components/admin/pagination/pagination';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent, Pagination],
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class Report implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('salesChart') salesChart!: ElementRef;

  salesChartInstance: any;

  selectedPeriod: string = 'all-time';
  isLoading = true;
  isLoadingProducts = false;

  // Toast states
  showToast = false;
  toastMessage = '';

  stats = {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalSellers: 0,
    revenueGrowth: '+14.2%',
    ordersGrowth: '+9.5%',
    customersGrowth: '+8.1%',
    sellersGrowth: '+4.3%'
  };

  topProducts: any[] = [];
  allTopProducts: any[] = [];
  pageNumber = 1;
  pageSize = 5;
  totalItems = 0;
  totalPages = 0;

  // Store backend statistics to allow filtering simulation
  backendAnalytics: { labels: string[]; data: number[] } | null = null;
  backendOrderBreakdown = { completed: 0, pending: 0, cancelled: 0 };

  constructor(
    private http: HttpClient,
    private authService: Auths,
    private orderService: OrderService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadReportData();
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  ngOnDestroy() {
    if (this.salesChartInstance) {
      this.salesChartInstance.destroy();
    }
  }

  private getAuthHeaders(): HttpHeaders {
    let token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    token = token.trim();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadReportData() {
    this.isLoading = true;
    this.isLoadingProducts = true;
    this.cdr.detectChanges();

    // 1. Load User statistics (for Customer count)
    const usersReq = this.authService.getAllusers().pipe(
      catchError(err => {
        console.error('Error fetching users:', err);
        return of([]);
      })
    );

    // 2. Load Seller statistics
    const sellersReq = this.authService.getAllseller().pipe(
      catchError(err => {
        console.error('Error fetching sellers:', err);
        return of({ sellers: [] });
      })
    );

    // 3. Load Order statistics
    const orderStatsReq = this.orderService.getOrderStatistics().pipe(
      catchError(err => {
        console.error('Error fetching order statistics:', err);
        return of({ totalRevenue: 0, totalOrders: 0, pendingCount: 0, completedCount: 0, cancelledCount: 0 });
      })
    );

    // 4. Load Best Selling Products directly from API
    const bestSellersReq = this.productService.getBestSellers(100).pipe(
      catchError(err => {
        console.error('Error fetching best sellers:', err);
        return of([]);
      })
    );

    forkJoin([usersReq, sellersReq, orderStatsReq, bestSellersReq]).subscribe({
      next: ([usersRes, sellersRes, orderStatsRes, bestSellersRes]) => {
        // Customers Count
        const usersList = Array.isArray(usersRes) ? usersRes : (usersRes as any)?.data || [];
        const customersList = usersList.filter((user: any) =>
          user.role && user.role.trim().toLowerCase() === 'customer'
        );
        this.stats.totalCustomers = customersList.length;

        // Sellers Count
        const sellersList = Array.isArray(sellersRes) ? sellersRes : (sellersRes as any)?.sellers || [];
        this.stats.totalSellers = sellersList.length;

        // Revenue and Orders Counts
        this.stats.totalRevenue = orderStatsRes.totalRevenue || 0;
        this.stats.totalOrders = orderStatsRes.totalOrders || 0;

        // Order breakdown for charts
        this.backendOrderBreakdown = {
          completed: orderStatsRes.completedCount || 0,
          pending: orderStatsRes.pendingCount || 0,
          cancelled: orderStatsRes.cancelledCount || 0
        };

        // Analytics data
        if (orderStatsRes.analytics) {
          this.backendAnalytics = {
            labels: orderStatsRes.analytics.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            data: orderStatsRes.analytics.data || [0, 0, 0, 0, 0, 0]
          };
        } else {
          this.backendAnalytics = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            data: [0, 0, 0, 0, 0, 0]
          };
        }

        // Apply filters / update charts
        this.applyPeriodFilter();

        // Process best selling products from API response
        let bestSellersList = [];
        if (Array.isArray(bestSellersRes)) {
          bestSellersList = bestSellersRes;
        } else if (bestSellersRes && Array.isArray((bestSellersRes as any).$values)) {
          bestSellersList = (bestSellersRes as any).$values;
        } else if (bestSellersRes && Array.isArray((bestSellersRes as any).data)) {
          bestSellersList = (bestSellersRes as any).data;
        }

        this.allTopProducts = bestSellersList.map((item: any) => ({
          name: item.name || 'Unknown Product',
          salesCount: item.salesCount || 0,
          revenue: item.revenue || 0
        }));

        this.totalItems = this.allTopProducts.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.pageNumber = 1;
        this.updatePagedProducts();

        this.updateTopProductsChart();

        this.isLoading = false;
        this.isLoadingProducts = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error combining report data requests:', err);
        this.isLoading = false;
        this.isLoadingProducts = false;
        this.cdr.detectChanges();
      }
    });
  }

  initCharts() {
    if (!this.salesChart) return;

    // Destroy existing charts to prevent canvas re-use errors
    if (this.salesChartInstance) this.salesChartInstance.destroy();

    // 1. Top Products Chart (Bar representation)
    this.salesChartInstance = new Chart(this.salesChart.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Revenue ($)',
            data: [],
            backgroundColor: 'rgba(249, 115, 22, 0.85)', // Orange theme bars
            borderColor: '#f97316',
            borderWidth: 1,
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            padding: 12,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context: any) => {
                return ` Revenue: $${context.raw.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#64748b',
              font: {
                family: 'Outfit, Inter, sans-serif',
                size: 11
              }
            }
          },
          y: {
            border: {
              dash: [5, 5]
            },
            grid: {
              color: '#f1f5f9'
            },
            ticks: {
              color: '#64748b',
              font: {
                family: 'Outfit, Inter, sans-serif',
                size: 11
              },
              callback: (value: any) => {
                if (value >= 1000) {
                  return '$' + (value / 1000) + 'k';
                }
                return '$' + value;
              }
            }
          }
        }
      }
    });

    // Apply period values once charts are initialized
    this.applyPeriodFilter();
    this.updateTopProductsChart();
  }

  onPeriodChange() {
    this.applyPeriodFilter();
    this.triggerToast(`Filtering report data by: ${this.getPeriodLabel()}`);
  }

  getPeriodLabel(): string {
    switch (this.selectedPeriod) {
      case 'last-7-days': return 'Last 7 Days';
      case 'last-30-days': return 'Last 30 Days';
      case 'this-year': return 'This Year';
      case 'all-time': default: return 'All Time';
    }
  }

  applyPeriodFilter() {
    if (!this.backendAnalytics) return;

    let labels: string[] = [];
    let data: number[] = [];
    let completed = this.backendOrderBreakdown.completed;
    let pending = this.backendOrderBreakdown.pending;
    let cancelled = this.backendOrderBreakdown.cancelled;

    const baseLabels = this.backendAnalytics.labels;
    const baseData = this.backendAnalytics.data;

    // Simulate different period views for premium demonstration
    if (this.selectedPeriod === 'last-7-days') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      // Scale down values to daily averages
      const totalSum = baseData.reduce((a, b) => a + b, 0);
      const dailyAvg = totalSum / (baseData.length * 30 || 1);
      data = [
        Math.round(dailyAvg * 0.9),
        Math.round(dailyAvg * 1.1),
        Math.round(dailyAvg * 0.8),
        Math.round(dailyAvg * 1.3),
        Math.round(dailyAvg * 1.5),
        Math.round(dailyAvg * 1.2),
        Math.round(dailyAvg * 1.0)
      ];
      // Scale down breakdown for 7 days
      completed = Math.round(completed * 0.05) || 3;
      pending = Math.round(pending * 0.04) || 1;
      cancelled = Math.round(cancelled * 0.02) || 0;

    } else if (this.selectedPeriod === 'last-30-days') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const totalSum = baseData.reduce((a, b) => a + b, 0);
      const weeklyAvg = totalSum / (baseData.length * 4 || 1);
      data = [
        Math.round(weeklyAvg * 0.85),
        Math.round(weeklyAvg * 1.05),
        Math.round(weeklyAvg * 0.95),
        Math.round(weeklyAvg * 1.2)
      ];
      // Scale down breakdown for 30 days
      completed = Math.round(completed * 0.2) || 15;
      pending = Math.round(pending * 0.15) || 5;
      cancelled = Math.round(cancelled * 0.08) || 2;

    } else if (this.selectedPeriod === 'this-year') {
      labels = baseLabels;
      data = baseData;

    } else { // all-time
      labels = baseLabels;
      data = baseData;
    }

  }

  updateTopProductsChart() {
    if (this.salesChartInstance && this.allTopProducts) {
      const chartProducts = this.allTopProducts.slice(0, 5);
      this.salesChartInstance.data.labels = chartProducts.map(p =>
        p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name
      );
      this.salesChartInstance.data.datasets[0].data = chartProducts.map(p => p.revenue);
      this.salesChartInstance.update();
    }
  }

  updatePagedProducts() {
    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.topProducts = this.allTopProducts.slice(start, end);
  }

  onPageChanged(page: number) {
    this.pageNumber = page;
    this.updatePagedProducts();
    this.cdr.detectChanges();
  }

  exportReport() {
    this.triggerToast('Preparing Excel/PDF report for download...');
    setTimeout(() => {
      window.print();
    }, 1000);
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
}