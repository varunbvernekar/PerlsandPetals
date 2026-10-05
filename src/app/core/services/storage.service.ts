import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable } from 'rxjs';

/** Allowed MIME types for product images (before WebP conversion) */
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

/** Accept any image/* type broadly */
const ALLOWED_TYPE_PREFIX = 'image/';

/** Max file size: 10 MB (before compression) */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface UploadProgress {
  file: File;
  progress: number; // 0–100
  downloadURL?: string;
  error?: string;
  state: 'pending' | 'uploading' | 'done' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.getClient();
  private bucketName = 'product-images';

  /**
   * Validates a file for type and size constraints.
   * Returns null if valid, or an error message string.
   */
  validateFile(file: File): string | null {
    const isImage = file.type.startsWith(ALLOWED_TYPE_PREFIX) || ALLOWED_TYPES.includes(file.type);
    if (!isImage) {
      return `"${file.name}" is not a supported image format. Please use JPG, PNG, WebP, or GIF.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      return `"${file.name}" is ${mb} MB — exceeds the 10 MB limit. Please use a smaller image.`;
    }
    return null;
  }

  /**
   * Uploads a single file to Supabase Storage under product-images/<productId>/<uniqueName>.
   * Returns an Observable emitting UploadProgress snapshots.
   */
  /**
   * Uploads a processed WebP blob (or a raw File) to Supabase Storage.
   * @param productId  Storage folder / product ID
   * @param file       Original File (used as fallback blob)
   * @param webpBlob   Optional pre-processed WebP Blob from ImageProcessingService
   * @param webpFilename Optional filename for the WebP blob (e.g. "photo.webp")
   */
  uploadProductImage(
    productId: string,
    file: File,
    webpBlob?: Blob,
    webpFilename?: string
  ): Observable<UploadProgress> {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${webpFilename ?? file.name.replace(/\.[^.]+$/, '') + '.webp'}`;
    const storagePath = `${productId}/${uniqueName}`;
    const uploadBlob: Blob = webpBlob ?? file;

    return new Observable<UploadProgress>(observer => {
      const performUpload = async () => {
        try {
          // Emit uploading state with 10% progress
          observer.next({ file, progress: 10, state: 'uploading' });

          // Upload optimized WebP blob (or original file) to Supabase Storage
          const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .upload(storagePath, uploadBlob, {
              contentType: 'image/webp',
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            console.error('[StorageService] Upload error:', error);
            observer.next({
              file,
              progress: 0,
              state: 'error',
              error: this.getUploadErrorMessage(error)
            });
            observer.complete();
            return;
          }

          // Emit 90% progress
          observer.next({ file, progress: 90, state: 'uploading' });

          // Get public URL
          const { data: publicData } = this.supabase.storage
            .from(this.bucketName)
            .getPublicUrl(storagePath);

          const downloadURL = publicData?.publicUrl;

          if (!downloadURL) {
            throw new Error('Failed to get download URL');
          }

          // Emit success state
          observer.next({
            file,
            progress: 100,
            state: 'done',
            downloadURL
          });
          observer.complete();
        } catch (err) {
          console.error('[StorageService] Upload error:', err);
          observer.next({
            file,
            progress: 0,
            state: 'error',
            error: this.getUploadErrorMessage(err)
          });
          observer.complete();
        }
      };

      performUpload();

      // Cleanup on unsubscribe (if needed)
      return () => {
        // Could cancel upload if Supabase supports it
      };
    });
  }

  /**
   * Deletes a file from Supabase Storage by its path.
   * Safely extracts the path from the URL and deletes the object.
   */
  async deleteImageByUrl(url: string): Promise<void> {
    if (!url || !url.includes('supabaseusercontent.com')) {
      // Not a Supabase Storage URL — skip deletion
      return;
    }

    try {
      // Extract path from URL: https://...supabaseusercontent.com/storage/v1/object/public/product-images/path/to/file
      const pathMatch = url.match(/\/storage\/v1\/object\/public\/([^?]+)/);
      if (!pathMatch || !pathMatch[1]) {
        console.warn('[StorageService] Could not extract path from URL:', url);
        return;
      }

      const path = pathMatch[1];
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        // If the file is already gone, that's fine
        if (error.message?.includes('not found')) {
          console.warn('[StorageService] File already deleted or not found:', url);
          return;
        }
        throw error;
      }
    } catch (err: any) {
      console.error('[StorageService] Failed to delete image:', err);
      throw err;
    }
  }

  /**
   * Translates Supabase Storage upload errors into friendly messages.
   */
  private getUploadErrorMessage(error: any): string {
    const message = error?.message || '';
    const status = error?.status || '';

    if (message.includes('unauthorized') || message.includes('not authenticated')) {
      return 'Permission denied. You must be signed in as admin to upload images.';
    }

    if (message.includes('Payload too large') || status === 413) {
      return 'File is too large. Please use images smaller than 5 MB.';
    }

    if (message.includes('bucket') && message.includes('not found')) {
      return 'Storage bucket not configured. Please contact support.';
    }

    if (message.includes('network') || status === 0) {
      return 'Network connection error. Please check your internet and try again.';
    }

    if (message.includes('duplicate')) {
      return 'File already exists. Please try a different file name.';
    }

    return message || 'Image upload failed. Please try again.';
  }
}
