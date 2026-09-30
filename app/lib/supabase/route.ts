import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

/*
 * This route handles:
 *
 * GET  /api/leads
 *     → Fetch all leads from Supabase
 *
 * POST /api/leads
 *     → Receive raw lead data
 *     → Gemini analyzes it
 *     → Save the result to Supabase
 *     → Return the created lead
 */

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

/* =========================================================
 *  GEMINI STRUCTURED OUTPUT SCHEMA
 = *======================================================== */

const leadAnalysisSchema = {
    type: "object",
    properties: {
        title: {
            type: "string",
        },

        summary: {
            type: "string",
        },

        intent: {
            type: "string",
        },

        keyRequirements: {
            type: "array",
            items: {
                type: "string",
            },
        },

        objections: {
            type: "array",
            items: {
                type: "string",
            },
        },

        urgency: {
            type: "integer",
            description: "Urgency from 1 to 5.",
        },

        priority: {
            type: "string",
            enum: ["Urgent", "Warm", "Cool"],
        },

        score: {
            type: "integer",
            description: "Lead quality score from 0 to 100.",
        },

        recommendedNextAction: {
            type: "string",
        },

        suggestedResponse: {
            type: "string",
        },
    },

    required: [
        "title",
        "summary",
        "intent",
        "keyRequirements",
        "objections",
        "urgency",
        "priority",
        "score",
        "recommendedNextAction",
        "suggestedResponse",
    ],
};

/* =========================================================
 *  GET
 *  Fetch all saved leads
 = *======================================================== */

