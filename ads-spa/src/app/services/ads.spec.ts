import { TestBed } from '@angular/core/testing';

import { Ads } from './ads';

describe('Ads', () => {
  let service: Ads;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ads);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
