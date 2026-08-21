import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for @if directive
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { Sidebar } from '../sidebar/sidebar';
import { filter } from 'rxjs';
import { Auths } from '../../../Service/Auth/auths';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule,
    RouterOutlet,
    Navbar,
    Footer,
    Sidebar,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout implements OnInit {
  isSidebarOpen = false;

  constructor(private router: Router, private authsService: Auths) {

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {

        // Close mobile sidebar after route change
        this.isSidebarOpen = false;
        this.checkUserStatus();

      });

  }

  ngOnInit() {
    this.checkUserStatus();
  }

  checkUserStatus() {
    const token = localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('userData');

    if (token && userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        const userRole = userData.role || (userData.user && userData.user.role);
        const userId = userData.userId || userData.id || (userData.user && (userData.user.userId || userData.user.id));

        if (userRole === 'Customer' && userId) {
          this.authsService.getUserById(Number(userId)).subscribe({
            next: (res: any) => {
              const data = res?.data || res;
              const status = (data?.status || data?.Status || '').toString().trim().toLowerCase();

              // Update status in localStorage to keep it sync
              const updatedUserData = { ...userData };
              if (updatedUserData.user) {
                updatedUserData.user.status = data?.status || updatedUserData.user.status;
              } else {
                updatedUserData.status = data?.status || updatedUserData.status;
              }
              localStorage.setItem('userData', JSON.stringify(updatedUserData));

              if (status === 'suspended' || status === 'inactive') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                this.router.navigate(['/customer-suspended']);
              }
            },
            error: (err: any) => {
              console.error('Error checking customer status:', err);
              // Fallback to local storage check on error
              const status = (userData.status || (userData.user && userData.user.status) || '').toString().trim().toLowerCase();
              if (status === 'suspended' || status === 'inactive') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                this.router.navigate(['/customer-suspended']);
              }
            }
          });
        }
      } catch (e) {
        console.error('Error parsing user data in MainLayout', e);
      }
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}