export async function GET() {
    try {
        const { data, error } =
        await supabaseAdmin
        .from("leads")
        .select("*")
        .order("created_at", {
            ascending: false,
        });

        if (error) {
            console.error(
                "Supabase GET /api/leads error:",
                error
            );

            return Response.json(
                {
                    success: false,
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return Response.json({
            success: true,
            leads: data ?? [],
        });
    } catch (error) {
        console.error(
            "Unexpected GET /api/leads error:",
            error
        );

        return Response.json(
            {
                success: false,
                error:
                error instanceof Error
                ? error.message
                : "Unknown server error",
            },
            { status: 500 }
        );
    }
}

/* =========================================================
 *  POST
 *  Create + analyze + save lead
 = *======================================================== */

export async function POST(
    req: Request
) {
    try {
        /* -------------------------------------------------------
         *      Validate environment
         *   ------------------------------------------------------- */

        if (!process.env.GEMINI_API_KEY) {
            return Response.json(
                {
                    success: false,
                    error:
                    "GEMINI_API_KEY is not configured.",
                },
                { status: 500 }
            );
        }

        /* -------------------------------------------------------
         *      Read request
         *   ------------------------------------------------------- */

        const body = await req.json();

        const name =
        String(body.name ?? "").trim();

        const location =
        String(body.location ?? "").trim();

        const propertyRequirement =
        String(
            body.propertyRequirement ?? ""
        ).trim();

        const budget =
        String(body.budget ?? "").trim();

        const timeline =
        String(body.timeline ?? "").trim();

        const message =
        String(body.message ?? "").trim();

        const urgencyMode =
        body.urgencyMode === "manual"
        ? "manual"
        : "ai";

        const manualUrgency =
        Number.isInteger(
            body.manualUrgency
        )
        ? Number(body.manualUrgency)
        : null;

        /* -------------------------------------------------------
         *      Basic validation
         *   ------------------------------------------------------- */

        if (!name) {
            return Response.json(
                {
                    success: false,
                    error:
                    "Customer name is required.",
                },
                { status: 400 }
            );
        }

        if (!message) {
            return Response.json(
                {
                    success: false,
                    error:
                    "Customer message is required.",
                },
                { status: 400 }
            );
        }

        if (
            urgencyMode === "manual" &&
            (
                manualUrgency === null ||
                manualUrgency < 1 ||
                manualUrgency > 5
            )
        ) {
            return Response.json(
                {
                    success: false,
                    error:
                    "Manual urgency must be between 1 and 5.",
                },
                { status: 400 }
            );
        }

        /* -------------------------------------------------------
         *      Tell Gemini whether urgency is AI-controlled
         *      or manually supplied.
         *   ------------------------------------------------------- */

        const urgencyInstruction =
        urgencyMode === "manual"
        ? `
        The salesperson has manually selected urgency:

        ${manualUrgency}/5

        Use that exact urgency value.
        Do not change it.
        `
        : `
        Determine urgency yourself from 1 to 5 based on
        purchase intent, timeline, specificity, budget,
        and other signals in the customer information.
        `;

        /* -------------------------------------------------------
         *      Gemini prompt
         *   ------------------------------------------------------- */

        const prompt = `
        You are the AI sales copilot for a real-estate CRM.

        Analyze the following inbound lead.

        CUSTOMER NAME:
        ${name}

        LOCATION:
        ${location || "Not provided"}

        PROPERTY REQUIREMENT:
        ${propertyRequirement || "Not provided"}

        BUDGET:
        ${budget || "Not provided"}

        BUYING TIMELINE:
        ${timeline || "Not provided"}

        CUSTOMER MESSAGE / CHAT / NOTES:
        ${message}

        ${urgencyInstruction}

        Your job is to create the salesperson's initial lead dossier.

        Generate:

        1. A concise, useful title for the lead.
        The title will appear in the CRM inbox and pipeline.
        Make it specific and useful to a salesperson.

        2. A concise lead summary.

        3. The customer's actual intent.

        4. Key property requirements.

        5. Objections, concerns, or friction points.

        6. Urgency from 1 to 5.

        7. Priority:
        - Urgent
        - Warm
        - Cool

        8. A lead quality score from 0 to 100.

        9. The recommended next action for the salesperson.

        10. A ready-to-send first response to the customer.

        IMPORTANT:
        - Base your answer only on information provided.
        - Do not invent properties, prices, dates, finances, or customer facts.
        - The suggested response should not falsely claim that listings,
        appointments, or inventory exist unless the customer message
        explicitly establishes that.
        - Keep the title short enough to display naturally in an inbox.
        `;

        /* -------------------------------------------------------
         *      Gemini call
         *   ------------------------------------------------------- */

        const response =
        await ai.models.generateContent({
            model: "gemini-3.5-flash",

            contents: prompt,

            config: {
                responseMimeType:
                "application/json",

                responseSchema:
                leadAnalysisSchema,
            },
        });

        const rawText =
        response.text?.trim();

        if (!rawText) {
            throw new Error(
                "Gemini returned an empty response."
            );
        }

        /* -------------------------------------------------------
         *      Parse structured Gemini response
         *   ------------------------------------------------------- */

        let analysis: {
            title: string;
            summary: string;
            intent: string;
            keyRequirements: string[];
            objections: string[];
            urgency: number;
            priority:
            | "Urgent"
            | "Warm"
            | "Cool";
            score: number;
            recommendedNextAction: string;
            suggestedResponse: string;
        };

        try {
            analysis =
            JSON.parse(rawText);
        } catch {
            console.error(
                "Invalid Gemini JSON:",
                rawText
            );

            throw new Error(
                "Gemini returned invalid structured data."
            );
        }

        /* -------------------------------------------------------
         *      Safety normalization
         *   ------------------------------------------------------- */

        const keyRequirements =
        Array.isArray(
            analysis.keyRequirements
        )
        ? analysis.keyRequirements
        : [];

        const objections =
        Array.isArray(
            analysis.objections
        )
        ? analysis.objections
        : [];

        let finalUrgency =
        Number(analysis.urgency);

        /*
         *     If salesperson manually selected urgency,
         *     it always wins.
         */
        if (
            urgencyMode === "manual" &&
            manualUrgency !== null
        ) {
            finalUrgency =
            manualUrgency;
        }

        /*
         *     Keep urgency inside 1–5.
         */
        finalUrgency = Math.min(
            5,
            Math.max(
                1,
                Math.round(finalUrgency)
            )
        );

        let finalScore =
        Number(analysis.score);

        if (
            !Number.isFinite(finalScore)
        ) {
            finalScore = 50;
        }

        finalScore = Math.min(
            100,
            Math.max(
                0,
                Math.round(finalScore)
            )
        );

        const allowedPriorities = [
            "Urgent",
            "Warm",
            "Cool",
        ] as const;

        const finalPriority =
        allowedPriorities.includes(
            analysis.priority
        )
        ? analysis.priority
        : finalUrgency >= 4
        ? "Urgent"
        : finalUrgency >= 3
        ? "Warm"
        : "Cool";

        /* -------------------------------------------------------
         *      Save to Supabase
         *   ------------------------------------------------------- */

        const { data: lead, error } =
        await supabaseAdmin
        .from("leads")
        .insert({
            name,

            ai_title:
            analysis.title?.trim() ||
            `${name} Real Estate Inquiry`,

            location,

            property_requirement:
            propertyRequirement,

            budget,

            timeline,

            original_message:
            message,

            urgency:
            finalUrgency,

            priority:
            finalPriority,

            score:
            finalScore,

            summary:
            analysis.summary ?? "",

            intent:
            analysis.intent ?? "",

            key_requirements:
            keyRequirements.join(
                "; "
            ),

            objections:
            objections.join("; "),

                recommended_next_action:
                analysis.recommendedNextAction ??
                "",

                suggested_response:
                analysis.suggestedResponse ??
                "",

                /*
                 *           New leads always enter
                 *           the first engagement stage.
                 */
                stage: "stage-new",
        })
        .select("*")
        .single();

        if (error) {
            console.error(
                "Supabase INSERT error:",
                error
            );

            return Response.json(
                {
                    success: false,
                    error: error.message,
                },
                { status: 500 }
            );
        }

        /* -------------------------------------------------------
         *      Store the initial AI message
         *      in lead_messages
         *   ------------------------------------------------------- */

        const {
            error: messageError,
        } =
        await supabaseAdmin
        .from("lead_messages")
        .insert({
            lead_id: lead.id,

            role: "assistant",

            content:
            `I've prepared the lead dossier for ${name}. ` +
            `The lead is currently classified as ${finalPriority} ` +
            `with urgency ${finalUrgency}/5. ` +
            `Ask me anything about this lead.`,
        });

        /*
         *     Don't fail the entire lead creation if
         *     the message-history insert fails.
         */
        if (messageError) {
            console.error(
                "Initial lead message insert error:",
                messageError
            );
        }

        /* -------------------------------------------------------
         *      Return everything to the frontend
         *   ------------------------------------------------------- */

        return Response.json(
            {
                success: true,
                lead,
                analysis: {
                    ...analysis,
                    urgency:
                    finalUrgency,
                    priority:
                    finalPriority,
                    score:
                    finalScore,
                    keyRequirements,
                    objections,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(
            "POST /api/leads error:",
            error
        );

        return Response.json(
            {
                success: false,
                error:
                error instanceof Error
                ? error.message
                : "Failed to create lead.",
            },
            { status: 500 }
        );
    }
}
