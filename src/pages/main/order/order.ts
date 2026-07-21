import { Component } from '@angular/core';
import { OrderCart } from '../../../shared/components/main-layout/order-cart/order-cart';

@Component({
  selector: 'app-order',
  imports: [OrderCart],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order {}
