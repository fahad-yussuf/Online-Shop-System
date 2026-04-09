import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorefrontComponent } from './storefront.component';

describe('Storefront', () => {
  let component: StorefrontComponent;
  let fixture: ComponentFixture<StorefrontComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorefrontComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StorefrontComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
