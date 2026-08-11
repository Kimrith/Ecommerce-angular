import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seller-view-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-view-detail.html',
  styleUrl: './seller-view-detail.css',
})
export class SellerViewDetail {
  @Input() seller: any = null;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  getUserInitials(name: string): string {
    if (!name) return 'SE';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}