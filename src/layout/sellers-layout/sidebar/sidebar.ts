import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLinkActive, RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private router = inject(Router);
  logoutToggle = false;

  clearData() {
    this.logoutToggle = true;
  }

  cancelLogout() {
    this.logoutToggle = false;
  }

  logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    this.logoutToggle = false;
    this.router.navigate(['/login']); // Redirect to login or home
  }
}