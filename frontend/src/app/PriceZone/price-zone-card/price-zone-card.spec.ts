import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceZoneCard } from './price-zone-card';

describe('PriceZoneCard', () => {
  let component: PriceZoneCard;
  let fixture: ComponentFixture<PriceZoneCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceZoneCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceZoneCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
