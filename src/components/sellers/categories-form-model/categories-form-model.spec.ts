import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriesFormModel } from './categories-form-model';

describe('CategoriesFormModel', () => {
  let component: CategoriesFormModel;
  let fixture: ComponentFixture<CategoriesFormModel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriesFormModel],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesFormModel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
