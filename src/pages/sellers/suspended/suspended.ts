import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-suspended',
  standalone: true,
  imports: [],
  templateUrl: './suspended.html',
  styleUrl: './suspended.css',
})
export class Suspended {
  opentagglesupport = false

  constructor(private router: Router) { }

  navigateToLogin() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userStatus');
    this.router.navigate(['/login']);
  }

  contactSupport() {
    // window.location.href = 'mailto:cheykimrithdev@gmail.com';
    this.opentagglesupport = !this.opentagglesupport
  }
}