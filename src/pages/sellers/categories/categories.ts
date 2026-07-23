import { Component } from '@angular/core';
import { CategoriesTables } from '../../../components/sellers/categories-tables/categories-tables';
import { CategoriesFormModel } from '../../../components/sellers/categories-form-model/categories-form-model';

@Component({
  selector: 'app-categories',
  imports: [CategoriesTables, CategoriesFormModel],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories {
  showCategoryModal = false;

  openCategoryModal(){
    this.showCategoryModal = true;
  }

  closeCategoryModal(){
    this.showCategoryModal = false;
  }
}
