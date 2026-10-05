import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProductDetailsComponent } from './product-details.component';
import { ProductService } from '../../core/services/product.service';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { Product } from '../../models/product.model';

import { ActivatedRoute } from '@angular/router';

describe('ProductDetailsComponent', () => {
  let component: ProductDetailsComponent;
  let fixture: ComponentFixture<ProductDetailsComponent>;
  let whatsAppService: WhatsAppService;

  const mockProduct: Product = {
    id: 'prod-1',
    name: 'Royal Baroque Pearl Necklace',
    slug: 'royal-baroque-pearl-necklace',
    description: 'Each Baroque Pearl is individually selected.',
    category: 'Necklaces',
    originalPrice: 450,
    discountPrice: 380,
    onSale: true,
    images: ['https://example.com/test.jpg'],
    available: true,
    featured: true
  };

  const mockProductService = {
    getProductById: jasmine.createSpy('getProductById').and.returnValue(of(mockProduct))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailsComponent],
      providers: [
        WhatsAppService,
        { provide: ProductService, useValue: mockProductService },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: 'prod-1' }) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailsComponent);
    component = fixture.componentInstance;
    component.productId = 'prod-1';
    component.product = mockProduct;
    component.isLoading = false;
    whatsAppService = TestBed.inject(WhatsAppService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should render the Order on WhatsApp button', () => {
    const btn = fixture.nativeElement.querySelector('#order-whatsapp-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Order on WhatsApp');
  });

  it('should call WhatsAppService.orderOnWhatsApp when clicking the button', () => {
    const spy = spyOn(whatsAppService, 'orderOnWhatsApp');
    const btn = fixture.nativeElement.querySelector('#order-whatsapp-btn');
    btn.click();
    expect(spy).toHaveBeenCalledWith(component.product!);
  });
});
