import { Location } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-product-detail',
  imports: [],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail {

  constructor(private location: Location) {}
  
  goBack() {
    this.location.back()
  }
}
