import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcDatePickerComponent } from './cc-date-picker.component';

describe('CcDatePickerComponent', () => {
  let component: CcDatePickerComponent;
  let fixture: ComponentFixture<CcDatePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcDatePickerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CcDatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
