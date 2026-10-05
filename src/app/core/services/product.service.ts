import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, of, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Product } from '../../models/product.model';
import { FALLBACK_PRODUCTS } from '../constants/fallback-products';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.getClient();
  private isFallbackActiveSubject = new BehaviorSubject<boolean>(false);
  public isFallbackActive$ = this.isFallbackActiveSubject.asObservable();

  private markFallback(err: any): void {
    console.warn('[ProductService] Supabase query failed, falling back to local catalog data:', err);
    this.isFallbackActiveSubject.next(true);
  }

  /**
   * Generates a URL-friendly slug from a product name.
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Generates a unique product document ID from slug + timestamp suffix.
   */
  generateId(slug: string): string {
    const suffix = Date.now().toString(36).slice(-4);
    return `${slug}-${suffix}`;
  }

  /**
   * Calculates discount percentage.
   */
  calculateDiscountPercent(originalPrice: number, discountPrice: number): number {
    if (!originalPrice || !discountPrice || discountPrice >= originalPrice) return 0;
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  }

  /**
   * Retrieves all products from Supabase with fallback to cached catalog.
   */
  getProducts(): Observable<Product[]> {
    return from(
      this.supabase
        .from('products')
        .select('*')
    ).pipe(
      map(response => {
        if (response.error) {
          throw response.error;
        }
        return this.mapProducts(response.data || []);
      }),
      catchError(err => {
        this.markFallback(err);
        return of(FALLBACK_PRODUCTS);
      })
    );
  }

  /**
   * Retrieves a single product by ID (admin use).
   */
  getProduct(id: string): Observable<Product | null> {
    if (!id) return of(null);

    return from(
      this.supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(response => {
        if (response.error) {
          // 404 is expected if product not found
          if (response.error.code === 'PGRST116') {
            return null;
          }
          throw response.error;
        }
        return response.data ? this.mapProduct(response.data) : null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Retrieves a single product by either ID or slug (customer use).
   */
  getProductById(idOrSlug: string): Observable<Product | null> {
    if (!idOrSlug) {
      return of(null);
    }

    return from(
      this.supabase
        .from('products')
        .select('*')
        .eq('id', idOrSlug)
        .maybeSingle()
    ).pipe(
      switchMap(response => {
        if (!response.error && response.data) {
          return of(this.mapProduct(response.data));
        }
        return this.getProductBySlug(idOrSlug);
      }),
      catchError(() => this.getProductBySlug(idOrSlug))
    );
  }

  /**
   * Retrieves a single product by slug (customer fallback lookup)
   */
  getProductBySlug(slug: string): Observable<Product | null> {
    if (!slug) {
      return of(null);
    }

    return from(
      this.supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
    ).pipe(
      map(response => {
        if (!response.error && response.data) {
          return this.mapProduct(response.data);
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Retrieves products marked as featured.
   */
  getFeaturedProducts(): Observable<Product[]> {
    return from(
      this.supabase
        .from('products')
        .select('*')
        .eq('featured', true)
    ).pipe(
      map(response => {
        if (response.error) {
          throw response.error;
        }
        return this.mapProducts(response.data || []);
      }),
      catchError(err => {
        this.markFallback(err);
        return of(FALLBACK_PRODUCTS.filter(p => p.featured));
      })
    );
  }

  /**
   * Retrieves products by category, supporting casing variations and 'out-of-stock'.
   */
  getProductsByCategory(category: string): Observable<Product[]> {
    if (!category || category.toLowerCase() === 'all') {
      return this.getProducts();
    }

    const normalized = category.toLowerCase().trim();

    // Check for "out-of-stock" category filter
    if (normalized === 'out-of-stock' || normalized === 'out of stock') {
      return from(
        this.supabase
          .from('products')
          .select('*')
          .eq('available', false)
      ).pipe(
        map(response => {
          if (response.error) {
            throw response.error;
          }
          return this.mapProducts(response.data || []);
        }),
        catchError(err => {
          this.markFallback(err);
          const filtered = FALLBACK_PRODUCTS.filter(p => !p.available);
          return of(filtered);
        })
      );
    }

    return from(
      this.supabase
        .from('products')
        .select('*')
    ).pipe(
      map(response => {
        if (response.error) {
          throw response.error;
        }
        const products = this.mapProducts(response.data || []);
        // Filter locally by category (case-insensitive)
        return products.filter(p =>
          (p.category || '').toLowerCase() === normalized
        );
      }),
      catchError(err => {
        this.markFallback(err);
        const filtered = FALLBACK_PRODUCTS.filter(p =>
          (p.category || '').toLowerCase() === normalized
        );
        return of(filtered);
      })
    );
  }

  /**
   * Adds a new product to Supabase.
   * Generates id, slug, created_at, updated_at automatically.
   */
  async addProduct(data: Omit<Product, 'id' | 'slug' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const slug = this.generateSlug(data.name);
    const id = this.generateId(slug);
    const now = new Date().toISOString();

    const productData = {
      id,
      name: data.name,
      slug,
      description: data.description,
      category: data.category,
      original_price: data.originalPrice,
      discount_price: data.discountPrice || null,
      on_sale: data.onSale,
      images: data.images || [],
      available: data.available,
      featured: data.featured,
      created_at: now,
      updated_at: now
    };

    const { data: result, error } = await this.supabase
      .from('products')
      .insert([productData])
      .select('id')
      .single();

    if (error) {
      console.error('[ProductService] Add product error:', error);
      throw error;
    }

    return result?.id || id;
  }

  /**
   * Updates an existing product in Supabase.
   * Always updates updated_at.
   */
  async updateProduct(
    id: string,
    data: Partial<Omit<Product, 'id' | 'slug' | 'createdAt'>>
  ): Promise<void> {
    const updateData: any = {
      ...data,
      updated_at: new Date().toISOString()
    };

    // Map camelCase to snake_case for database
    const dbData: any = {};
    Object.keys(updateData).forEach(key => {
      if (key === 'originalPrice') dbData['original_price'] = updateData[key];
      else if (key === 'discountPrice') dbData['discount_price'] = updateData[key];
      else if (key === 'onSale') dbData['on_sale'] = updateData[key];
      else if (key === 'createdAt') return; // Skip createdAt
      else dbData[key] = updateData[key];
    });

    const { error } = await this.supabase
      .from('products')
      .update(dbData)
      .eq('id', id);

    if (error) {
      console.error('[ProductService] Update product error:', error);
      throw error;
    }
  }

  /**
   * Deletes a product from Supabase by ID.
   * Verifies that the row was actually deleted in PostgreSQL.
   */
  async deleteProduct(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('[ProductService] Delete product error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('[ProductService] 0 rows deleted for id:', id);
      throw new Error(
        'Product could not be deleted from the database. Row Level Security (RLS) on your Supabase "products" table is missing a DELETE policy for authenticated users.'
      );
    }
  }

  /**
   * Translates Supabase errors into clear, user-friendly messages.
   */
  getErrorMessage(err: any): string {
    const message = err?.message || '';
    const code = err?.code || '';

    if (message.includes('Row Level Security') || message.includes('RLS')) {
      return message;
    }

    if (message.includes('permission denied') || code === 'PGRST001' || code === '42501') {
      return 'Permission denied. Row Level Security in Supabase does not allow deleting products. Please enable the DELETE policy in Supabase.';
    }

    if (message.includes('Unexpected end of JSON input') || message.includes('Failed to parse JSON')) {
      return 'Server error. Please try again.';
    }

    if (message.toLowerCase().includes('network') || code === 'NETWORK_ERROR') {
      return 'Network connection error. Please check your internet and try again.';
    }

    if (message.includes('row level security')) {
      return 'Access denied by Supabase security policy. Please check RLS policies in your Supabase dashboard.';
    }

    return message || 'An error occurred. Please try again.';
  }

  private mapProduct(row: any): Product {
    return {
      id: row?.id,
      name: row?.name ?? '',
      slug: row?.slug ?? '',
      description: row?.description ?? '',
      category: row?.category ?? '',
      originalPrice: Number(row?.original_price ?? row?.originalPrice ?? 0),
      discountPrice: row?.discount_price ?? row?.discountPrice ?? undefined,
      onSale: Boolean(row?.on_sale ?? row?.onSale ?? false),
      images: Array.isArray(row?.images)
        ? row.images
        : typeof row?.images === 'string'
          ? [row.images]
          : [],
      available: row?.available ?? true,
      featured: row?.featured ?? false,
      createdAt: row?.created_at ?? row?.createdAt,
      updatedAt: row?.updated_at ?? row?.updatedAt
    };
  }

  private mapProducts(rows: any[] = []): Product[] {
    return rows.map(row => this.mapProduct(row));
  }
}
