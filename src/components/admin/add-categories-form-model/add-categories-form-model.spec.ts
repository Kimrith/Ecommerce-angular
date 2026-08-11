import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCategoriesFormModel } from './add-categories-form-model';

describe('AddCategoriesFormModel', () => {
  let component: AddCategoriesFormModel;
  let fixture: ComponentFixture<AddCategoriesFormModel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCategoriesFormModel],
    }).compileComponents();

    fixture = TestBed.createComponent(AddCategoriesFormModel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
