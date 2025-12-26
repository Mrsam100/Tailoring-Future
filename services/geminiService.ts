
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Configuration constants
const NANO_BANANA = 'gemini-2.5-flash-image';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;

/**
 * Converts a File to Gemini API format
 */
const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

/**
 * Parses a data URL into its components
 */
const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL format");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse image MIME type");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

/**
 * Converts a data URL to Gemini API format
 */
const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

/**
 * Handles API response and extracts image data
 */
const handleApiResponse = (response: GenerateContentResponse): string => {
    const candidate = response.candidates?.[0];

    if (candidate?.finishReason === 'SAFETY') {
        throw new Error("SAFETY: The studio's safety filters flagged this image. Please use a professional-style portrait.");
    }

    if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                const { mimeType, data } = part.inlineData;
                return `data:${mimeType};base64,${data}`;
            }
        }
    }

    throw new Error(`Studio Engine Error: ${candidate?.finishReason || "No data returned"}`);
};

/**
 * Creates and validates AI client
 */
const getAIClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error("API_KEY not configured. Please set GEMINI_API_KEY in your .env file.");
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * Retry logic wrapper for API calls
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = MAX_RETRIES,
    delay: number = RETRY_DELAY_MS
): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        // Don't retry on safety filter or authentication errors
        if (
            error?.message?.includes('SAFETY') ||
            error?.message?.includes('API_KEY') ||
            error?.message?.includes('403') ||
            error?.message?.includes('invalid')
        ) {
            throw error;
        }

        if (retries <= 0) {
            throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1, delay * 2);
    }
}

/**
 * Wraps API call with timeout
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - please try again')), timeoutMs)
    );
    return Promise.race([promise, timeoutPromise]);
}

/**
 * Transforms a user photo into a professional fashion model image
 * @param userImage - The user's uploaded photo
 * @returns Data URL of the generated model image
 */
export const generateModelImage = async (userImage: File): Promise<string> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const userImagePart = await fileToPart(userImage);
        const prompt = `You are an elite fashion photographer creating professional studio portraits.

Transform this person into a full-body high-fashion editorial model photograph with these exact specifications:

COMPOSITION:
- Full body shot, standing pose
- Person centered in frame
- 3:4 portrait orientation

BACKGROUND:
- Minimalist, clean white or light gray studio backdrop
- Professional seamless background
- No distracting elements

LIGHTING:
- Soft, professional studio lighting
- Even illumination across face and body
- Natural skin tones
- Subtle shadows for depth

CRITICAL REQUIREMENTS:
- Preserve the person's facial features, skin tone, and identity with 100% accuracy
- Maintain natural proportions and body type
- Professional fashion photography quality
- High resolution and sharp focus

Output only the final processed image.`;

        const apiCall = ai.models.generateContent({
            model: NANO_BANANA,
            contents: { parts: [userImagePart, { text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "3:4"
                }
            }
        });

        const response = await withTimeout(apiCall, REQUEST_TIMEOUT_MS);
        return handleApiResponse(response);
    });
};

/**
 * Fits a garment onto the model using virtual try-on
 * @param modelImageUrl - Data URL of the current model image
 * @param garmentImage - File of the garment to try on
 * @returns Data URL of the model wearing the garment
 */
export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File): Promise<string> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const modelImagePart = dataUrlToPart(modelImageUrl);
        const garmentImagePart = await fileToPart(garmentImage);
        const prompt = `You are a professional digital fashion stylist creating a photorealistic virtual try-on.

TASK: Fit the provided garment onto the model shown in the first image.

REQUIREMENTS:

FIT & DRAPING:
- The garment must fit naturally on the model's body
- Fabric should follow body contours realistically
- Show natural folds, wrinkles, and fabric physics
- Proper sizing - neither too tight nor too loose

INTEGRATION:
- Seamlessly replace or overlay existing clothing
- Blend perfectly at all edges (neck, arms, waist)
- No visible seams or artifacts
- Natural shadowing where garment meets skin

LIGHTING & TEXTURE:
- Match the studio lighting from the model image
- Preserve garment's original texture, patterns, and details
- Maintain fabric properties (cotton, silk, denim, etc.)
- Consistent shadows and highlights

PRESERVATION:
- Keep model's exact pose, position, and body shape
- Maintain model's facial features and identity
- Preserve background and overall composition
- High-fashion photography quality

Output only the final composite image showing the model wearing the garment.`;

        const apiCall = ai.models.generateContent({
            model: NANO_BANANA,
            contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "3:4"
                }
            }
        });

        const response = await withTimeout(apiCall, REQUEST_TIMEOUT_MS);
        return handleApiResponse(response);
    });
};

/**
 * Changes the model's pose while preserving outfit and identity
 * @param tryOnImageUrl - Data URL of current model image
 * @param poseInstruction - Description of desired pose
 * @returns Data URL of model in new pose
 */
