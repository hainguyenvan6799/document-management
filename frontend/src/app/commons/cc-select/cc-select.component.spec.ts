import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcSelectComponent } from './cc-select.component';

describe('CcSelectComponent', () => {
  let component: CcSelectComponent;
  let fixture: ComponentFixture<CcSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcSelectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CcSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
