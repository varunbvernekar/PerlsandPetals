import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Product } from '../../models/product.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockProductService: any;
  let mockAuthService: any;

  const sampleProducts: Product[] = [
    {
      id: 'p1',
      name: 'Ruby Stone Chain',
      slug: 'ruby-stone-chain',
      description: 'Test',
      category: 'Chains',
      originalPrice: 1000,
      discountPrice: 800,
      onSale: true,
      available: true,
      featured: true,
      images: [],
      createdAt: '',
      updatedAt: ''
    },
    {
      id: 'p2',
      name: 'Pearl Necklace',
      slug: 'pearl-necklace',
      description: 'Test',
      category: 'Necklaces',
      originalPrice: 500,
      onSale: false,
      available: true,
      featured: false,
      images: [],
      createdAt: '',
      updatedAt: ''
    },
    {
      id: 'p3',
      name: 'Sold Out Ring',
      slug: 'sold-out-ring',
      description: 'Test',
      category: 'Rings',
      originalPrice: 700,
      onSale: false,
      available: false,
      featured: true,
      images: [],
      createdAt: '',
      updatedAt: ''
    }
  ];

  beforeEach(async () => {
    mockProductService = {
      getProducts: jasmine.createSpy('getProducts').and.returnValue(of(sampleProducts)),
      getErrorMessage: jasmine.createSpy('getErrorMessage').and.returnValue('Error')
    };

    mockAuthService = {
      user$: of({ email: 'admin@pearlsandpetals.com' }),
      logout: jasmine.createSpy('logout').and.resolveTo()
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: mockProductService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute metrics correctly from products', () => {
    expect(component.totalProducts).toBe(3);
    expect(component.availableProducts).toBe(2);
    expect(component.onSaleProducts).toBe(1);
    expect(component.featuredProducts).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('should call authService.logout when logout is invoked', async () => {
    await component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });
});