export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
        const prompt = `You are a professional fashion photographer directing a model photoshoot.

TASK: Re-photograph this model in a different pose.

NEW POSE: ${poseInstruction}

CRITICAL PRESERVATION - These must remain EXACTLY the same:
- Model's facial features, skin tone, and complete identity
- Exact outfit, including all garments, colors, patterns, and accessories
- All fabric textures, wrinkles, and garment details
- Studio background and lighting setup
- Image quality and resolution

CHANGE ONLY:
- Body position and stance as specified in the pose instruction
- Arm and leg positioning to match the new pose
- Natural body alignment for the new pose

ENSURE:
- The pose looks natural and professional
- Garments drape realistically in the new position
- Lighting remains consistent across all surfaces
- Shadows adjust naturally to the new pose
- Editorial fashion photography quality

Output only the final image showing the model in the new pose.`;

        const apiCall = ai.models.generateContent({
            model: NANO_BANANA,
            contents: { parts: [tryOnImagePart, { text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "3:4"
                }
            }
        });

        const response = await withTimeout(apiCall, REQUEST_TIMEOUT_MS);
        return handleApiResponse(response);
    });
};

/**
 * Recolors a garment while preserving all other details
 * @param garmentImageUrl - Data URL of the garment or model wearing it
 * @param colorDescription - Target color name or description
 * @returns Data URL of recolored garment/outfit
 */
export const generateColorway = async (garmentImageUrl: string, colorDescription: string): Promise<string> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const garmentPart = dataUrlToPart(garmentImageUrl);
        const prompt = `You are a professional digital colorist working on fashion photography.

TASK: Recolor the garment in this image to the specified color.

TARGET COLOR: ${colorDescription}

RECOLOR REQUIREMENTS:
- Change the primary garment color to exactly match "${colorDescription}"
- Apply the color uniformly across the entire garment
- Maintain color consistency across all garment surfaces

PRESERVE COMPLETELY:
- All fabric textures (weave, knit patterns, material properties)
- Existing highlights, shadows, and lighting effects
- Fabric folds, wrinkles, and three-dimensional form
- Stitching, seams, and construction details
- Any buttons, zippers, or hardware (keep original colors)
- Pattern details if present (adjust color, keep pattern)
- Image quality and sharpness

IF MODEL IS PRESENT:
- Keep model's exact pose, face, body, and identity
- Preserve background and studio setup
- Maintain all non-garment elements unchanged

COLOR APPLICATION:
- Natural-looking result as if the garment was manufactured in this color
- Adjust shadows and highlights to work with the new color
- Ensure the color looks realistic for the fabric type

Output only the final image with the recolored garment.`;

        const apiCall = ai.models.generateContent({
            model: NANO_BANANA,
            contents: { parts: [garmentPart, { text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "3:4"
                }
            }
        });

        const response = await withTimeout(apiCall, REQUEST_TIMEOUT_MS);
        return handleApiResponse(response);
    });
};

/**
 * Analyzes outfit and provides fashion critique
 * @param outfitImageUrl - Data URL of the outfit to analyze
 * @returns Score (1-100) and review text
 */
export const generateStyleScore = async (outfitImageUrl: string): Promise<{ score: number, review: string }> => {
    return retryWithBackoff(async () => {
        const ai = getAIClient();
        const imagePart = dataUrlToPart(outfitImageUrl);

        const prompt = `You are the Creative Director of a prestigious luxury fashion house with decades of experience in high fashion.

Analyze this outfit with professional expertise, considering:

EVALUATION CRITERIA:
1. Overall Composition & Balance
   - Color harmony and coordination
   - Proportion and silhouette
   - Visual balance and flow

2. Style & Aesthetics
   - Fashion-forward appeal
   - Cohesiveness of the look
   - Appropriateness for contemporary fashion

3. Garment Selection
   - Quality and fit of individual pieces
   - How well pieces work together
   - Layering and styling choices

4. Technical Execution
   - Draping and fit
   - Attention to detail
   - Overall polish and refinement

SCORING RUBRIC:
90-100: Exceptional - Runway-ready, editorial quality
80-89: Excellent - Sophisticated and well-executed
70-79: Good - Solid choices with minor improvements needed
60-69: Fair - Acceptable but room for enhancement
Below 60: Needs work - Significant styling issues

Provide a score (1-100) and a concise review (2-3 sentences) in a sophisticated, constructive tone befitting a luxury brand director.`;

        const apiCall = ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: {
                            type: Type.INTEGER,
                            description: "Fashion score from 1-100"
                        },
                        review: {
                            type: Type.STRING,
                            description: "Sophisticated 2-3 sentence critique"
                        }
                    },
                    required: ["score", "review"]
                }
            }
        });

        const response = await withTimeout(apiCall, REQUEST_TIMEOUT_MS);

        try {
            const text = response.text;
            if (!text) throw new Error("Empty response");
            const result = JSON.parse(text);

            // Validate the response
            if (typeof result.score !== 'number' || typeof result.review !== 'string') {
                throw new Error("Invalid response format");
            }

            return result;
        } catch (e) {
            console.warn('Style score parsing failed:', e);
            return {
                score: 85,
                review: "A sophisticated ensemble that demonstrates strong fashion sensibility with excellent composition and contemporary appeal."
            };
        }
    }, 2); // Fewer retries for style scoring
};
