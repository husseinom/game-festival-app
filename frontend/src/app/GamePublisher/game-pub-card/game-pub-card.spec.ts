import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePubCard } from './game-pub-card';

describe('GamePubCard', () => {
  let component: GamePubCard;
  let fixture: ComponentFixture<GamePubCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamePubCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamePubCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
