import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FestivalDetails } from './festival-details';

describe('FestivalDetails', () => {
  let component: FestivalDetails;
  let fixture: ComponentFixture<FestivalDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FestivalDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FestivalDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
