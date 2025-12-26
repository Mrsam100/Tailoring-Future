
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
    
    // Explicitly check for safety blocking
    if (candidate?.finishReason === 'SAFETY') {
        throw new Error("SAFETY: The studio filters flagged this image. Please try a different, professional-style photo.");
    }

    if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                const { mimeType, data } = part.inlineData;
                return `data:${mimeType};base64,${data}`;
            }
        }
    }

    throw new Error(`Studio Error: ${candidate?.finishReason || "No data returned"}`);
};

const getAIClient = () => {
    if (!process.env.API_KEY) {
        console.error("Vercel: Missing API_KEY environment variable.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const DEFAULT_MODEL = 'gemini-2.5-flash-image';

export const generateModelImage = async (userImage: File): Promise<string> => {
    const ai = getAIClient();
    const userImagePart = await fileToPart(userImage);
    const prompt = "You are an elite fashion photographer. Transform this person into a full-body high-end fashion model photo. Background: Neutral, light gray studio. Preserve face and features exactly. Lighting: Professional softbox. Return ONLY the final image.";
    const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: { parts: [userImagePart, { text: prompt }] },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File): Promise<string> => {
    const ai = getAIClient();
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const garmentImagePart = await fileToPart(garmentImage);
    const prompt = "High-end digital tailoring: Fit this garment exactly onto the person in the model image. Seamless integration, realistic shadows, correct sizing. Preserve model identity. Return ONLY the final image.";
    const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
    });
    return handleApiResponse(response);
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const ai = getAIClient();
    const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
    const prompt = `Repose this fashion model into a ${poseInstruction} angle. Maintain exact outfit and physical features. Professional studio shot. Return ONLY the image.`;
    const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: { parts: [tryOnImagePart, { text: prompt }] },
    });
    return handleApiResponse(response);
};

export const generateColorway = async (garmentImageUrl: string, colorDescription: string): Promise<string> => {
    const ai = getAIClient();
    const garmentPart = dataUrlToPart(garmentImageUrl);
    const prompt = `Shift the color of this garment to ${colorDescription}. Keep texture, folds, and details identical. High precision. Return ONLY the modified image.`;
    const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: { parts: [garmentPart, { text: prompt }] },
    });
    return handleApiResponse(response);
};

export const generateStyleScore = async (outfitImageUrl: string): Promise<{ score: number, review: string }> => {
    const ai = getAIClient();
    const imagePart = dataUrlToPart(outfitImageUrl);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: "Provide a critical fashion analysis of this outfit. Return JSON with 'score' (1-100) and 'review' (concise luxury tone)." }] },
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
        return JSON.parse(response.text || '{}');
    } catch (e) {
        return { score: 80, review: "A compelling ensemble that balances classic silhouettes with modern studio flair." };
    }
};
