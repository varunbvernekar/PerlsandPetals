import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  ViewChild,
  inject,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { ProductCardComponent } from '../product-card/product-card.component';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit, OnDestroy {
  @Output() closeSearch = new EventEmitter<void>();
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  private productService = inject(ProductService);

  query = '';
  allProducts: Product[] = [];
  results: Product[] = [];
  isLoading = true;
  hasSearched = false;

  private sub?: Subscription;

  ngOnInit(): void {
    // Load all products once — search is done client-side
    this.sub = this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.isLoading = false;
        // Focus the input after data loads
        setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 50);
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  /** Filters products by query against name, category, description, and id */
  onQueryChange(): void {
    const q = this.query.trim().toLowerCase().replace(/\s+/g, ' ');
    this.hasSearched = q.length > 0;

    if (!q) {
      this.results = [];
      return;
    }

    this.results = this.allProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const description = (p.description || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      return (
        name.includes(q) ||
        category.includes(q) ||
        description.includes(q) ||
        id.includes(q)
      );
    });
  }

  clearQuery(): void {
    this.query = '';
    this.results = [];
    this.hasSearched = false;
    this.searchInputRef?.nativeElement?.focus();
  }

  /** Close when clicking the backdrop (outside the panel) */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('search-backdrop')) {
      this.close();
    }
  }

  close(): void {
    this.closeSearch.emit();
  }

  /** Close on Escape key */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  /** TrackBy for efficient product card rendering */
  trackById(_index: number, product: Product): string {
    return product.id ?? product.slug ?? String(_index);
  }

  /** Prevent body scroll while search is open */
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
