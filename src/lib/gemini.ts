import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("Missing VITE_GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

export async function parseReceiptImage(base64Image: string) {
    if (!API_KEY) {
        throw new Error("Gemini API Key is missing. Please check your settings.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze this receipt image and extract the following information in JSON format:
    - store_name: The name of the store.
    - buy_date: The date of purchase in YYYY-MM-DD format.
    - items: An array of items purchased, each with:
      - name: The name of the item.
      - quantity: The quantity purchased (default to 1 if not specified).
      - price: The price per unit (or total price if unit price is missing).
    
    Return ONLY the JSON object, no markdown formatting.
    If the date is missing, use today's date.
    If the store name is missing, use "Unknown Store".
  `;

    // Remove the data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64Image.split(',')[1] || base64Image;

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: "image/jpeg", // Assuming JPEG for now, or we can detect
        },
    };

    try {
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to parse receipt. Please try again.");
    }
}
