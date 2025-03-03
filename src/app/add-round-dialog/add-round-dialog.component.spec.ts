import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRoundDialogComponent } from './add-round-dialog.component';

describe('AddRoundDialogComponent', () => {
  let component: AddRoundDialogComponent;
  let fixture: ComponentFixture<AddRoundDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRoundDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRoundDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
