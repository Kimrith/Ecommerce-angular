import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSellerFormModel } from './add-seller-form-model';

describe('AddSellerFormModel', () => {
  let component: AddSellerFormModel;
  let fixture: ComponentFixture<AddSellerFormModel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSellerFormModel],
    }).compileComponents();

    fixture = TestBed.createComponent(AddSellerFormModel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
