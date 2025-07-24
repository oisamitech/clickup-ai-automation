import { cleanGeminiResponse } from './cleanGeminiResponse.js';

export function parseGeminiResponse(responseText) {
    try {
        // Primeira tentativa: parse direto
        return JSON.parse(responseText);
    } catch (parseError) {
        console.log('⚠️ Parse direto falhou, tentando limpar resposta...');
        // Segunda tentativa: limpar a resposta
        const cleanedResponse = cleanGeminiResponse(responseText);
        try {
            return JSON.parse(cleanedResponse);
        } catch (secondParseError) {
            console.log('⚠️ Parse após limpeza falhou, usando fallback...');
            // Terceira tentativa: fallback com categorização básica
            return null; // O fallback real deve ser implementado onde for usado
        }
    }
} 