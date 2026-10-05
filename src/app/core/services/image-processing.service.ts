import { Injectable } from '@angular/core';

/** Result of processing an image */
export interface ProcessedImage {
  /** The optimized WebP blob */
  blob: Blob;
  /** Suggested filename with .webp extension */
  filename: string;
  /** Original width in pixels */
  originalWidth: number;
  /** Original height in pixels */
  originalHeight: number;
  /** Output width in pixels */
  outputWidth: number;
  /** Output height in pixels */
  outputHeight: number;
  /** Output file size in bytes */
  outputSize: number;
}

/** Maximum allowed length (px) on the longest side */
const MAX_SIDE_PX = 1200;

/** WebP quality (0–1) */
const WEBP_QUALITY = 0.85;

@Injectable({
  providedIn: 'root'
})
export class ImageProcessingService {

  /**
   * Loads a File into an HTMLImageElement and returns it.
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load image: ${file.name}`));
      };
      img.src = url;
    });
  }

  /**
   * Calculates the output dimensions for the image:
   * - Never upscales (output <= original)
   * - Longest side capped at MAX_SIDE_PX
   * - Aspect ratio preserved
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number
  ): { width: number; height: number } {
    const longestSide = Math.max(originalWidth, originalHeight);

    // Do not upscale
    if (longestSide <= MAX_SIDE_PX) {
      return { width: originalWidth, height: originalHeight };
    }

    const scale = MAX_SIDE_PX / longestSide;
    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale)
    };
  }

  /**
   * Processes a single image file:
   * 1. Resizes to max 1200px longest side (no upscaling)
   * 2. Converts to WebP at 85% quality
   * Returns a ProcessedImage with the WebP blob and metadata.
   */
  async processImage(file: File): Promise<ProcessedImage> {
    const img = await this.loadImage(file);

    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    const { width: outputWidth, height: outputHeight } = this.calculateDimensions(
      originalWidth,
      originalHeight
    );

    // Draw onto canvas
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context is not available.');
    }

    ctx.drawImage(img, 0, 0, outputWidth, outputHeight);

    // Export as WebP
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error('Canvas toBlob returned null.'));
          }
        },
        'image/webp',
        WEBP_QUALITY
      );
    });

    // Build a clean filename: strip extension, add .webp
    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${baseName}.webp`;

    return {
      blob,
      filename,
      originalWidth,
      originalHeight,
      outputWidth,
      outputHeight,
      outputSize: blob.size
    };
  }

  /**
   * Processes multiple files and returns results in order.
   */
  async processImages(files: File[]): Promise<ProcessedImage[]> {
    return Promise.all(files.map(f => this.processImage(f)));
  }

  /**
   * Returns a human-readable size string, e.g. "234 KB".
   */
  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
