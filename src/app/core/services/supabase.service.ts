import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  /**
   * Returns the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Get the auth instance for authentication operations
   */
  getAuth() {
    return this.supabase.auth;
  }

  /**
   * Get the storage instance for file operations
   */
  getStorage() {
    return this.supabase.storage;
  }
}
