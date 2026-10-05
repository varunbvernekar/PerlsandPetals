import { Injectable } from '@angular/core';
import { Product } from '../../models/product.model';

/**
 * WhatsApp Business Configuration
 * Configure the business phone number in one single place here.
 * Format: Country code followed by phone number (digits only, or with +/spaces/dashes).
 * Example: '919876543210' for India (+91)
 */
export const WHATSAPP_CONFIG = {
  phoneNumber: '919900106910',
  storeName: 'Pearls & Petals'
};

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  /**
   * Configurable WhatsApp Business phone number.
   * Can be updated here or in WHATSAPP_CONFIG.
   */
  phoneNumber: string = WHATSAPP_CONFIG.phoneNumber;
  storeName: string = WHATSAPP_CONFIG.storeName;

  /**
   * Generates the pre-filled order inquiry message for a product.
   * Uses the discount price if available, otherwise original price.
   * Includes the product ID and image URL so the seller can identify the exact item.
   * Example:
   *   "Hi Pearls & Petals, I am interested in Ruby Stone Chain priced at ₹1,199. Is it available?
   *    Product ID: abc-123
   *    Product Image: https://..."
   */
  createOrderMessage(product: Product): string {
    const effectivePrice = (product.discountPrice !== undefined && product.discountPrice !== null && product.discountPrice > 0)
      ? product.discountPrice
      : product.originalPrice;

    const formattedPrice = Number(effectivePrice).toLocaleString('en-IN');

    let message = `Hi ${this.storeName}, I am interested in *${product.name}* priced at ₹${formattedPrice}. Is it available?`;

    if (product.id) {
      message += `\n\n*Product ID:* ${product.id}`;
    }

    if (product.images && product.images.length > 0) {
      message += `\n*Product Image:* ${product.images[0]}`;
    }

    return message;
  }

  /**
   * Constructs the official WhatsApp Click to Chat URL with URL-encoded message.
   * Format: https://wa.me/<number>?text=<encoded_message>
   */
  getWhatsAppUrl(product: Product): string {
    let cleanNumber = this.phoneNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }
    const message = this.createOrderMessage(product);
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Opens WhatsApp in a new tab/window.
   * Functions seamlessly on both mobile (opens WhatsApp app) and desktop/laptop (opens WhatsApp Web/Desktop).
   */
  orderOnWhatsApp(product: Product): void {
    if (!product) return;
    const url = this.getWhatsAppUrl(product);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
