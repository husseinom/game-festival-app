import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceZoneEditForm } from './price-zone-edit-form';

describe('PriceZoneEditForm', () => {
  let component: PriceZoneEditForm;
  let fixture: ComponentFixture<PriceZoneEditForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceZoneEditForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceZoneEditForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
