import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSellerPopup } from './add-seller-popup';

describe('AddSellerPopup', () => {
  let component: AddSellerPopup;
  let fixture: ComponentFixture<AddSellerPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSellerPopup],
    }).compileComponents();

    fixture = TestBed.createComponent(AddSellerPopup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
