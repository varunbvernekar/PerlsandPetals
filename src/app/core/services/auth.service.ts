import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private auth = this.supabaseService.getAuth();

  private userSubject = new BehaviorSubject<User | null>(null);
  readonly user$ = this.userSubject.asObservable();
  readonly isAuthenticated$ = this.user$.pipe(map(Boolean));

  constructor() {
    // Initialize auth state on service creation
    this.initAuthState();
  }

  /**
   * Initialize auth state by checking current session
   */
  private async initAuthState(): Promise<void> {
    try {
      const { data } = await this.auth.getSession();
      if (data.session?.user) {
        this.userSubject.next(data.session.user);
      }

      // Subscribe to auth state changes
      this.auth.onAuthStateChange((_event, session) => {
        this.userSubject.next(session?.user ?? null);
      });
    } catch (err) {
      console.error('[AuthService] Error initializing auth state:', err);
    }
  }

  /**
   * Current user snapshot (synchronous getter if available)
   */
  get currentUser(): User | null {
    return this.userSubject.value;
  }

  /**
   * Signs in an admin with email and password using Supabase Authentication
   */
  async login(email: string, password: string): Promise<User | null> {
    try {
      const { data, error } = await this.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        this.userSubject.next(data.user);
        return data.user;
      }

      return null;
    } catch (err) {
      console.error('[AuthService] Login error:', err);
      throw err;
    }
  }

  /**
   * Signs out the current admin session
   */
  async logout(): Promise<void> {
    try {
      const { error } = await this.auth.signOut();
      if (error) {
        throw error;
      }
      this.userSubject.next(null);
    } catch (err) {
      console.error('[AuthService] Logout error:', err);
      throw err;
    }
  }

  /**
   * Translates Supabase Auth error codes into user-friendly messages
   */
  getErrorMessage(error: any): string {
    const code = error?.code || error?.status || '';
    const message = error?.message || '';

    switch (code) {
      case 'invalid_credentials':
      case '400':
        if (message.includes('Email not found')) {
          return 'Invalid admin credentials. Please verify your email and password.';
        }
        if (message.includes('Invalid login credentials')) {
          return 'Invalid admin credentials. Please verify your email and password.';
        }
        return 'Invalid email or password.';

      case 'invalid_grant':
        return 'Invalid email or password.';

      case 'user_not_found':
        return 'Admin account not found. Please verify your email.';

      case 'weak_password':
        return 'Password is too weak. Use at least 6 characters.';

      case 'user_already_exists':
        return 'This email is already registered.';

      case 'email_not_confirmed':
        return 'Please confirm your email address before logging in.';

      case 'too_many_requests':
      case '429':
        return 'Too many login attempts. Please try again later.';

      case 'network_error':
      case 'fetch_error':
        return 'Network connection error. Please check your internet and try again.';

      case 'service_role_key_required':
        return 'Server configuration error. Please contact support.';

      default:
        return message || 'Authentication failed. Please try again.';
    }
  }
}

