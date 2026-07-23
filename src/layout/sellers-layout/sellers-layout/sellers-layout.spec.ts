import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellersLayout } from './sellers-layout';

describe('AdminLayout', () => {
  let component: SellersLayout;
  let fixture: ComponentFixture<SellersLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellersLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(SellersLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
