import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

export const runtime = "nodejs";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.5-flash-lite";

type LeadAIResult = {
    ai_title: string;
    summary: string;
    intent: string;
    key_requirements: string;
    objections: string;
    recommended_next_action: string;
    suggested_response: string;
    score: number;
    priority: string;
};

const responseSchema = {
    type: "object",
    properties: {
        ai_title: {
            type: "string",
        },
        summary: {
            type: "string",
        },
        intent: {
            type: "string",
        },
        key_requirements: {
            type: "string",
        },
        objections: {
            type: "string",
        },
        recommended_next_action: {
            type: "string",
        },
        suggested_response: {
            type: "string",
        },
        score: {
            type: "integer",
        },
        priority: {
            type: "string",
        },
    },
    required: [
        "ai_title",
        "summary",
        "intent",
        "key_requirements",
        "objections",
        "recommended_next_action",
        "suggested_response",
        "score",
        "priority",
    ],
};

/* =========================================================
 *  SMALL RETRY HELPER
 = *======================================================== */

function sleep(ms: number) {
    return new Promise((resolve) =>
    setTimeout(resolve, ms)
    );
}

async function generateWithRetry(
    contents: any,
    attempts = 3
) {
    let lastError: unknown = null;

    for (
        let attempt = 0;
    attempt < attempts;
    attempt++
    ) {
        try {
            return await ai.models.generateContent({
                model: MODEL,
                contents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                },
            });
        } catch (error: any) {
            lastError = error;

            const message = String(
                error?.message ?? error
            ).toLowerCase();

            const temporary =
            message.includes("503") ||
            message.includes("unavailable") ||
            message.includes("high demand") ||
            message.includes("overloaded") ||
            message.includes("timeout");

            if (
                !temporary ||
                attempt === attempts - 1
            ) {
                throw error;
            }

            await sleep(
                1000 * Math.pow(2, attempt)
            );
        }
    }

    throw lastError;
}

/* =========================================================
 *  CLEAN AI OUTPUT
 = *======================================================== */

