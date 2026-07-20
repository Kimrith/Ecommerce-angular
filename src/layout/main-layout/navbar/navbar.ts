import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  @Output() toggleSidebarMobile = new EventEmitter<void>();

  onToggleSidebar() {
    this.toggleSidebarMobile.emit();
  }
}
