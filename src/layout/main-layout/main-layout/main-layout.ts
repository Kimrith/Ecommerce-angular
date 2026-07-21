import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for @if directive
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { Sidebar } from '../sidebar/sidebar';
import { filter } from 'rxjs';

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
export class MainLayout {
  isSidebarOpen = false;

  constructor(private router: Router) {

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {

        // Close mobile sidebar after route change
        this.isSidebarOpen = false;

      });

  }


  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}