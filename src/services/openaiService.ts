import OpenAI from 'openai';

// Initialize OpenAI Client
// Danger: In a production client-side app, this exposes the key.
// Ideally, this should be proxied through a backend. 
// For this MVP/local tool, we use the env variable directly with user awareness.
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

let openai: OpenAI | null = null;

if (apiKey) {
    openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
    });
}

export interface SmartCorrectionRequest {
    fieldLabel: string;
    ocrValue: string;
    context?: string;
}

export interface SmartCorrectionResponse {
    correctedValue: string;
    confidence: number;
    reasoning: string;
}

export const openaiService = {
    /**
     * Check if the service is configured
     */
    isConfigured: () => !!openai,

    /**
     * Smart Correction: Fixes OCR errors based on context
     */
    correctValue: async (request: SmartCorrectionRequest): Promise<SmartCorrectionResponse | null> => {
        if (!openai) return null;

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert Data Cleaner. 
Correct the OCR reading for a specific form field.
Return JSON with keys: 'correctedValue' (string/number), 'confidence' (0.0-1.0), 'reasoning' (brief string).
If the value seems correct, return it as is.
If the value is completely unreadable, return null for correctedValue.`
                    },
                    {
                        role: "user",
                        content: `Field Label: "${request.fieldLabel}"
Context/Type: ${request.context || "General"}
Raw OCR Value: "${request.ocrValue}"`
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content;
            if (!content) return null;

            return JSON.parse(content) as SmartCorrectionResponse;
        } catch (error) {
            console.error("OpenAI Correction Error:", error);
            return null;
        }
    },

};
