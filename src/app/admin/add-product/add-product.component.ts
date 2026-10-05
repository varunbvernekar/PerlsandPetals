import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
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

/** Cross-field validator: discount must be < original */
function discountValidator(group: AbstractControl): ValidationErrors | null {
  const orig = Number(group.get('originalPrice')?.value);
  const disc = Number(group.get('discountPrice')?.value);
  if (!disc) return null;
  if (disc < 0) return { discountNegative: true };
  if (disc >= orig) return { discountTooHigh: true };
  return null;
}

/** Represents a file selected for upload (before upload) */
interface PendingImage {
  file: File;
  previewUrl: string;
  progress: number;
  state: 'pending' | 'processing' | 'uploading' | 'done' | 'error';
  downloadURL?: string;
  error?: string;
  /** WebP blob from ImageProcessingService (set after processing) */
  processedBlob?: Blob;
  processedFilename?: string;
  /** Dimensions and size info for display */
  outputWidth?: number;
  outputHeight?: number;
  outputSize?: number;
}

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private productService = inject(ProductService);
  private storageService = inject(StorageService);
  private imageProcessing = inject(ImageProcessingService);

  form!: FormGroup;
  isSaving = false;
  isUploading = false;
  isProcessing = false;
  errorMessage = '';
  fileError = '';
  discountPercent = 0;

  /** Images selected by the user but not yet uploaded */
  pendingImages: PendingImage[] = [];

  /** Already-uploaded image URLs (ready to save) */
  uploadedUrls: string[] = [];

  readonly categories = ['Necklaces', 'Earrings', 'Rings', 'Bracelets', 'Sets', 'Pendants'];

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

    // Update discount % live whenever prices change
    this.form.valueChanges.subscribe(() => {
      const orig = Number(this.form.value.originalPrice);
      const disc = Number(this.form.value.discountPrice);
      this.discountPercent = this.productService.calculateDiscountPercent(orig, disc);
    });
  }

  get f() { return this.form.controls; }

  // ──────────────────────────────────────────────────────────────────
  // Image handling
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

    // Reset input so the same file can be re-selected if removed
    input.value = '';
  }

  removePendingImage(index: number): void {
    const img = this.pendingImages[index];
    if (img) {
      URL.revokeObjectURL(img.previewUrl);
    }
    this.pendingImages.splice(index, 1);
  }

  removeUploadedImage(index: number): void {
    this.uploadedUrls.splice(index, 1);
  }

  moveImageLeft(index: number): void {
    if (index === 0) return;
    [this.uploadedUrls[index - 1], this.uploadedUrls[index]] = [this.uploadedUrls[index], this.uploadedUrls[index - 1]];
  }

  moveImageRight(index: number): void {
    if (index === this.uploadedUrls.length - 1) return;
    [this.uploadedUrls[index + 1], this.uploadedUrls[index]] = [this.uploadedUrls[index], this.uploadedUrls[index + 1]];
  }

  get allUploaded(): boolean {
    return this.pendingImages.every(img => img.state === 'done' || img.state === 'error');
  }

  get hasUploading(): boolean {
    return this.pendingImages.some(img => img.state === 'uploading' || img.state === 'processing');
  }

  /**
   * Processes all pending images to WebP (browser-side) then uploads to Storage.
   * Processing: resize to max 1200px longest side, convert to WebP at 85% quality.
   */
  async uploadImages(): Promise<void> {
    const name = this.form.get('name')?.value?.trim();
    if (!name) {
      this.fileError = 'Please enter a product name before uploading images.';
      return;
    }

    // Create a temporary storage folder ID based on slug
    const tempId = this.productService.generateId(this.productService.generateSlug(name));

    this.fileError = '';

    const pending = this.pendingImages.filter(img => img.state === 'pending');
    if (pending.length === 0) {
      return;
    }

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
        console.error(`[AddProductComponent] Processing error for ${img.file.name}:`, err);
      }
    }
    this.isProcessing = false;

    // ── Step 2: Upload processed WebP blobs ──
    this.isUploading = true;
    const readyToUpload = pending.filter(img => img.state === 'pending' && img.processedBlob);

    for (const img of readyToUpload) {
      img.state = 'uploading';

      await new Promise<void>((resolve) => {
        let isResolved = false;

        const timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            img.state = 'error';
            img.error = 'Upload timeout. Please try again.';
            console.error(`[AddProductComponent] Upload timeout for file: ${img.file.name}`);
            resolve();
          }
        }, 5 * 60 * 1000);

        const sub = this.storageService.uploadProductImage(
          tempId,
          img.file,
          img.processedBlob,
          img.processedFilename
        ).subscribe({
          next: (progress: UploadProgress) => {
            img.progress = progress.progress;
            img.state = progress.state;
            if (progress.state === 'done' && progress.downloadURL) {
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeoutId);
                img.downloadURL = progress.downloadURL;
                this.uploadedUrls.push(progress.downloadURL);
                resolve();
              }
            } else if (progress.state === 'error') {
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeoutId);
                img.error = progress.error;
                resolve();
              }
            }
          },
          error: (err) => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeoutId);
              img.state = 'error';
              img.error = err?.message || 'Upload failed';
              resolve();
            }
          }
        });
        this.uploadSubs.push(sub);
      });
    }

    this.isUploading = false;
    // Remove successfully uploaded images from pending list
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
      await this.productService.addProduct({
        name: raw.name.trim(),
        category: raw.category,
        description: raw.description.trim(),
        originalPrice: Number(raw.originalPrice),
        discountPrice,
        onSale: !!raw.onSale,
        available: !!raw.available,
        featured: !!raw.featured,
        images: [...this.uploadedUrls]
      });
      this.router.navigate(['/admin/products'], {
        queryParams: { success: 'added', name: raw.name.trim() }
      });
    } catch (err: any) {
      console.error('Add product failed:', err);
      this.errorMessage = 'Failed to save product: ' + (err?.message || 'Unknown error.');
      this.isSaving = false;
    }
  }

  ngOnDestroy(): void {
    // Revoke all object URLs to avoid memory leaks
    this.pendingImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    this.uploadSubs.forEach(s => s.unsubscribe());
  }
}
