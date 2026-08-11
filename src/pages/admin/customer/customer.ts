import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auths } from '../../../Service/Auth/auths';
import { environment } from '../../../environments/environment.development';
import { CustomerViewDetail } from '../../../components/admin/customer-view-detail/customer-view-detail';
import { ToastComponent } from '../../../shared/components/toast';
import { Pagination } from '../../../shared/components/admin/pagination/pagination';

@Component({
  selector: 'app-customer',
  imports: [CommonModule, CustomerViewDetail, ToastComponent, FormsModule, Pagination],
  standalone: true,
  templateUrl: './customer.html',
  styleUrl: './customer.css',
})
export class Customer implements OnInit {

  imageUrl = environment.apiUrl;
  allUsers: any[] = [];
  users: any[] = [];
  paginatedUsers: any[] = [];
  selectedUser: any = null;
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
    totalCustomers: 0,
    activeCustomers: 0,
    suspendedCustomers: 0
  };

  constructor(private Auths: Auths, private cdr: ChangeDetectorRef) { }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    let base = this.imageUrl;
    if (base.includes('localhost:7223') || base.includes('127.0.0.1:7223')) {
      base = base.replace('7223', '5117').replace('https://', 'http://');
    }

    const baseClean = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return baseClean + cleanPath;
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.Auths.getAllusers().subscribe({
      next: (res) => {
        let rawUsers = [];
        if (Array.isArray(res)) {
          rawUsers = res;
        } else if (res) {
          rawUsers = res.data ? res.data : [res];
        }

        this.allUsers = rawUsers.filter((user: any) =>
          user.role && user.role.trim().toLowerCase() === 'customer'
        );
        this.calculateStats();
        this.applyFilters(false);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching users:', err)
    });
  }

  calculateStats() {
    this.stats.totalCustomers = this.allUsers.length;
    this.stats.activeCustomers = this.allUsers.filter(u => this.getStatusValue(u.status) === 'Active').length;
    this.stats.suspendedCustomers = this.allUsers.filter(u => this.getStatusValue(u.status) === 'Suspended').length;
  }

  getStatusValue(statusStr: any): string {
    if (!statusStr) return '';
    const s = statusStr.toString().trim().toLowerCase();
    if (s === 'active') return 'Active';
    if (s === 'suspended' || s === 'inactive') return 'Suspended';
    return statusStr.toString().trim();
  }

  applyFilters(resetPage: boolean = true) {
    if (resetPage) {
      this.pageNumber = 1;
    }

    let temp = [...this.allUsers];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase().trim();
      temp = temp.filter(user =>
        (user.fullName && user.fullName.toLowerCase().includes(search)) ||
        (user.email && user.email.toLowerCase().includes(search))
      );
    }

    if (this.selectedStatus && this.selectedStatus !== '') {
      const statusVal = this.selectedStatus.toLowerCase();
      temp = temp.filter(user => {
        const uStatus = (user.status || '').toLowerCase();
        if (statusVal === 'active') {
          return uStatus === 'active';
        } else if (statusVal === 'suspended') {
          return uStatus === 'suspended' || uStatus === 'inactive';
        }
        return uStatus === statusVal;
      });
    }

    this.users = temp;
    this.totalItems = temp.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;

    // Reset/Clamp pageNumber if it exceeds totalPages
    if (this.pageNumber > this.totalPages) {
      this.pageNumber = this.totalPages;
    }

    this.updatePaginatedUsers();
  }

  updatePaginatedUsers() {
    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedUsers = this.users.slice(start, end);
  }

  onPageChange(newPage: number) {
    this.pageNumber = newPage;
    this.updatePaginatedUsers();
    this.cdr.detectChanges();
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  viewUser(userId: number) {
    this.selectedUser = this.allUsers.find(u => u.userId === userId);
    this.showViewDetail = true;
  }

  Suspended(userId: number | string) {
    this.Auths.suspendUser(userId as number).subscribe({
      next: (res) => {
        console.log('User suspended:', res);
        this.triggerToast('Customer account suspended successfully.');
        this.loadUsers();
      },
      error: (err) => console.error('Error suspending user:', err)
    });
  }

  reactivateUser(userId: number | string) {
    this.Auths.reactivateUser(userId as number).subscribe({
      next: (res) => {
        console.log('User reactivated:', res);
        this.triggerToast('Customer account reactivated successfully.');
        this.loadUsers();
      },
      error: (err) => console.error('Error reactivating user:', err)
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

  searchCustomers() {
    this.applyFilters(true);
    this.cdr.detectChanges();
  }

  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.applyFilters(true);
    this.cdr.detectChanges();
  }
}