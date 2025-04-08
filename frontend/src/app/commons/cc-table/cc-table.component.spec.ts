import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcTableComponent } from './cc-table.component';

describe('CcTableComponent', () => {
  let component: CcTableComponent;
  let fixture: ComponentFixture<CcTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CcTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
