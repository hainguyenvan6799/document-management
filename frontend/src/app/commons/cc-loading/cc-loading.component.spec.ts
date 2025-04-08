import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcLoadingComponent } from './cc-loading.component';

describe('CcLoadingComponent', () => {
  let component: CcLoadingComponent;
  let fixture: ComponentFixture<CcLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcLoadingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CcLoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
