import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';
import { SupabaseService } from './supabase.service';

describe('ProductService', () => {
  let service: ProductService;
  let supabaseServiceSpy: jasmine.SpyObj<SupabaseService>;

  const mockSupabaseClient = {
    from: jasmine.createSpy('from').and.returnValue({
      select: jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          single: jasmine.createSpy('single')
        })
      })
    })
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SupabaseService', ['getClient', 'getAuth']);
    spy.getClient.and.returnValue(mockSupabaseClient);

    TestBed.configureTestingModule({
      providers: [
        ProductService,
        { provide: SupabaseService, useValue: spy }
      ]
    });
    supabaseServiceSpy = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate slug from product name', () => {
    const slug = service.generateSlug('Ruby Stone Chain');
    expect(slug).toBe('ruby-stone-chain');
  });

  it('should calculate discount percentage correctly', () => {
    const percent = service.calculateDiscountPercent(1000, 800);
    expect(percent).toBe(20);
  });

  it('should format permission denied error correctly', () => {
    const msg = service.getErrorMessage({ message: 'permission denied' });
    expect(msg).toContain('Permission denied');
  });

  it('should format network error correctly', () => {
    const msg = service.getErrorMessage({ code: 'NETWORK_ERROR' });
    expect(msg).toContain('Network connection error');
  });

  it('should format general error message with details', () => {
    const msg = service.getErrorMessage({ message: 'Database error' });
    expect(msg).toContain('Database error');
  });
});
