import { cleanGeminiResponse } from './cleanGeminiResponse.js';

export function parseGeminiResponse(responseText) {
    try {
        // First attempt: direct parse
        return JSON.parse(responseText);
    } catch (parseError) {
        // Second attempt: clean the response
        const cleanedResponse = cleanGeminiResponse(responseText);
        try {
            return JSON.parse(cleanedResponse);
        } catch (secondParseError) {
            // Third attempt: fallback with basic categorization
            return null;
        }
    }
} 