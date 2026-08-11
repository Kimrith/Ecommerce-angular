import { TestBed } from '@angular/core/testing';

import { Banner } from './banner';

describe('Banner', () => {
  let service: Banner;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Banner);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
