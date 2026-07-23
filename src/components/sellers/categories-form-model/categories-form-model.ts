import { Component, EventEmitter, HostListener, Output } from '@angular/core';

@Component({
  selector: 'app-categories-form-model',
  imports: [],
  templateUrl: './categories-form-model.html',
  styleUrl: './categories-form-model.css',
})
export class CategoriesFormModel {

  @Output() close = new EventEmitter<void>();

  closeModal(){
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(){
    this.closeModal();
  }
}
