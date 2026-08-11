import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProductVariant } from './add-product-variant';

describe('AddProductVariant', () => {
  let component: AddProductVariant;
  let fixture: ComponentFixture<AddProductVariant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddProductVariant],
    }).compileComponents();

    fixture = TestBed.createComponent(AddProductVariant);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
