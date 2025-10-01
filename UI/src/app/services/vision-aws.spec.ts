import { TestBed } from '@angular/core/testing';

import { VisionAws } from './vision-aws';

describe('VisionAws', () => {
  let service: VisionAws;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisionAws);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
