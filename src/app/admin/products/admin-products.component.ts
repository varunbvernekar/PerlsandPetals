import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss'
})
export class AdminProductsComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);

  productList: Product[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  deletingId: string | null = null;
  confirmDeleteId: string | null = null;
  confirmDeleteName = '';

  private sub?: Subscription;

  ngOnInit(): void {
    this.loadProducts();

    // Show success message if redirected from add/edit
    const qp = this.route.snapshot.queryParams;
    if (qp['success'] === 'added') {
      this.successMessage = `"${qp['name'] || 'Product'}" was added successfully.`;
      setTimeout(() => this.successMessage = '', 5000);
    } else if (qp['success'] === 'updated') {
      this.successMessage = `"${qp['name'] || 'Product'}" was updated successfully.`;
      setTimeout(() => this.successMessage = '', 5000);
    }
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.sub?.unsubscribe();
    this.sub = this.productService.getProducts().subscribe({
      next: (products) => {
        this.productList = products;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching admin products:', err);
        this.errorMessage = this.productService.getErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  promptDelete(product: Product): void {
    this.confirmDeleteId = product.id || null;
    this.confirmDeleteName = product.name;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
    this.confirmDeleteName = '';
  }

  async confirmDelete(): Promise<void> {
    if (!this.confirmDeleteId) return;
    const idToDelete = this.confirmDeleteId;
    this.deletingId = idToDelete;
    this.confirmDeleteId = null;
    this.errorMessage = '';

    try {
      await this.productService.deleteProduct(idToDelete);
      this.successMessage = `"${this.confirmDeleteName || 'Product'}" was deleted successfully.`;
      setTimeout(() => this.successMessage = '', 4000);
    } catch (err: any) {
      console.error('Delete failed:', err);
      this.errorMessage = 'Failed to delete product: ' + (err?.message || 'Unknown error');
    } finally {
      this.deletingId = null;
      this.confirmDeleteName = '';
    }
  }

  getDiscountPercent(p: Product): number {
    return this.productService.calculateDiscountPercent(p.originalPrice, p.discountPrice || 0);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
