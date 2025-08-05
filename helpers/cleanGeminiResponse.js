export function cleanGeminiResponse(responseText) {
    // Remove markdown, code and extra text
    let cleaned = responseText
        .replace(/```json\s*/g, '')  // Remove ```json
        .replace(/```\s*/g, '')     // Remove ```
        .replace(/^[^{]*/, '')      // Remove text before first {
        .replace(/[^}]*$/, '')      // Remove text after last }
        .trim();

    // If still doesn't start with {, try to find JSON
    if (!cleaned.startsWith('{')) {
        const jsonMatch = cleaned.match(/\{.*\}/s);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }
    }

    return cleaned;
} 