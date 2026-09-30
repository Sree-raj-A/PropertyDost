import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const chatSchema = {
    type: "object",
    properties: {
        answer: {
            type: "string",
            description:
            "A direct answer to the salesperson. Do not include reasoning or coaching commentary unless explicitly requested.",
        },

        updateSuggestedResponse: {
            type: "boolean",
            description:
            "True only when the salesperson asked to create, rewrite, shorten, strengthen, soften, personalize, or otherwise modify the customer-facing follow-up.",
        },

        suggestedResponse: {
            type: "string",
            description:
            "The complete customer-facing follow-up. Return only the message itself, with no explanation, heading, markdown title, or commentary.",
        },
    },

    required: [
        "answer",
        "updateSuggestedResponse",
        "suggestedResponse",
    ],
};

export async function POST(
    req: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {
        const { id } = await params;

        const leadId = Number(id);

        if (!Number.isInteger(leadId)) {
            return Response.json(
                {
                    success: false,
                    error: "Invalid lead ID.",
                },
                { status: 400 }
            );
        }

        const body = await req.json();

        const userMessage = String(
            body.message ?? ""
        ).trim();

        const salespersonName = String(
            body.salespersonName ??
            "Sales Representative"
        ).trim();

        const salespersonLocation = String(
            body.salespersonLocation ??
            "Thrissur"
        ).trim();

        const salespersonPhone = String(
            body.salespersonPhone ??
            "9876543210"
        ).trim();

        if (!userMessage) {
            return Response.json(
                {
                    success: false,
                    error: "Message is required.",
                },
                { status: 400 }
            );
        }

        /* =======================================================
         *      FETCH LEAD
         *   ======================================================= */

        const {
            data: lead,
            error: leadError,
        } = await supabaseAdmin
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

        if (leadError || !lead) {
            return Response.json(
                {
                    success: false,
                    error: "Lead not found.",
                },
                { status: 404 }
            );
        }

        /* =======================================================
         *      FETCH CONVERSATION HISTORY
         *   ======================================================= */

        const {
            data: history,
            error: historyError,
        } = await supabaseAdmin
        .from("lead_messages")
        .select(
            "role, content, created_at"
        )
        .eq("lead_id", leadId)
        .order("created_at", {
            ascending: true,
        });

        if (historyError) {
            console.error(
                "History fetch error:",
                historyError
            );
        }

        const historyText =
        (history ?? [])
        .map((item) => {
            const speaker =
            item.role === "user"
            ? "SALESPERSON"
            : "ASSISTANT";

            return `${speaker}: ${item.content}`;
        })
        .join("\n\n");

        /* =======================================================
         *      LEAD CONTEXT
         *   ======================================================= */

        const leadContext = `
        You are the dedicated sales copilot for ONE real-estate lead.

        SALESPERSON
        Name: ${salespersonName}
        Location: ${salespersonLocation}
        Phone: ${salespersonPhone}

        LEAD
        Customer name: ${lead.name ?? ""}
        AI title: ${lead.ai_title ?? ""}
        Location: ${lead.location ?? ""}
        Property requirement: ${
            lead.property_requirement ?? ""
        }
        Budget: ${lead.budget ?? ""}
        Buying window: ${
            lead.timeline ?? ""
        }

        ORIGINAL CUSTOMER MESSAGE
        ${lead.original_message ?? ""}

        AI ANALYSIS
        Summary:
        ${lead.summary ?? ""}

        Intent:
        ${lead.intent ?? ""}

        Key requirements:
        ${lead.key_requirements ?? ""}

        Concerns:
        ${lead.objections ?? ""}

        Urgency:
        ${lead.urgency ?? ""}/5

        Priority:
        ${lead.priority ?? ""}

        Lead score:
        ${lead.score ?? ""}/100

        Current recommended action:
        ${lead.recommended_next_action ?? ""}

        Current suggested follow-up:
        ${lead.suggested_response ?? ""}
        `;

        /* =======================================================
         *      STRICT OUTPUT INSTRUCTIONS
         *   ======================================================= */

        const prompt = `
        ${leadContext}

        CONVERSATION HISTORY
        ${historyText || "No previous conversation."}

        NEW SALESPERSON MESSAGE
        ${userMessage}

        INSTRUCTIONS

        You are speaking ONLY to the salesperson.

        Answer the salesperson directly.

        Do NOT reveal your reasoning.
        Do NOT explain why an answer is good.
        Do NOT provide coaching commentary unless explicitly requested.

        When the salesperson asks a normal question:
        - answer it directly
        - updateSuggestedResponse must be false
        - suggestedResponse must remain the current customer-facing follow-up

        When the salesperson asks to:
        - rewrite the follow-up
        - make it more assertive
        - make it softer
        - make it warmer
        - make it shorter
        - make it more professional
        - personalize it
        - simplify it
        - improve it
        - create a new follow-up

        then:
        - updateSuggestedResponse must be true
        - suggestedResponse must contain ONLY the final customer-facing message
        - do not put a heading before it
        - do not explain the changes
        - do not say "Here is a revised version"
        - do not say "Why this works"
        - do not say "Draft Response"
        - do not use markdown headings
        - do not include internal analysis
        - do not include commentary before or after the message

        The salesperson's name is ${salespersonName}.
        When a customer-facing message needs the salesperson's name,
        use that exact name.

        Never use:
        [Your Name]
        [Your Contact Information]
        [Your Number]
        [Salesperson Name]
        or similar placeholders.

        Do not invent property availability,
        appointments, prices, financing status,
        or actions that have not happened.

        The answer may contain simple formatting when useful,
        but keep it clean and readable.
        `;

        /* =======================================================
         *      GEMINI
         *   ======================================================= */

        const response =
        await ai.models.generateContent({
            model: "gemini-3.5-flash",

            contents: prompt,

            config: {
                responseMimeType:
                "application/json",

                responseSchema:
                chatSchema,
            },
        });

        const rawText =
        response.text?.trim();

        if (!rawText) {
            throw new Error(
                "The assistant returned an empty response."
            );
        }

        let result: {
            answer: string;
            updateSuggestedResponse: boolean;
            suggestedResponse: string;
        };

        try {
            result = JSON.parse(
                rawText
            );
        } catch (error) {
            console.error(
                "Invalid structured chat response:",
                rawText
            );

            throw new Error(
                "The assistant returned invalid structured data."
            );
        }

        const answer =
        String(
            result.answer ?? ""
        ).trim();

        let suggestedResponse =
        String(
            result.suggestedResponse ??
            lead.suggested_response ??
            ""
        ).trim();

        /* =======================================================
         *      CLEAN CUSTOMER RESPONSE
         *   ======================================================= */

        const cleanCustomerResponse = (
            value: string
        ) => {
            return value
            .replace(
                /^#{1,6}\s*/gm,
                ""
            )
            .replace(
                /^Draft Response:\s*/i,
                ""
            )
            .replace(
                /^Here is .*?:\s*/i,
                ""
            )
            .trim();
        };

        suggestedResponse =
        cleanCustomerResponse(
            suggestedResponse
        );

        /* =======================================================
         *      SAVE SALESPERSON MESSAGE
         *   ======================================================= */

        const {
            error: userMessageError,
        } = await supabaseAdmin
        .from("lead_messages")
        .insert({
            lead_id: leadId,
            role: "user",
            content: userMessage,
        });

        if (userMessageError) {
            console.error(
                "Could not save salesperson message:",
                userMessageError
            );
        }

        /* =======================================================
         *      SAVE AI MESSAGE
         *   ======================================================= */

        const {
            error: assistantMessageError,
        } = await supabaseAdmin
        .from("lead_messages")
        .insert({
            lead_id: leadId,
            role: "assistant",
            content:
            answer ||
            "I couldn't generate a response.",
        });

        if (assistantMessageError) {
            console.error(
                "Could not save assistant message:",
                assistantMessageError
            );
        }

        /* =======================================================
         *      UPDATE FOLLOW-UP
         *   ======================================================= */

        const shouldUpdate =
        Boolean(
            result.updateSuggestedResponse
        ) &&
        Boolean(
            suggestedResponse
        );

        if (shouldUpdate) {
            const {
                error: updateError,
            } = await supabaseAdmin
            .from("leads")
            .update({
                suggested_response:
                suggestedResponse,

                updated_at:
                new Date().toISOString(),
            })
            .eq("id", leadId);

            if (updateError) {
                console.error(
                    "Could not update suggested response:",
                    updateError
                );
            }
        }

        /* =======================================================
         *      RESPONSE
         *   ======================================================= */

        return Response.json({
            success: true,

            message:
            answer ||
            "I couldn't generate a response.",

            updateSuggestedResponse:
            shouldUpdate,

            suggestedResponse:
            suggestedResponse,
        });
    } catch (error) {
        console.error(
            "Lead chat error:",
            error
        );

        return Response.json(
            {
                success: false,
                error:
                error instanceof Error
                ? error.message
                : "Failed to generate response.",
            },
            { status: 500 }
        );
    }
}
