import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOutgoingDocumentComponent } from './add-outgoing-document.component';

describe('AddOutgoingDocumentComponent', () => {
  let component: AddOutgoingDocumentComponent;
  let fixture: ComponentFixture<AddOutgoingDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddOutgoingDocumentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddOutgoingDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
