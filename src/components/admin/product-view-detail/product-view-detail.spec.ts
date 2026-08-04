import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductViewDetail } from './product-view-detail';

describe('ProductViewDetail', () => {
  let component: ProductViewDetail;
  let fixture: ComponentFixture<ProductViewDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductViewDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductViewDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
