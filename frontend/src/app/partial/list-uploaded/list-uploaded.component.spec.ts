import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListUploadedComponent } from './list-uploaded.component';

describe('ListUploadedComponent', () => {
  let component: ListUploadedComponent;
  let fixture: ComponentFixture<ListUploadedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListUploadedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListUploadedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
