import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductService } from '../../core/services/product.service';
import { WhatsAppService } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  productId: string = '';
  product: Product | null = null;
  selectedImage: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';
  private routeSub?: Subscription;
  private productSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    public whatsAppService: WhatsAppService
  ) {}

  ngOnInit(): void {
    this.scrollToTop();

    this.routeSub = this.route.params.subscribe(params => {
      this.productId = params['id'] || '';
      this.scrollToTop();
      if (this.productId) {
        this.loadProduct();
      } else {
        this.isLoading = false;
        this.errorMessage = 'No product specified.';
      }
    });
  }

  private scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }

  loadProduct(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.productSub?.unsubscribe();

    this.productSub = this.productService.getProductById(this.productId).subscribe({
      next: (prod) => {
        this.isLoading = false;
        if (prod) {
          this.product = prod;
          this.selectedImage = (prod.images && prod.images.length > 0) ? prod.images[0] : '';
          setTimeout(() => this.scrollToTop(), 0);
        } else {
          this.product = null;
          this.errorMessage = 'The requested creation could not be found.';
        }
      },
      error: (err) => {
        console.error('Error loading product details from catalog:', err);
        this.isLoading = false;
        this.errorMessage = this.productService.getErrorMessage(err);
      }
    });
  }

  orderOnWhatsApp(): void {
    if (this.product) {
      this.whatsAppService.orderOnWhatsApp(this.product);
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.productSub?.unsubscribe();
  }
}


