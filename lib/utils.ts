/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    if (rawMessage.includes("API key not found") || rawMessage.includes("403") || rawMessage.includes("invalid")) {
        return "Studio authentication failed. Please check your API key configuration in the environment variables.";
    }

    if (rawMessage.includes("Unsupported MIME type")) {
        return "The studio doesn't support this file format. Please use a standard JPG, PNG, or WebP image.";
    }

    if (rawMessage.includes("quota") || rawMessage.includes("429")) {
        return "The studio is currently at peak capacity. Please wait a moment before trying your next fitting.";
    }

    if (rawMessage.includes("fetch") || rawMessage.includes("network")) {
        return "Communication with the studio was interrupted. Please check your internet connection.";
    }
    
    // Fallback error message
    return `The studio encountered an issue while ${context}. Refreshing or using a different photo usually resolves this.`;
}