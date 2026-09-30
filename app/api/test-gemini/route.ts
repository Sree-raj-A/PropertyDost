import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const prompt = `
        You are an AI assistant for a real-estate salesperson.

        Analyze this lead:

        Name: ${body.name}
        Location: ${body.location}
        Property Requirement: ${body.propertyRequirement}
        Budget: ${body.budget}
        Buying Timeline: ${body.timeline}
        Customer Message:
        ${body.message}

        Return ONLY valid JSON with:
        {
            "summary": "...",
            "intent": "...",
            "keyRequirements": ["..."],
            "objections": ["..."],
            "urgency": 1,
            "recommendedNextAction": "...",
            "suggestedResponse": "..."
        }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
        });

        return Response.json({
            success: true,
            analysis: JSON.parse(response.text),
        });
    } catch (error) {
        console.error(error);

        return Response.json(
            {
                success: false,
                error:
                error instanceof Error
                ? error.message
                : "Unknown error",
            },
            { status: 500 }
        );
    }
}
