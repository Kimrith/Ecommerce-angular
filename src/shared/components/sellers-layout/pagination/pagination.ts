import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  @Input() pageNumber: number = 1;
  @Input() pageSize: number = 10;
  @Input() totalItems: number = 0;
  @Input() totalPages: number = 1;
  @Input() itemLabel: string = 'products';

  @Output() pageChange = new EventEmitter<number>();

  // Generates an array of page numbers (e.g., [1, 2, 3]) based on totalPages
  get pageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getStartIndex(): number {
    if (this.totalItems === 0) return 0;
    return (this.pageNumber - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    const end = this.pageNumber * this.pageSize;
    return end > this.totalItems ? this.totalItems : end;
  }

  onPageChange(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.pageNumber) {
      this.pageChange.emit(newPage);
    }
  }
}
