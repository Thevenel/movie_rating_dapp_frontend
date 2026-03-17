import { TestBed } from '@angular/core/testing';

import { MovieRating } from './movie-rating';

describe('MovieRating', () => {
  let service: MovieRating;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovieRating);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
