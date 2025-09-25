import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageContrast } from './image-contrast';

describe('ImageContrast', () => {
  let component: ImageContrast;
  let fixture: ComponentFixture<ImageContrast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageContrast]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageContrast);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
