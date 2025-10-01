import { TestBed } from '@angular/core/testing';

import { AccessibilityAudit } from './accessibility-audit';

describe('AccessibilityAudit', () => {
  let service: AccessibilityAudit;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessibilityAudit);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
