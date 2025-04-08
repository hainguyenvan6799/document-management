import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcSkeletonLoadingComponent } from './cc-skeleton-loading.component';

describe('CcSkeletonLoadingComponent', () => {
  let component: CcSkeletonLoadingComponent;
  let fixture: ComponentFixture<CcSkeletonLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcSkeletonLoadingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CcSkeletonLoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
