import { TestBed } from '@angular/core/testing';

import { PriceZoneServices } from './price-zone-services';

describe('PriceZoneServices', () => {
  let service: PriceZoneServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PriceZoneServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
