import { Component, EventEmitter, HostListener, Output } from '@angular/core';

@Component({
  selector: 'app-product-form-modal',
  imports: [],
  templateUrl: './product-form-modal.html',
  styleUrl: './product-form-modal.css',
})
export class ProductFormModal {

  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    this.closeModal();
  }
}