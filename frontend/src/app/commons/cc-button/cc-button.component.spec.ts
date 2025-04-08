import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcButtonComponent } from './cc-button.component';

describe('CcButtonComponent', () => {
  let component: CcButtonComponent;
  let fixture: ComponentFixture<CcButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CcButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
