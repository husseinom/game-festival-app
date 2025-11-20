import { TestBed } from '@angular/core/testing';

import { FestivalServices } from './festival-services';

describe('FestivalServices', () => {
  let service: FestivalServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FestivalServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
