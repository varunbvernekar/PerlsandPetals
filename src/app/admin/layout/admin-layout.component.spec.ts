import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminLayoutComponent } from './admin-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let mockAuthService: any;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      user$: of({ email: 'admin@pearlsandpetals.com' }),
      logout: jasmine.createSpy('logout').and.resolveTo()
    };

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle and close mobile menu', () => {
    expect(component.isMobileMenuOpen).toBeFalse();
    component.toggleMobileMenu();
    expect(component.isMobileMenuOpen).toBeTrue();
    component.closeMobileMenu();
    expect(component.isMobileMenuOpen).toBeFalse();
  });

  it('should call authService.logout and navigate to /admin/login', async () => {
    await component.onLogout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });
});
