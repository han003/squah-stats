import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundsListComponent } from './rounds-list.component';

describe('RoundsListComponent', () => {
  let component: RoundsListComponent;
  let fixture: ComponentFixture<RoundsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoundsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoundsListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
