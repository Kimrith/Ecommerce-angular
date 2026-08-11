import { Component, AfterViewInit, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { Auths } from '../../../Service/Auth/auths';
import { ProductService } from '../../../Service/products/product-service';
import { OrderService } from '../../../Service/Order/order';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit {

  @ViewChild('salesChart') salesChart!: ElementRef;
  @ViewChild('orderChart') orderChart!: ElementRef;

  salesChartInstance: any;
  orderChartInstance: any;
  backendAnalytics: { labels: string[]; data: number[] } | null = null;

  stats = {
    totalUsers: 0,
    userGrowth: '+8%',
    activeSellers: 0,
    suspendSellers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    revenueGrowth: '+15%',
    ordersCount: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
  };

  recentOrders: any[] = [];
  systemStatus = {
    apiOnline: true,
    dbConnected: true,
    paymentActive: true
  };

  constructor(
    private http: HttpClient,
    private authService: Auths,
    private productService: ProductService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  initCharts() {
    this.salesChartInstance = new Chart(this.salesChart.nativeElement, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Revenue ($)',
            data: [0, 0, 0, 0, 0, 0],
            borderWidth: 3,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

    this.orderChartInstance = new Chart(this.orderChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Processing', 'Shipped', 'Pending', 'Cancelled'],
        datasets: [
          {
            data: [0, 0, 0, 0, 0],
            backgroundColor: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ef4444'],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

    // Apply loaded data if already fetched
    if (this.backendAnalytics) {
      this.updateSalesChart(this.backendAnalytics.labels, this.backendAnalytics.data);
    }
    this.updateOrderChart(
      this.stats.completedOrders,
      this.stats.processingOrders,
      this.stats.shippedOrders,
      this.stats.pendingOrders,
      this.stats.cancelledOrders
    );
  }

  loadDashboardData() {
    // 1. Fetch Users
    this.authService.getAllusers().subscribe({
      next: (res) => {
        const usersList = Array.isArray(res) ? res : res?.data || [];
        this.stats.totalUsers = usersList.length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching users:', err)
    });

    // 2. Fetch Sellers
    this.authService.getAllseller().subscribe({
      next: (res) => {
        let sellersList = [];
        if (Array.isArray(res)) {
          sellersList = res;
        } else if (res) {
          if (Array.isArray(res.data)) {
            sellersList = res.data;
          } else if (res.data && Array.isArray(res.data.$values)) {
            sellersList = res.data.$values;
          } else if (Array.isArray(res.sellers)) {
            sellersList = res.sellers;
          } else if (res.sellers && Array.isArray(res.sellers.$values)) {
            sellersList = res.sellers.$values;
          }
        }
        this.stats.activeSellers = sellersList.filter((s: any) => s.status === 'Active' || s.status === 0 || s.status === '0').length;
        this.stats.suspendSellers = sellersList.filter((s: any) => s.status === 'Suspended' || s.status === 1 || s.status === '1').length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching sellers:', err)
    });

    // 3. Fetch Product Statistics
    this.productService.ProductStatiStics().subscribe({
      next: (res) => {
        this.stats.totalProducts = res?.totalProducts || 0;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching product stats:', err)
    });

    // 4. Fetch Order Statistics & Revenue Analytics
    this.orderService.getOrderStatistics().subscribe({
      next: (res) => {
        this.stats.totalRevenue = res.totalRevenue;
        this.stats.ordersCount = res.totalOrders;
        this.stats.pendingOrders = res.pendingCount;
        this.stats.processingOrders = res.processingCount;
        this.stats.shippedOrders = res.shippedCount;
        this.stats.completedOrders = res.completedCount;
        this.stats.cancelledOrders = res.cancelledCount;

        if (res.analytics) {
          this.backendAnalytics = {
            labels: res.analytics.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            data: res.analytics.data || [0, 0, 0, 0, 0, 0]
          };
          this.updateSalesChart(res.analytics.labels, res.analytics.data);
        }
        this.updateOrderChart(
          res.completedCount,
          res.processingCount,
          res.shippedCount,
          res.pendingCount,
          res.cancelledCount
        );
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching order statistics:', err)
    });

    // 5. Fetch Recent Orders list
    this.orderService.getOrders().subscribe({
      next: (res) => {
        let ordersList = [];
        if (Array.isArray(res)) {
          ordersList = res;
        } else if (res && Array.isArray(res.$values)) {
          ordersList = res.$values;
        } else if (res && Array.isArray(res.data)) {
          ordersList = res.data;
        }
        this.recentOrders = ordersList.slice(0, 5);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching recent orders:', err)
    });
  }

  updateSalesChart(labels: string[], data: number[]) {
    if (this.salesChartInstance) {
      this.salesChartInstance.data.labels = labels;
      this.salesChartInstance.data.datasets[0].data = data;
      this.salesChartInstance.update();
    }
  }

  updateOrderChart(completed: number, processing: number, shipped: number, pending: number, cancelled: number) {
    if (this.orderChartInstance) {
      this.orderChartInstance.data.datasets[0].data = [completed, processing, shipped, pending, cancelled];
      this.orderChartInstance.update();
    }
  }
}