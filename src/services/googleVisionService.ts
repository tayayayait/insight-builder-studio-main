
export interface GoogleVisionConfig {
    apiKey: string;
}

export interface GoogleVisionResponse {
    responses: Array<{
        fullTextAnnotation?: {
            text: string;
            pages: Array<{
                blocks: Array<{
                    boundingBox: {
                        vertices: Array<{ x: number; y: number }>;
                    };
                    confidence?: number;
                    paragraphs: Array<{
                        words: Array<{
                            symbols: Array<{
                                text: string;
                                boundingBox: {
                                    vertices: Array<{ x: number; y: number }>;
                                };
                            }>;
                            boundingBox: {
                                vertices: Array<{ x: number; y: number }>;
                            };
                        }>;
                        boundingBox: {
                            vertices: Array<{ x: number; y: number }>;
                        };
                    }>;
                }>;
            }>;
        };
        textAnnotations?: Array<{
            description: string;
            boundingPoly: {
                vertices: Array<{ x: number; y: number }>;
            };
        }>;
        error?: {
            code: number;
            message: string;
        }
    }>;
}

export class GoogleVisionService {
    private apiKey: string;
    private baseUrl = "https://vision.googleapis.com/v1/images:annotate";

    constructor(config: GoogleVisionConfig) {
        this.apiKey = config.apiKey;
    }

    async analyzeImage(base64Image: string): Promise<GoogleVisionResponse> {
        // Remove data URL prefix if present
        const content = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        const requestBody = {
            requests: [
                {
                    image: {
                        content: content,
                    },
                    features: [
                        {
                            type: "DOCUMENT_TEXT_DETECTION", // Optimized for dense text/documents
                        },
                    ],
                },
            ],
        };

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Google Vision API request failed");
            }

            const data: GoogleVisionResponse = await response.json();
            return data;
        } catch (error) {
            console.error("Google Vision API Error:", error);
            throw error;
        }
    }
}

export const googleVisionService = new GoogleVisionService({
    apiKey: import.meta.env.VITE_GOOGLE_CLOUD_API_KEY || "",
});
