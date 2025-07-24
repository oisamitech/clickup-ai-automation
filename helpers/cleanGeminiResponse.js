export function cleanGeminiResponse(responseText) {
    // Remover markdown, código e texto extra
    let cleaned = responseText
        .replace(/```json\s*/g, '')  // Remove ```json
        .replace(/```\s*/g, '')     // Remove ```
        .replace(/^[^{]*/, '')      // Remove texto antes do primeiro {
        .replace(/[^}]*$/, '')      // Remove texto após o último }
        .trim();

    // Se ainda não começa com {, tentar encontrar JSON
    if (!cleaned.startsWith('{')) {
        const jsonMatch = cleaned.match(/\{.*\}/s);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }
    }

    return cleaned;
} 