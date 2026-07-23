import { Component } from '@angular/core';
import { OrderTables } from '../../../components/sellers/order-tables/order-tables';

@Component({
  selector: 'app-orders',
  imports: [OrderTables],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {}
