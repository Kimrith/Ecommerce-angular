import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriesTables } from './categories-tables';

describe('CategoriesTables', () => {
  let component: CategoriesTables;
  let fixture: ComponentFixture<CategoriesTables>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriesTables],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesTables);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
