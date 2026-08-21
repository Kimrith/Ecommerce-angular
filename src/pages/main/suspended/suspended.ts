import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-suspended',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suspended.html',
  styleUrl: './suspended.css',
})
export class CustomerSuspended {
  isContactOpen = false;

  constructor(private router: Router) { }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  contactSupport() {
    this.isContactOpen = !this.isContactOpen;
  }
}
