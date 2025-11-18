import { TestBed } from '@angular/core/testing';

import { GamePubListService } from './game-pub-list-service';

describe('GamePubListService', () => {
  let service: GamePubListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GamePubListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
