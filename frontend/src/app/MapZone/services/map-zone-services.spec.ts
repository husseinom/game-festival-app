import { TestBed } from '@angular/core/testing';

import { MapZoneServices } from './map-zone-services';

describe('MapZoneServices', () => {
  let service: MapZoneServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapZoneServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
