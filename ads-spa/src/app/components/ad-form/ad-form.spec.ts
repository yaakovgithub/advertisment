import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdForm } from './ad-form';

describe('AdForm', () => {
  let component: AdForm;
  let fixture: ComponentFixture<AdForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
