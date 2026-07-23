import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderTables } from './order-tables';

describe('OrderTables', () => {
  let component: OrderTables;
  let fixture: ComponentFixture<OrderTables>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderTables],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderTables);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
