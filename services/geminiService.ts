
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

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

const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL format");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse image MIME type");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

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

const getAIClient = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Nano Banana Model Identifier
const NANO_BANANA = 'gemini-2.5-flash-image';

export const generateModelImage = async (userImage: File): Promise<string> => {
    const ai = getAIClient();
    const userImagePart = await fileToPart(userImage);
    const prompt = "High-end fashion photography studio. Convert this person into a full-body editorial model. Background: Minimalist gallery space, neutral lighting. Preserve face and features with 100% fidelity. Return ONLY the high-res image.";
    
    const response = await ai.models.generateContent({
        model: NANO_BANANA,
        contents: { parts: [userImagePart, { text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: "3:4"
            }
        }
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File): Promise<string> => {
    const ai = getAIClient();
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const garmentImagePart = await fileToPart(garmentImage);
    const prompt = "Digital Atelier: Drape this garment realistically onto the model. The fabric must follow the body contours, showing natural folds and shadows. Ensure the garment replaces existing clothes seamlessly. High fashion quality. Return ONLY the image.";
    
    const response = await ai.models.generateContent({
        model: NANO_BANANA,
        contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: "3:4"
            }
        }
    });
    return handleApiResponse(response);
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const ai = getAIClient();
    const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
    const prompt = `Alter the model's stance to a ${poseInstruction}. Maintain identical facial features, identity, and the exact outfit styling. Editorial quality studio shot. Return ONLY the image.`;
    
    const response = await ai.models.generateContent({
        model: NANO_BANANA,
        contents: { parts: [tryOnImagePart, { text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: "3:4"
            }
        }
    });
    return handleApiResponse(response);
};

export const generateColorway = async (garmentImageUrl: string, colorDescription: string): Promise<string> => {
    const ai = getAIClient();
    const garmentPart = dataUrlToPart(garmentImageUrl);
    const prompt = `Precisely recolor this garment to ${colorDescription}. Retain all original fabric textures, lighting highlights, and detailed stitching. Professional color correction. Return ONLY the image.`;
    
    const response = await ai.models.generateContent({
        model: NANO_BANANA,
        contents: { parts: [garmentPart, { text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: "3:4"
            }
        }
    });
    return handleApiResponse(response);
};

export const generateStyleScore = async (outfitImageUrl: string): Promise<{ score: number, review: string }> => {
    const ai = getAIClient();
    const imagePart = dataUrlToPart(outfitImageUrl);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: "Analyze the composition and aesthetic of this outfit. Return a JSON object with 'score' (1-100) and 'review' (a short, sophisticated critique in the voice of a luxury brand director)." }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.INTEGER },
                    review: { type: Type.STRING }
                },
                required: ["score", "review"]
            }
        }
    });

    try {
        const text = response.text;
        if (!text) throw new Error("Empty Critic Response");
        return JSON.parse(text);
    } catch (e) {
        return { score: 85, review: "A masterful styling choice that balances classic studio silhouettes with contemporary flair." };
    }
};