function cleanText(value: unknown) {
    return String(value ?? "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^Draft Response:\s*/gim, "")
    .replace(/^Here is .*?:\s*/gim, "")
    .trim();
}

/* =========================================================
 *  FILES FOR GEMINI
 = *======================================================== */

async function buildFileParts(
    files: File[]
) {
    const parts: any[] = [];

    for (const file of files) {
        if (!file || file.size === 0) {
            continue;
        }

        if (
            file.size >
            10 * 1024 * 1024
        ) {
            throw new Error(
                `${file.name} is larger than 10 MB.`
            );
        }

        const mimeType =
        file.type ||
        "application/octet-stream";

    if (
        mimeType.startsWith("text/") ||
        file.name
        .toLowerCase()
        .endsWith(".txt")
    ) {
        const text =
        await file.text();

        parts.push({
            text:
            `\n--- FILE: ${file.name} ---\n` +
            text +
            "\n--- END FILE ---\n",
        });

        continue;
    }

    if (
        mimeType.startsWith("image/") ||
        mimeType === "application/pdf"
    ) {
        const buffer =
        Buffer.from(
            await file.arrayBuffer()
        );

        parts.push({
            inlineData: {
                mimeType,
                data: buffer.toString("base64"),
            },
        });
    }
    }

    return parts;
}

/* =========================================================
 *  GET /api/leads
 *  Loads the pipeline
 = *======================================================== */

export async function GET() {
    try {
        const {
            data,
            error,
        } = await supabaseAdmin
        .from("leads")
        .select("*")
        .order("created_at", {
            ascending: false,
        });

        if (error) {
            console.error(
                "Supabase GET leads error:",
                error
            );

            return Response.json(
                {
                    success: false,
                    error: error.message,
                },
                {
                    status: 500,
                }
            );
        }

        return Response.json({
            success: true,
            leads: data ?? [],
        });
    } catch (error) {
        console.error(
            "GET /api/leads error:",
            error
        );

        return Response.json(
            {
                success: false,
                error:
                error instanceof Error
                ? error.message
                : "Could not load leads.",
            },
            {
                status: 500,
            }
        );
    }
}

/* =========================================================
 *  POST /api/leads
 *  Creates a new lead
 = *======================================================== */

export async function POST(
    request: Request
) {
    try {
        /* =======================================================
         *      FORM DATA
         *   ======================================================= */

        const formData =
        await request.formData();

        const intakeMode =
        String(
            formData.get(
                "intakeMode"
            ) ?? "full"
        );

        const name =
        String(
            formData.get("name") ?? ""
        ).trim();

        const location =
        String(
            formData.get("location") ??
                ""
        ).trim();

        const budget =
        String(
            formData.get("budget") ??
                ""
        ).trim();

        const propertyRequirement =
        String(
            formData.get(
                "propertyRequirement"
            ) ?? ""
        ).trim();

        const timeline =
        String(
            formData.get("timeline") ??
                ""
        ).trim();

        const message =
        String(
            formData.get("message") ??
                ""
        ).trim();

        const salespersonName =
        String(
            formData.get(
                "salespersonName"
            ) ??
            "Sales Representative"
        ).trim();

        const salespersonLocation =
        String(
            formData.get(
                "salespersonLocation"
            ) ?? "Thrissur"
        ).trim();

        const salespersonPhone =
        String(
            formData.get(
                "salespersonPhone"
            ) ?? "9876543210"
        ).trim();

        const urgencyRaw =
        Number(
            formData.get(
                "manualUrgency"
            ) ?? 3
        );

        const urgency = Number.isFinite(
            urgencyRaw
        )
        ? Math.min(
            5,
            Math.max(
                1,
                Math.round(urgencyRaw)
            )
        )
        : 3;

        /* =======================================================
         *      FILES
         *   ======================================================= */

        const uploadedFiles =
        formData
            .getAll("files")
            .filter(
                (
                    item
                ): item is File =>
                item instanceof File &&
                item.size > 0
            );

        /* =======================================================
         *      VALIDATION
         *   ======================================================= */

        if (!name || !location) {
            return Response.json(
                {
                    success: false,
                    error:
                    "Customer information is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            intakeMode === "quick" &&
            uploadedFiles.length === 0
        ) {
            return Response.json(
                {
                    success: false,
                    error:
                    "Source material is required for Quick Import.",
                },
                {
                    status: 400,
                }
            );
        }

        /* =======================================================
         *      MULTIMODAL CONTENT
         *   ======================================================= */

        const fileParts =
        await buildFileParts(
            uploadedFiles
        );

        /* =======================================================
         *      AI PROMPT
         *   ======================================================= */

        const prompt = `
        You are the lead intelligence system for a real-estate CRM.

        Create a structured lead record from the supplied information.

        SALESPERSON
        Name: ${salespersonName}
        Location: ${salespersonLocation}
        Phone: ${salespersonPhone}

        CUSTOMER
        Name: ${name}
        Location: ${location}

        MANUALLY ENTERED DETAILS

        Budget:
        ${budget || "Not supplied"}

        Property requirement:
        ${propertyRequirement || "Not supplied"}

        Buying window:
        ${timeline || "Not supplied"}

        Customer messages and notes:
        ${message || "Not supplied"}

        Manual urgency:
        ${urgency}/5

        INTAKE MODE:
        ${intakeMode}

        INSTRUCTIONS

        1. Generate a concise AI title.

        2. Generate a useful factual summary.

        3. Determine customer intent.

        4. Extract key requirements as concise
        semicolon-separated phrases.

        5. Extract concerns/objections as concise
        semicolon-separated phrases.
        If none are identified, say:
        "None identified."

        6. Generate ONE concrete recommended next action.

        The recommended action MUST be a real sales action.

        Never output:
        "Ask AI"
        "Ask the AI"
        "Ask the AI copilot"
        "Ask the assistant"

        7. Generate a customer-facing follow-up.

        The suggested_response field must contain ONLY
        the customer-facing message.

        Never include:
        - explanations
        - reasoning
        - "Draft Response"
        - "Here is a suggested response"
        - "Why this works"
        - markdown headings
        - coaching commentary

        8. Never use placeholders such as:
        [Your Name]
        [Your Number]
        [Your Contact Information]

        Use this salesperson name when required:
        ${salespersonName}

        Use this salesperson phone when appropriate:
        ${salespersonPhone}

        9. Do not invent appointments,
        properties, prices, financing,
        availability, or other unsupported facts.

        10. Generate a lead score between 0 and 100.

        11. Generate a concise priority label.

        12. Read uploaded screenshots,
        PDFs and text files when supplied.
        `;

        /* =======================================================
         *      AI
         *   ======================================================= */

        const contents = [
            {
                text: prompt,
            },
            ...fileParts,
        ];

        const response =
        await generateWithRetry(
            contents
        );

        const raw =
        response.text?.trim();

        if (!raw) {
            throw new Error(
                "The AI returned an empty response."
            );
        }

        let analysis: LeadAIResult;

        try {
            analysis = JSON.parse(
                raw
            ) as LeadAIResult;
        } catch (error) {
            console.error(
                "Invalid Gemini JSON:",
                raw
            );

            throw new Error(
                "The AI returned invalid structured data."
            );
        }

        /* =======================================================
         *      NORMALIZE
         *   ======================================================= */

        const aiTitle =
        cleanText(
            analysis.ai_title
        ) ||
        `${name} Lead`;

        const summary =
        cleanText(
            analysis.summary
        ) ||
        "Lead created from supplied customer information.";

                const intent =
                cleanText(
                    analysis.intent
                ) ||
                "Customer intent not yet established.";

                const keyRequirements =
                cleanText(
                    analysis.key_requirements
                ) ||
                "None identified.";

        const objections =
        cleanText(
            analysis.objections
        ) ||
        "None identified.";

        const recommendedNextAction =
        cleanText(
            analysis.recommended_next_action
        ) ||
        "Review the lead and contact the customer.";

        const suggestedResponse =
        cleanText(
            analysis.suggested_response
        ) ||
        `Hi ${name}, I have reviewed your requirements and will follow up with the most relevant options.`;

        const score = Math.min(
            100,
            Math.max(
                0,
                Math.round(
                    Number(
                        analysis.score
                    ) || 0
                )
            )
        );

        const priority =
        cleanText(
            analysis.priority
        ) ||
        (urgency >= 4
        ? "Urgent"
        : urgency >= 3
        ? "Warm"
        : "Cool");

        /* =======================================================
         *      INSERT LEAD
         *   ======================================================= */

        const {
            data: insertedLead,
            error: insertError,
        } =
        await supabaseAdmin
        .from("leads")
        .insert({
            name,

            ai_title:
            aiTitle,

            location,

            property_requirement:
            propertyRequirement,

            budget,

            timeline,

            original_message:
            message,

            urgency,

            priority,

            score,

            summary,

            intent,

            key_requirements:
            keyRequirements,

            objections,

            recommended_next_action:
            recommendedNextAction,

            suggested_response:
            suggestedResponse,

            stage:
            "stage-new",

            created_at:
            new Date().toISOString(),

                updated_at:
                new Date().toISOString(),

                last_contacted_at:
                null,
        })
        .select("*")
        .single();

        if (
            insertError ||
            !insertedLead
        ) {
            console.error(
                "Supabase insert error:",
                insertError
            );

            throw new Error(
                insertError?.message ??
                "Could not save the lead."
            );
        }

        /* =======================================================
         *      INITIAL ASSISTANT MESSAGE
         *   ======================================================= */

        const openingMessage =
        buildOpeningMessage({
            name,
            propertyRequirement,
            location,
            budget,
            timeline,
        });

        const {
            error:
            openingMessageError,
        } =
        await supabaseAdmin
        .from("lead_messages")
        .insert({
            lead_id:
            insertedLead.id,

            role:
            "assistant",

            content:
            openingMessage,

            created_at:
            new Date().toISOString(),
        });

        if (
            openingMessageError
        ) {
            console.error(
                "Opening message insert error:",
                openingMessageError
            );
        }

        /* =======================================================
         *      RETURN
         *   ======================================================= */

        return Response.json({
            success: true,

            lead: insertedLead,

            analysis: {
                ai_title:
                aiTitle,

                summary,

                intent,

                key_requirements:
                keyRequirements,

                objections,

                recommended_next_action:
                recommendedNextAction,

                suggested_response:
                suggestedResponse,

                score,

                priority,
            },

            openingMessage,
        });
    } catch (error) {
        console.error(
            "Lead API error:",
            error
        );

        return Response.json(
            {
                success: false,
                error:
                error instanceof Error
                ? error.message
                : "Failed to process lead.",
            },
            {
                status: 500,
            }
        );
    }
}

/* =========================================================
 *  INITIAL ASSISTANT MESSAGE
 = *======================================================== */

function buildOpeningMessage({
    name,
    propertyRequirement,
    location,
    budget,
    timeline,
}: {
    name: string;
    propertyRequirement: string;
    location: string;
    budget: string;
    timeline: string;
}) {
    const firstName =
    name
    .trim()
    .split(/\s+/)[0] ||
    name;

    const requirement =
    propertyRequirement ||
    "property";

        const locationPart =
        location
        ? ` in ${location}`
        : "";

        const budgetPart =
        budget
        ? ` with a budget around ${budget}`
        : "";

        const timelinePart =
        timeline
        ? ` and a buying window of ${timeline}`
        : "";

        return `${firstName} is looking for a ${requirement}${locationPart}${budgetPart}${timelinePart}. I'll keep the conversation focused on the customer's requirements, concerns, and next best sales action.`;
}
