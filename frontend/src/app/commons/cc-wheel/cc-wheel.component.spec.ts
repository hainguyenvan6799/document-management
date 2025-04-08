import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcWheelComponent } from './cc-wheel.component';

describe('CcWheelComponent', () => {
  let component: CcWheelComponent;
  let fixture: ComponentFixture<CcWheelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcWheelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CcWheelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
