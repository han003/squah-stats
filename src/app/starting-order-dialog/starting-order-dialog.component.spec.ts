import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartingOrderDialogComponent } from './starting-order-dialog.component';

describe('StartingOrderDialogComponent', () => {
  let component: StartingOrderDialogComponent;
  let fixture: ComponentFixture<StartingOrderDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartingOrderDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartingOrderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
