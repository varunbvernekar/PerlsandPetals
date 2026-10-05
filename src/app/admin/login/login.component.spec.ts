import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      user$: of(null),
      login: jasmine.createSpy('login').and.resolveTo({ user: { uid: '123' } }),
      getErrorMessage: jasmine.createSpy('getErrorMessage').and.returnValue('Invalid credentials')
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {}
            }
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate required fields', () => {
    component.loginForm.setValue({ email: '', password: '' });
    expect(component.loginForm.valid).toBeFalse();
    expect(component.email?.errors?.['required']).toBeTrue();
    expect(component.password?.errors?.['required']).toBeTrue();
  });

  it('should validate email format', () => {
    component.loginForm.setValue({ email: 'invalid-email', password: 'password123' });
    expect(component.loginForm.valid).toBeFalse();
    expect(component.email?.errors?.['email']).toBeTrue();
  });

  it('should call authService.login and navigate on valid submit', async () => {
    component.loginForm.setValue({
      email: 'admin@pearlsandpetals.com',
      password: 'validPassword123'
    });
    expect(component.loginForm.valid).toBeTrue();

    await component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith('admin@pearlsandpetals.com', 'validPassword123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('should display error message on login failure', async () => {
    mockAuthService.login.and.rejectWith({ code: 'auth/invalid-credential' });

    component.loginForm.setValue({
      email: 'admin@pearlsandpetals.com',
      password: 'wrongPassword'
    });

    await component.onSubmit();

    expect(component.errorMessage).toEqual('Invalid credentials');
    expect(component.isLoading).toBeFalse();
  });
});
