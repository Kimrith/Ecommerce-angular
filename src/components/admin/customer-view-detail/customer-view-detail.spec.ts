import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerViewDetail } from './customer-view-detail';

describe('CustomerViewDetail', () => {
  let component: CustomerViewDetail;
  let fixture: ComponentFixture<CustomerViewDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerViewDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerViewDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
