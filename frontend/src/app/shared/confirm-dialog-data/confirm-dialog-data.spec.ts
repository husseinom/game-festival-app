import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogData } from './confirm-dialog-data';

describe('ConfirmDialogData', () => {
  let component: ConfirmDialogData;
  let fixture: ComponentFixture<ConfirmDialogData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
