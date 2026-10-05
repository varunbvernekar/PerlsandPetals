import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  @Input() product?: Product;

  /**
   * Returns the main product image or a placeholder if none available
   */
  getMainImage(): string {
    if (this.product?.images && this.product.images.length > 0) {
      return this.product.images[0];
    }
    return 'https://via.placeholder.com/400x400?text=No+Image';
  }

  /**
   * Handles image load errors by setting a placeholder
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/400x400?text=No+Image';
  }
}
