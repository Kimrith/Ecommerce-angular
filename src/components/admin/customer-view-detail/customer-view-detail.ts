import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-customer-view-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-view-detail.html'
})
export class CustomerViewDetail {
  @Input() user: any = null; // Pass the selected user object here
  @Output() close = new EventEmitter<void>();

  imageUrl = environment.apiUrl;

  closeModal() {
    this.close.emit();
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}