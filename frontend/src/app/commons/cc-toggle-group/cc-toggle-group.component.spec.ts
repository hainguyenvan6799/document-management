import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcToggleGroupComponent } from './cc-toggle-group.component';

describe('CcToggleGroupComponent', () => {
  let component: CcToggleGroupComponent;
  let fixture: ComponentFixture<CcToggleGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcToggleGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CcToggleGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
