import { TestBed } from '@angular/core/testing';

import { Auths } from './auths';

describe('Auths', () => {
  let service: Auths;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Auths);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
