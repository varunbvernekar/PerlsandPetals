import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { Product } from '../../models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  featuredProducts: Product[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  private sub?: Subscription;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  loadFeaturedProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.sub?.unsubscribe();
    this.sub = this.productService.getFeaturedProducts().subscribe({
      next: (products) => {
        this.featuredProducts = products;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading featured products from catalog:', err);
        this.isLoading = false;
        this.errorMessage = this.productService.getErrorMessage(err);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

