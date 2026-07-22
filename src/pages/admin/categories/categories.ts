import { Component } from '@angular/core';
import { CategoriesTables } from '../../../components/admin/categories-tables/categories-tables';

@Component({
  selector: 'app-categories',
  imports: [CategoriesTables],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories {}
