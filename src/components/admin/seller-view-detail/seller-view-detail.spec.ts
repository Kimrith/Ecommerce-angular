import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerViewDetail } from './seller-view-detail';

describe('SellerViewDetail', () => {
  let component: SellerViewDetail;
  let fixture: ComponentFixture<SellerViewDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerViewDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(SellerViewDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
