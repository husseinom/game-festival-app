import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublisherForm } from './publisher-form';

describe('PublisherForm', () => {
  let component: PublisherForm;
  let fixture: ComponentFixture<PublisherForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublisherForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublisherForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
