import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductTables } from './product-tables';

describe('ProductTables', () => {
  let component: ProductTables;
  let fixture: ComponentFixture<ProductTables>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductTables],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductTables);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
