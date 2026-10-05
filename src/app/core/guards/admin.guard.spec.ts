import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
  let mockAuthService: { user$: any };
  let mockRouter: jasmine.SpyObj<Router>;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/admin/dashboard' } as RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = {
      user$: of(null)
    };
    mockRouter = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    mockRouter.createUrlTree.and.callFake((commands: any[], extras?: any) => {
      return { toString: () => '/admin/login' } as unknown as UrlTree;
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow access when admin is authenticated', (done) => {
    mockAuthService.user$ = of({ uid: 'admin-123', email: 'admin@pearlsandpetals.com' });

    TestBed.runInInjectionContext(() => {
      const result = adminGuard(mockRoute, mockState);
      (result as any).subscribe((allowed: boolean | UrlTree) => {
        expect(allowed).toBe(true);
        done();
      });
    });
  });

  it('should redirect to /admin/login when admin is not authenticated', (done) => {
    mockAuthService.user$ = of(null);

    TestBed.runInInjectionContext(() => {
      const result = adminGuard(mockRoute, mockState);
      (result as any).subscribe((urlTree: UrlTree) => {
        expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/admin/login'], {
          queryParams: { returnUrl: '/admin/dashboard' }
        });
        done();
      });
    });
  });
});
