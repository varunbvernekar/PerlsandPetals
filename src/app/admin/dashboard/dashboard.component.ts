import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  public productService = inject(ProductService);
  public authService = inject(AuthService);

  totalProducts = 0;
  availableProducts = 0;
  onSaleProducts = 0;
  featuredProducts = 0;
  isLoading = true;
  errorMessage = '';
  private sub?: Subscription;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.sub?.unsubscribe();

    this.sub = this.productService.getProducts().subscribe({
      next: (products) => {
        this.totalProducts = products.length;
        this.availableProducts = products.filter(product => product.available !== false).length;
        this.onSaleProducts = products.filter(product => product.onSale === true).length;
        this.featuredProducts = products.filter(product => product.featured === true).length;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard metrics from catalog:', err);
        this.errorMessage = this.productService.getErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
