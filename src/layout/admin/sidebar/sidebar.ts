import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private router = inject(Router);

  logoutToggle = false;

  openLogoutModal(): void {
    this.logoutToggle = true;
  }

  cancelLogout(): void {
    this.logoutToggle = false;
  }

  logout(): void {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    this.logoutToggle = false;
    this.router.navigate(['/login']);
  }
}