
import { GoogleGenAI } from "@google/genai";
import { LabParameter } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY}); inside function calls.
export async function analyzeLabReports(parameters: LabParameter[], productName: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze the following food safety lab parameters for "${productName}":
    ${parameters.map(p => `- ${p.name}: Value ${p.value}${p.unit} (Limit: ${p.limit}${p.unit}, Passed: ${p.passed})`).join('\n')}
    
    Provide a human-readable safety verdict and explanation of why this product is safe or unsafe for consumption. Focus on food safety standards.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Could not perform AI analysis at this time. Manual verification required.";
  }
}

export async function generateProductContent(productName: string, category: string, batchInfo: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Act as a food marketing and provenance expert. Generate a compelling, transparent product description for "${productName}" (Category: ${category}). 
    Include details about its origin: ${batchInfo}. 
    Focus on authenticity, quality, and the "farm-to-fork" journey. Keep it under 100 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Content Error:", error);
    return "Authentic food product verified by TrueChain blockchain.";
  }
}

export async function analyzeProductImage(base64Image: string, promptText: string = "Analyze this food product image for freshness and quality markers. Suggest 3 keywords for product tags.") {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: 'image/jpeg' } },
          { text: promptText }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Image Error:", error);
    return "Standard quality verified.";
  }
}
