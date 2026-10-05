import { Product } from '../../models/product.model';

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'ruby-stone-chain',
    name: 'Ruby Stone Chain',
    slug: 'ruby-stone-chain',
    description: 'Elegant artificial stone chain with handset deep-red ruby stones on an intricately twisted gold chain.',
    category: 'Stone Chains',
    originalPrice: 1499,
    discountPrice: 1199,
    onSale: true,
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop'
    ],
    available: true,
    featured: true,
    createdAt: '2026-10-04T18:29:51.085Z',
    updatedAt: '2026-10-04T18:29:51.085Z'
  },
  {
    id: 'royal-baroque-pearl-necklace',
    name: 'Royal Baroque Pearl Necklace',
    slug: 'royal-baroque-pearl-necklace',
    description: 'Lustrous freshwater baroque pearls paired with 18k handcrafted gold leaf accents.',
    category: 'Necklaces',
    originalPrice: 450,
    discountPrice: 380,
    onSale: true,
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop'
    ],
    available: true,
    featured: true,
    createdAt: '2026-10-04T18:29:51.085Z',
    updatedAt: '2026-10-04T18:29:51.085Z'
  },
  {
    id: 'celestial-diamond-drop-earrings',
    name: 'Celestial Diamond Drop Earrings',
    slug: 'celestial-diamond-drop-earrings',
    description: 'Brilliant solitaire diamonds suspended on delicate rose gold filigree drop wire.',
    category: 'Earrings',
    originalPrice: 620,
    discountPrice: 620,
    onSale: false,
    images: [
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop'
    ],
    available: true,
    featured: true,
    createdAt: '2026-10-04T18:29:51.085Z',
    updatedAt: '2026-10-04T18:29:51.085Z'
  },
  {
    id: 'emerald-blossom-halo-ring',
    name: 'Emerald Blossom Halo Ring',
    slug: 'emerald-blossom-halo-ring',
    description: 'Vibrant Colombian emerald surrounded by a petal motif of sparkling white sapphires.',
    category: 'Rings',
    originalPrice: 890,
    discountPrice: 750,
    onSale: true,
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop'
    ],
    available: true,
    featured: true,
    createdAt: '2026-10-04T18:29:51.085Z',
    updatedAt: '2026-10-04T18:29:51.085Z'
  }
];
