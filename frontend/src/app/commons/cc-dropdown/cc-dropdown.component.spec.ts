import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcDropdownComponent } from './cc-dropdown.component';

describe('CcDropdownComponent', () => {
  let component: CcDropdownComponent;
  let fixture: ComponentFixture<CcDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcDropdownComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CcDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
