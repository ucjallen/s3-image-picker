import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileNavigateComponent } from './profile-navigate.component';

describe('ProfileNavigateComponent', () => {
  let component: ProfileNavigateComponent;
  let fixture: ComponentFixture<ProfileNavigateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProfileNavigateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileNavigateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
