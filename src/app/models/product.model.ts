export interface Product {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  originalPrice: number;
  discountPrice?: number;
  onSale: boolean;
  images: string[];
  available: boolean;
  featured: boolean;
  createdAt?: Date | string | any;
  updatedAt?: Date | string | any;
}

