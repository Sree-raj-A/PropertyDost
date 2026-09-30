import { GoogleGenAI } from "@google/genai";

export async function GET() {
    return Response.json({
        success: true,
        message:
        "Lead analysis API is running. Send a POST request to analyze a lead.",
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return Response.json(
                {
                    success: false,
                    error: "GEMINI_API_KEY is missing",
                },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const prompt = `
        You are an AI assistant for a real-estate salesperson.

        Analyze this lead:

        Name: ${body.name ?? ""}
        Location: ${body.location ?? ""}
        Property Requirement: ${body.propertyRequirement ?? ""}
        Budget: ${body.budget ?? ""}
        Buying Timeline: ${body.timeline ?? ""}

        Customer Message:
        ${body.message ?? ""}

        Return ONLY valid JSON:

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
            model: "gemini-3.5-flash-lite",
            contents: prompt,
        });

        const text = response.text ?? "";

        const analysis = JSON.parse(text);

        return Response.json({
            success: true,
            analysis,
        });
    } catch (error) {
        console.error("Lead analysis error:", error);

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
