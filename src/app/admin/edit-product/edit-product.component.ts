import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { StorageService, UploadProgress } from '../../core/services/storage.service';
import { ImageProcessingService } from '../../core/services/image-processing.service';
import { Product } from '../../models/product.model';

/** Cross-field validator: discount must be < original */
function discountValidator(group: AbstractControl): ValidationErrors | null {
  const orig = Number(group.get('originalPrice')?.value);
  const disc = Number(group.get('discountPrice')?.value);
  if (!disc) return null;
  if (disc < 0) return { discountNegative: true };
  if (disc >= orig) return { discountTooHigh: true };
  return null;
}

/** Represents a pending file selected for upload */
interface PendingImage {
  file: File;
  previewUrl: string;
  progress: number;
  state: 'pending' | 'processing' | 'uploading' | 'done' | 'error';
  downloadURL?: string;
  error?: string;
  /** WebP blob from ImageProcessingService */
  processedBlob?: Blob;
  processedFilename?: string;
  outputWidth?: number;
  outputHeight?: number;
  outputSize?: number;
}

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.scss'
})
export class EditProductComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private storageService = inject(StorageService);
  private imageProcessing = inject(ImageProcessingService);

  product: Product | null = null;
  form!: FormGroup;
  productId = '';
  productName = '';
  isLoading = true;
  isSaving = false;
  isUploading = false;
  isProcessing = false;
  loadError = '';
  errorMessage = '';
  fileError = '';
  discountPercent = 0;

  /** Existing image URLs loaded from the current product */
  existingImages: string[] = [];

  /** URLs removed by the admin during this session (to delete from Storage on save) */
  removedImageUrls: string[] = [];

  /** New files selected for upload */
  pendingImages: PendingImage[] = [];

  readonly categories = ['Necklaces', 'Earrings', 'Rings', 'Bracelets', 'Sets', 'Pendants'];

  private sub?: Subscription;
  private uploadSubs: Subscription[] = [];

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      originalPrice: [null, [Validators.required, Validators.min(1)]],
      discountPrice: [null],
      onSale: [false],
      available: [true],
      featured: [false]
    }, { validators: discountValidator });

    this.productId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.productId) {
      this.router.navigate(['/admin/products']);
      return;
    }

    this.sub = this.productService.getProduct(this.productId).subscribe({
      next: (product) => {
        if (!product) {
          this.loadError = 'Product not found.';
          this.isLoading = false;
          return;
        }
        this.product = product;
        this.productName = product.name;
        this.existingImages = product.images ? [...product.images] : [];

        this.form.patchValue({
          name: product.name,
          category: product.category,
          description: product.description,
          originalPrice: product.originalPrice,
          discountPrice: product.discountPrice ?? null,
          onSale: product.onSale,
          available: product.available,
          featured: product.featured
        });
        this.discountPercent = this.productService.calculateDiscountPercent(
          product.originalPrice,
          product.discountPrice || 0
        );
        this.isLoading = false;

        // Live discount preview
        this.form.valueChanges.subscribe(() => {
          const orig = Number(this.form.value.originalPrice);
          const disc = Number(this.form.value.discountPrice);
          this.discountPercent = this.productService.calculateDiscountPercent(orig, disc);
        });
      },
      error: (err) => {
        console.error('Failed to load product:', err);
        this.loadError = 'Failed to load product: ' + (err?.message || 'Unknown error');
        this.isLoading = false;
      }
    });
  }

  get f() { return this.form.controls; }

  // ──────────────────────────────────────────────────────────────────
  // Existing images management
  // ──────────────────────────────────────────────────────────────────

  removeExistingImage(index: number): void {
    const url = this.existingImages[index];
    this.existingImages.splice(index, 1);
    // Queue for deletion from Storage on save
    if (url) {
      this.removedImageUrls.push(url);
    }
  }

  moveExistingLeft(index: number): void {
    if (index === 0) return;
    [this.existingImages[index - 1], this.existingImages[index]] = [this.existingImages[index], this.existingImages[index - 1]];
  }

  moveExistingRight(index: number): void {
    if (index === this.existingImages.length - 1) return;
    [this.existingImages[index + 1], this.existingImages[index]] = [this.existingImages[index], this.existingImages[index + 1]];
  }

  // ──────────────────────────────────────────────────────────────────
  // New image upload
  // ──────────────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.fileError = '';
    const files = Array.from(input.files);

    for (const file of files) {
      const validationError = this.storageService.validateFile(file);
      if (validationError) {
        this.fileError = validationError;
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      this.pendingImages.push({ file, previewUrl, progress: 0, state: 'pending' });
    }

    input.value = '';
  }

  removePendingImage(index: number): void {
    const img = this.pendingImages[index];
    if (img) URL.revokeObjectURL(img.previewUrl);
    this.pendingImages.splice(index, 1);
  }

  get allUploaded(): boolean {
    return this.pendingImages.every(img => img.state === 'done' || img.state === 'error');
  }

  get hasUploading(): boolean {
    return this.pendingImages.some(img => img.state === 'uploading' || img.state === 'processing');
  }

  async uploadImages(): Promise<void> {
    const pending = this.pendingImages.filter(img => img.state === 'pending');
    if (pending.length === 0) return;

    this.fileError = '';

    // ── Step 1: Process images to WebP (browser-side) ──
    this.isProcessing = true;
    for (const img of pending) {
      img.state = 'processing';
      try {
        const processed = await this.imageProcessing.processImage(img.file);
        img.processedBlob = processed.blob;
        img.processedFilename = processed.filename;
        img.outputWidth = processed.outputWidth;
        img.outputHeight = processed.outputHeight;
        img.outputSize = processed.outputSize;
        img.state = 'pending'; // ready to upload
      } catch (err: any) {
        img.state = 'error';
        img.error = `Processing failed: ${err?.message || 'Unknown error'}`;
        console.error(`[EditProductComponent] Processing error for ${img.file.name}:`, err);
      }
    }
    this.isProcessing = false;

    // ── Step 2: Upload processed WebP blobs ──
    this.isUploading = true;
    const readyToUpload = pending.filter(img => img.state === 'pending' && img.processedBlob);

    for (const img of readyToUpload) {
      img.state = 'uploading';

      await new Promise<void>(resolve => {
        const sub = this.storageService.uploadProductImage(
          this.productId,
          img.file,
          img.processedBlob,
          img.processedFilename
        ).subscribe({
          next: (progress: UploadProgress) => {
            img.progress = progress.progress;
            img.state = progress.state;
            if (progress.state === 'done' && progress.downloadURL) {
              img.downloadURL = progress.downloadURL;
              this.existingImages.push(progress.downloadURL);
              resolve();
            } else if (progress.state === 'error') {
              img.error = progress.error;
              resolve();
            }
          },
          error: (err) => {
            img.state = 'error';
            img.error = err?.message || 'Upload failed';
            resolve();
          }
        });
        this.uploadSubs.push(sub);
      });
    }

    this.isUploading = false;
    // Remove successfully uploaded from pending
    this.pendingImages = this.pendingImages.filter(img => img.state !== 'done');
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    if (this.hasUploading) {
      this.errorMessage = 'Please wait for all uploads to complete before saving.';
      return;
    }

    if (this.pendingImages.some(img => img.state === 'pending')) {
      this.errorMessage = 'You have images selected but not yet uploaded. Click "Upload Images" first, or remove them.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const raw = this.form.value;
    const discountPrice = raw.discountPrice ? Number(raw.discountPrice) : undefined;

    try {
      // Save the updated product with the final image list
      await this.productService.updateProduct(this.productId, {
        name: raw.name.trim(),
        category: raw.category,
        description: raw.description.trim(),
        originalPrice: Number(raw.originalPrice),
        discountPrice,
        onSale: !!raw.onSale,
        available: !!raw.available,
        featured: !!raw.featured,
        images: [...this.existingImages]
      });

      // After successful save, safely delete removed images from Storage
      for (const url of this.removedImageUrls) {
        try {
          await this.storageService.deleteImageByUrl(url);
        } catch (err) {
          // Log but don't fail the save — the product is already updated
          console.warn('[EditProduct] Could not delete removed image from Storage:', url, err);
        }
      }

      this.router.navigate(['/admin/products'], {
        queryParams: { success: 'updated', name: raw.name.trim() }
      });
    } catch (err: any) {
      console.error('Update product failed:', err);
      this.errorMessage = 'Failed to update product: ' + (err?.message || 'Unknown error.');
      this.isSaving = false;
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.pendingImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    this.uploadSubs.forEach(s => s.unsubscribe());
  }
}
