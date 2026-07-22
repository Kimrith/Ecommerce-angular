import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-cart',
  imports: [],
  templateUrl: './product-cart.html',
  styleUrl: './product-cart.css',
})
export class ProductCart {

  constructor(private router: Router) {}
  
  addToCart() {
    this.router.navigate(['/products', 1]);
  }

}
