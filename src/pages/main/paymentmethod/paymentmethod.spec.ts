import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Paymentmethod } from './paymentmethod';

describe('Paymentmethod', () => {
  let component: Paymentmethod;
  let fixture: ComponentFixture<Paymentmethod>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Paymentmethod],
    }).compileComponents();

    fixture = TestBed.createComponent(Paymentmethod);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
