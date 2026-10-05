import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { Product } from '../../models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
  selectedCategory: string = 'All';
  products: Product[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  private routeSub?: Subscription;
  private productSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      this.selectedCategory = params['category'] || 'All';
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.productSub?.unsubscribe();

    const fetch$ = (this.selectedCategory && this.selectedCategory.toLowerCase() !== 'all')
      ? this.productService.getProductsByCategory(this.selectedCategory)
      : this.productService.getProducts();

    this.productSub = fetch$.subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching products from catalog:', err);
        this.isLoading = false;
        this.errorMessage = this.productService.getErrorMessage(err);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.productSub?.unsubscribe();
  }
}

