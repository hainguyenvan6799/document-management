import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcRadioGroupComponent } from './cc-radio-group.component';

describe('CcRadioGroupComponent', () => {
  let component: CcRadioGroupComponent;
  let fixture: ComponentFixture<CcRadioGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcRadioGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CcRadioGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
