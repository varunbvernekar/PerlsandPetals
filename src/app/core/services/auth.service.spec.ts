import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

describe('AuthService', () => {
  let service: AuthService;
  let supabaseServiceSpy: jasmine.SpyObj<SupabaseService>;

  const mockAuth = {
    getSession: jasmine.createSpy('getSession').and.returnValue(Promise.resolve({ data: { session: null } })),
    onAuthStateChange: jasmine.createSpy('onAuthStateChange'),
    signInWithPassword: jasmine.createSpy('signInWithPassword'),
    signOut: jasmine.createSpy('signOut')
  };

  const mockSupabaseClient = {
    auth: mockAuth
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SupabaseService', ['getClient', 'getAuth']);
    spy.getClient.and.returnValue(mockSupabaseClient);
    spy.getAuth.and.returnValue(mockAuth);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: spy }
      ]
    });
    supabaseServiceSpy = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should format invalid credentials error correctly', () => {
    const msg = service.getErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' });
    expect(msg).toContain('Invalid admin credentials');
  });

  it('should format invalid email error correctly', () => {
    const msg = service.getErrorMessage({ code: '400', message: 'Email not found' });
    expect(msg).toContain('Invalid');
  });

  it('should format too-many-requests error correctly', () => {
    const msg = service.getErrorMessage({ code: 'too_many_requests' });
    expect(msg).toContain('Too many login attempts');
  });

  it('should format network error correctly', () => {
    const msg = service.getErrorMessage({ message: 'Network connection error' });
    expect(msg).toContain('Network');
  });

  it('should format general error message fallback', () => {
    const msg = service.getErrorMessage({ message: 'Custom auth issue' });
    expect(msg).toEqual('Custom auth issue');
  });
});
