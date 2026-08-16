import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-suspended',
  imports: [],
  templateUrl: './suspended.html',
  styleUrl: './suspended.css',
})
export class Suspended {
  constructor(private router: Router) { }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  contactSupport() {
    // You can open a mail client or a contact form
    window.location.href = 'mailto:[EMAIL_ADDRESS]';
  }
}
