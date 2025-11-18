import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePubList } from './game-pub-list';

describe('GamePubList', () => {
  let component: GamePubList;
  let fixture: ComponentFixture<GamePubList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamePubList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamePubList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
