import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcCarouselComponent } from './cc-carousel.component';

describe('CcCarouselComponent', () => {
  let component: CcCarouselComponent;
  let fixture: ComponentFixture<CcCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcCarouselComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CcCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
