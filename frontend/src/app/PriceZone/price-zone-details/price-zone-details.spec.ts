import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceZoneDetails } from './price-zone-details';

describe('PriceZoneDetails', () => {
  let component: PriceZoneDetails;
  let fixture: ComponentFixture<PriceZoneDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceZoneDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceZoneDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
