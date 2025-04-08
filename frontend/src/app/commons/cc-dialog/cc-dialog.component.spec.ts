import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcDialogComponent } from './cc-dialog.component';

describe('CcDialogComponent', () => {
  let component: CcDialogComponent;
  let fixture: ComponentFixture<CcDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CcDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
