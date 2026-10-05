import { TestBed } from '@angular/core/testing';
import { WhatsAppService, WHATSAPP_CONFIG } from './whatsapp.service';
import { Product } from '../../models/product.model';

describe('WhatsAppService', () => {
  let service: WhatsAppService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WhatsAppService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have a configurable business phone number', () => {
    expect(service.phoneNumber).toBeTruthy();
    expect(service.phoneNumber).toBe(WHATSAPP_CONFIG.phoneNumber);
  });

  it('should generate pre-filled message with discount price when product has discount', () => {
    const product: Product = {
      id: 'prod-4',
      name: 'Ruby Stone Chain',
      slug: 'ruby-stone-chain',
      description: 'Ruby necklace',
      category: 'Necklaces',
      originalPrice: 1499,
      discountPrice: 1199,
      onSale: true,
      images: [],
      available: true,
      featured: true,
      createdAt: '',
      updatedAt: ''
    };

    const message = service.createOrderMessage(product);
    expect(message).toBe('Hi Pearls & Petals, I am interested in Ruby Stone Chain priced at ₹1,199. Is it available?');
  });

  it('should generate pre-filled message with original price when product has no discount', () => {
    const product: Product = {
      id: 'prod-2',
      name: 'Celestial Diamond Drop Earrings',
      slug: 'celestial-diamond-drop-earrings',
      description: 'Earrings',
      category: 'Earrings',
      originalPrice: 620,
      onSale: false,
      images: [],
      available: true,
      featured: true,
      createdAt: '',
      updatedAt: ''
    };

    const message = service.createOrderMessage(product);
    expect(message).toBe('Hi Pearls & Petals, I am interested in Celestial Diamond Drop Earrings priced at ₹620. Is it available?');
  });

  it('should construct valid WhatsApp URL with URL-encoded message', () => {
    const product: Product = {
      id: 'prod-4',
      name: 'Ruby Stone Chain',
      slug: 'ruby-stone-chain',
      description: 'Ruby necklace',
      category: 'Necklaces',
      originalPrice: 1499,
      discountPrice: 1199,
      onSale: true,
      images: [],
      available: true,
      featured: true,
      createdAt: '',
      updatedAt: ''
    };

    const url = service.getWhatsAppUrl(product);
    expect(url.startsWith('https://wa.me/')).toBeTrue();
    expect(url).toContain('text=Hi%20Pearls%20%26%20Petals%2C%20I%20am%20interested%20in%20Ruby%20Stone%20Chain%20priced%20at%20%E2%82%B91%2C199.%20Is%20it%20available%3F');
  });

  it('should open WhatsApp in a new tab with window.open', () => {
    const spy = spyOn(window, 'open').and.callFake(() => null);
    const product: Product = {
      id: 'prod-1',
      name: 'Royal Baroque Pearl Necklace',
      slug: 'royal-baroque-pearl-necklace',
      description: 'Necklace',
      category: 'Necklaces',
      originalPrice: 450,
      discountPrice: 380,
      onSale: true,
      images: [],
      available: true,
      featured: true,
      createdAt: '',
      updatedAt: ''
    };

    service.orderOnWhatsApp(product);
    expect(spy).toHaveBeenCalled();
    const args = spy.calls.mostRecent().args;
    expect(args[0]).toContain('https://wa.me/');
    expect(args[1]).toBe('_blank');
    expect(args[2]).toBe('noopener,noreferrer');
  });
});
