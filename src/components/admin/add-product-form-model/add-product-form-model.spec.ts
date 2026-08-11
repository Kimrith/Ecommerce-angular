import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProductFormModel } from './add-product-form-model';

describe('AddProductFormModel', () => {
  let component: AddProductFormModel;
  let fixture: ComponentFixture<AddProductFormModel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddProductFormModel],
    }).compileComponents();

    fixture = TestBed.createComponent(AddProductFormModel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
