/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Image validation constants
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validates an image file for size and type
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please use JPG, PNG, or WebP images only.'
        };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return {
            valid: false,
            error: `File size exceeds ${MAX_IMAGE_SIZE_MB}MB limit. Please use a smaller image.`
        };
    }

    return { valid: true };
}

/**
 * Compresses an image to reduce file size and optimize for API calls
 */
export async function compressImage(file: File, maxWidth: number = 1024, quality: number = 0.85): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if image is too large
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Could not compress image'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    file.type,
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

/**
 * Converts a data URL to a Blob for more efficient storage
 */
export function dataUrlToBlob(dataUrl: string): Blob | null {
    try {
        const arr = dataUrl.split(',');
        if (arr.length < 2) return null;
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) return null;
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    } catch {
        return null;
    }
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
    return input.replace(/[<>]/g, '');
}

/**
 * Provides user-friendly error messages for various API errors
 */
export function getFriendlyErrorMessage(error: unknown, context: string): string {
    let rawMessage = 'An unexpected connection issue occurred.';
    if (error instanceof Error) {
        rawMessage = error.message;
    } else if (typeof error === 'string') {
        rawMessage = error;
    }

    // Handle Safety filter specifically
    if (rawMessage.includes("SAFETY")) {
        return "Our AI safety filters flagged this image. Please try a different, professional-style portrait with clear lighting.";
    }

    // Handle API Key issues (helpful for Vercel deployment debugging)
    if (rawMessage.includes("API key not found") || rawMessage.includes("403") || rawMessage.includes("invalid") || rawMessage.includes("API_KEY")) {
        return "Studio authentication failed. Please check your API key configuration in the environment variables.";
    }

    if (rawMessage.includes("Unsupported MIME type") || rawMessage.includes("mime")) {
        return "The studio doesn't support this file format. Please use a standard JPG, PNG, or WebP image.";
    }

    if (rawMessage.includes("quota") || rawMessage.includes("429") || rawMessage.includes("rate limit")) {
        return "The studio is currently at peak capacity. Please wait a moment before trying your next fitting.";
    }

    if (rawMessage.includes("fetch") || rawMessage.includes("network") || rawMessage.includes("CORS")) {
        return "Communication with the studio was interrupted. Please check your internet connection.";
    }

    if (rawMessage.includes("timeout")) {
        return "The request took too long to complete. Please try again with a smaller image.";
    }

    // Fallback error message
    return `The studio encountered an issue while ${context}. Refreshing or using a different photo usually resolves this.`;
}