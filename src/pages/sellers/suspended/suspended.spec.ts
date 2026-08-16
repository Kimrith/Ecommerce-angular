import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Suspended } from './suspended';

describe('Suspended', () => {
  let component: Suspended;
  let fixture: ComponentFixture<Suspended>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Suspended],
    }).compileComponents();

    fixture = TestBed.createComponent(Suspended);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
