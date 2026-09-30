"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { DEMO_PROFILE } from "../lib/demo-profile";
import LeadLocationMap from "./LeadLocationMap";
import PropertyHeatMap from "./PropertyHeatMap";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Analysis = {
  ai_title?: string;
  summary?: string;
  intent?: string;
  key_requirements?: string;
  objections?: string;
  recommended_next_action?: string;
  suggested_response?: string;
  score?: number;
  priority?: string;
  urgency?: number;
};

type ResponseMode =
  | "strategy"
  | "suggested_response";

const MIN_INTENT_LENGTH = 80;
const VISIBLE_SUGGESTIONS = 3;
const CHAT_STORAGE_PREFIX = "masal-chat-thread-";

/* ============================================================
   CHAT STORAGE
============================================================ */

function getChatStorageKey(
  leadId: string | number
) {
  return `${CHAT_STORAGE_PREFIX}${String(leadId)}`;
}

/* ============================================================
   TEXT HELPERS
============================================================ */

function cleanText(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isPlaceholderConcern(
  value: unknown
): boolean {
  const text = cleanText(value)
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .trim();

  if (!text) {
    return true;
  }

  const placeholders = [
    "none",
    "none identified",
    "none identified here",
    "no concerns",
    "no concerns identified",
    "no objections",
    "no objections identified",
    "no issues",
    "no issues identified",
    "nothing identified",
    "not identified",
    "n/a",
    "na",
    "unknown",
  ];

  return placeholders.includes(text);
}

/* ============================================================
   BULLET PARSER
============================================================ */

function toBulletItems(
  value: unknown
): string[] {
  const text = cleanText(value);

  if (!text) {
    return [];
  }

  return text
    .split(
      /\r?\n|;|•|(?<=\.)\s+(?=[A-Z][^.!?]{2,80}:)/
    )
    .map((item) =>
      item
        .replace(/^\s*[-*•]\s*/, "")
        .replace(/^\s*\d+[.)]\s*/, "")
        .trim()
    )
    .filter((item) => item.length > 2);
}

/* ============================================================
   CONCERN INFERENCE
============================================================ */

function inferConcern(
  lead: any,
  analysis?: Analysis
): string {
  const name =
    cleanText(lead.name) ||
    "The customer";

  const location =
    cleanText(lead.location) ||
    "the target location";

  const property =
    cleanText(
      lead.property_requirement ??
        lead.propertyType
    ) ||
    "the requested property";

  const budget = cleanText(
    lead.budget
  );

  const timeline = cleanText(
    lead.timeline
  );

  const originalMessage =
    cleanText(
      lead.original_message ??
        lead.customer_message ??
        lead.message ??
        lead.snippet
    ).toLowerCase();

  const intent = cleanText(
    analysis?.intent ?? lead.intent
  ).toLowerCase();

  if (
    /compar|shortlist|few options|multiple|several|compare/.test(
      originalMessage + " " + intent
    )
  ) {
    return `${name} may be concerned about choosing between competing ${property} options in ${location}, especially comparing overall value before committing.`;
  }

  if (
    budget &&
    property &&
    timeline
  ) {
    return `${name}'s main likely concern is whether suitable ${property} inventory in ${location} can fit the ${budget} budget while still meeting the ${timeline} buying timeline.`;
  }

  if (
    timeline &&
    /asap|immediate|urgent|this month|this week|soon/i.test(
      timeline
    )
  ) {
    return `${name}'s main likely concern is availability and whether the right property can be secured quickly enough for the stated ${timeline} timeline.`;
  }

  if (
    location &&
    property
  ) {
    return `${name}'s likely concern is finding a ${property} in ${location} that matches the required combination of price, condition, and availability.`;
  }

  return `${name}'s likely concern is ensuring the available options match the stated requirements, budget, and purchase timing closely enough to justify moving forward.`;
}

/* ============================================================
   NORMALIZE AI RESPONSE
============================================================ */

function normalizeAnalysis(
  result: any
): Analysis {
  const source =
    result?.analysis ??
    result?.data ??
    result ??
    {};

  return {
    ai_title:
      source.ai_title ??
      source.aiTitle ??
      "",

    summary:
      source.summary ??
      source.lead_summary ??
      "",

    intent:
      source.intent ??
      source.customer_intent ??
      "",

    key_requirements:
      source.key_requirements ??
      source.keyRequirements ??
      "",

    objections:
      source.objections ??
      source.concerns ??
      "",

    recommended_next_action:
      source.recommended_next_action ??
      source.recommendedNextAction ??
      "",

    suggested_response:
      source.suggested_response ??
      source.suggestedResponse ??
      "",

    score:
      Number.isFinite(
        Number(source.score)
      )
        ? Number(source.score)
        : undefined,

    priority:
      source.priority ?? undefined,

    urgency:
      Number.isFinite(
        Number(source.urgency)
      )
        ? Number(source.urgency)
        : undefined,
  };
}

/* ============================================================
   LEAD PAYLOAD
============================================================ */

function buildLeadPayload(
  lead: any
) {
  return {
    name: lead.name ?? "",

    location: lead.location ?? "",

    property_requirement:
      lead.property_requirement ??
      lead.propertyType ??
      "",

    propertyRequirement:
      lead.property_requirement ??
      lead.propertyType ??
      "",

    budget: lead.budget ?? "",

    timeline: lead.timeline ?? "",

    original_message:
      lead.original_message ??
      lead.customer_message ??
      lead.message ??
      lead.snippet ??
      lead.summary ??
      "",

    customer_message:
      lead.customer_message ??
      lead.original_message ??
      lead.message ??
      lead.snippet ??
      lead.summary ??
      "",

    message:
      lead.message ??
      lead.original_message ??
      lead.snippet ??
      lead.summary ??
      "",

    urgency: lead.urgency ?? 3,
  };
}

/* ============================================================
   ANALYSIS COMPLETENESS
============================================================ */

function hasMissingCoreAnalysis(
  analysis: Analysis
) {
  const intent = cleanText(
    analysis.intent
  );

  return (
    !cleanText(analysis.summary) ||
    intent.length < MIN_INTENT_LENGTH ||
    !cleanText(
      analysis.key_requirements
    ) ||
    isPlaceholderConcern(
      analysis.objections
    ) ||
    !cleanText(
      analysis.recommended_next_action
    ) ||
    !cleanText(
      analysis.suggested_response
    )
  );
}

/* ============================================================
   OPENING ASSISTANT MESSAGE
============================================================ */

function buildOpeningMessage(
  lead: any,
  analysis: Analysis
) {
  const summary = cleanText(
    analysis.summary
  );

  const concern = cleanText(
    analysis.objections
  );

  const nextAction = cleanText(
    analysis.recommended_next_action
  );

  if (
    summary &&
    concern &&
    nextAction
  ) {
    return `${summary} The main issue to watch is ${concern
      .charAt(0)
      .toLowerCase()}${concern.slice(
      1
    )} The immediate focus should be to ${nextAction
      .charAt(0)
      .toLowerCase()}${nextAction.slice(
      1
    )}`;
  }

  if (
    summary &&
    nextAction
  ) {
    return `${summary} The immediate focus should be to ${nextAction
      .charAt(0)
      .toLowerCase()}${nextAction.slice(
      1
    )}`;
  }

  return `The customer is looking for ${
    lead.property_requirement ??
    lead.propertyType ??
    "a property"
  } in ${
    lead.location ??
    "the selected area"
  } within a budget of ${
    lead.budget ??
    "the stated budget"
  }.`;
}

/* ============================================================
   12 CONSUMABLE SUGGESTIONS
============================================================ */

function buildSuggestionPool(
  lead: any
): string[] {
  const name =
    cleanText(lead.name) ||
    "this customer";

  const location =
    cleanText(lead.location) ||
    "this location";

  const property =
    cleanText(
      lead.property_requirement ??
        lead.propertyType
    ) || "property";

  const budget =
    cleanText(lead.budget) ||
    "the stated budget";

  const timeline =
    cleanText(lead.timeline) ||
    "the stated timeline";

  return [
    `What should I emphasize when I speak with ${name}?`,
    `What are the strongest buying signals in ${name}'s ${property} search?`,
    `What concern should I address first with ${name}?`,
    `How should I position ${location} for this customer?`,
    `How should I frame the ${budget} budget without creating friction?`,
    `What requirement should I prioritize when showing ${property} options?`,
    `What could delay this deal given the ${timeline} timeline?`,
    `Give me a sharper opening for my first call with ${name}.`,
    `Make the suggested response more assertive.`,
    `Make the suggested response warmer and more conversational.`,
    `What should I say if price becomes the main objection?`,
    `What is the strongest next step after my first conversation with ${name}?`,
  ];
}

/* ============================================================
   STRATEGY QUESTION DETECTION
============================================================ */

function isStrategyQuestion(
  question: string
): boolean {
  const q = question
    .toLowerCase()
    .trim();

  return (
    q.includes("what should i emphasize") ||
    q.includes("what should i focus on") ||
    q.includes("what should i highlight") ||
    q.includes("key talking points") ||
    q.includes("key leverage points") ||
    q.includes("strongest buying signals") ||
    q.includes("what concern should i address") ||
    q.includes("what concern should i prepare") ||
    q.includes("how should i position") ||
    q.includes("what could delay this deal") ||
    q.includes("what is the strongest next step") ||
    q.includes("biggest objections") ||
    q.includes("what should i know before the call") ||
    q.includes("how should i handle the customer") ||
    q.includes("how should i approach the customer")
  );
}

/* ============================================================
   CUSTOMER-FACING REQUEST DETECTION
============================================================ */

function isCustomerFacingRequest(
  question: string
): boolean {
  const q = question
    .toLowerCase()
    .trim();

  /*
   * Anything asking the system to WRITE or REWRITE
   * something for the customer belongs in Suggested Response.
   *
   * This intentionally catches:
   *
   *   "Rewrite a more friendly tone"
   *   "Rewrite the response"
   *   "Make it more assertive"
   *   "Write something to send"
   *   "Draft a message"
   */
  const writingPatterns = [
    "suggested response",
    "suggested reply",

    "write a follow-up",
    "write a message",
    "write a reply",
    "write a response",

    "draft a message",
    "draft a reply",
    "draft a response",

    "rewrite",
    "rewrite the response",
    "rewrite my response",
    "rewrite the reply",
    "rewrite my reply",

    "make the response",
    "make the reply",
    "make the draft",
    "make draft",

    "change the tone",
    "change tone",
    "friendly tone",
    "warmer tone",
    "friendlier",
    "more friendly",
    "more warm",
    "warmer and more conversational",
    "more conversational",

    "more assertive",
    "more concise",
    "more professional",
    "less formal",
    "more casual",
    "more direct",

    "shorten the message",
    "shorten the response",

    "improve the message",
    "improve the response",

    "polish the message",
    "polish the response",

    "what should i send",
    "what should i message",
    "what should i reply",

    "what should i say to the customer",
    "what should i tell the customer",

    "message to send",
    "reply to send",

    "customer-facing",
    "customer facing",
  ];

  return writingPatterns.some(
    (pattern) =>
      q.includes(pattern)
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function LeadDetail({
  lead,
  onBack,
  salespersonName,
}: {
  lead: any;
  onBack: () => void;
  salespersonName: string;
}) {
  /* ==========================================================
     CHAT
  ========================================================== */

  const [
    messages,
    setMessages,
  ] = useState<Message[]>(
    []
  );

  const [
    input,
    setInput,
  ] = useState("");

  const [
    loadingHistory,
    setLoadingHistory,
  ] = useState(true);

  const [
    generatingAnalysis,
    setGeneratingAnalysis,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ==========================================================
     FOLLOW-UP
  ========================================================== */

  const [
    copied,
    setCopied,
  ] = useState(false);

  const [
    followUpUpdated,
    setFollowUpUpdated,
  ] = useState(false);

  /* ==========================================================
     CONSUMABLE SUGGESTIONS
  ========================================================== */

  const [
    visibleSuggestions,
    setVisibleSuggestions,
  ] = useState<string[]>(
    []
  );

  const [
    remainingSuggestions,
    setRemainingSuggestions,
  ] = useState<string[]>(
    []
  );

  /* ==========================================================
     ANALYSIS
  ========================================================== */

  const [
    analysis,
    setAnalysis,
  ] = useState<Analysis>({
    ai_title:
      lead.ai_title ??
      lead.aiTitle ??
      "",

    summary:
      lead.summary ??
      lead.snippet ??
      "",

    intent:
      lead.intent ??
      "",

    key_requirements:
      lead.key_requirements ??
      lead.keyRequirements ??
      "",

    objections:
      lead.objections ??
      "",

    recommended_next_action:
      lead.recommended_next_action ??
      lead.recommendedNextAction ??
      "",

    suggested_response:
      lead.suggested_response ??
      lead.suggestedResponse ??
      "",

    score:
      Number.isFinite(
        Number(lead.score)
      )
        ? Number(lead.score)
        : undefined,

    priority:
      lead.priority ??
      undefined,

    urgency:
      Number.isFinite(
        Number(lead.urgency)
      )
        ? Number(lead.urgency)
        : undefined,
  });

  /* ==========================================================
     CREATE 12 SUGGESTIONS
  ========================================================== */

  useEffect(() => {
    const all =
      buildSuggestionPool(
        lead
      );

    setVisibleSuggestions(
      all.slice(
        0,
        VISIBLE_SUGGESTIONS
      )
    );

    setRemainingSuggestions(
      all.slice(
        VISIBLE_SUGGESTIONS
      )
    );
  }, [lead.id]);

  /* ==========================================================
     CONSUME SUGGESTION
  ========================================================== */

  const consumeSuggestion =
    (
      suggestion: string
    ) => {
      setInput(
        suggestion
      );

      setVisibleSuggestions(
        (current) =>
          current.filter(
            (item) =>
              item !==
              suggestion
          )
      );

      setRemainingSuggestions(
        (current) => {
          if (
            current.length ===
            0
          ) {
            return current;
          }

          const [
            next,
            ...rest
          ] = current;

          setVisibleSuggestions(
            (currentVisible) => [
              ...currentVisible,
              next,
            ]
          );

          return rest;
        }
      );
    };

  /* ==========================================================
     GENERATE / COMPLETE ANALYSIS
  ========================================================== */

  const generateAnalysis =
    async (): Promise<Analysis | null> => {
      try {
        setGeneratingAnalysis(
          true
        );

        const base =
          buildLeadPayload(
            lead
          );

        const response =
          await fetch(
            "/api/analyze-lead",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  ...base,

                  analysis_requirements:
                    {
                      customer_intent:
                        "Write 2-3 complete sentences, approximately 30-70 words. Explain what the customer is trying to accomplish, why they are buying, their priorities, timing, and important constraints. Never return a short label.",

                      key_requirements:
                        "Extract concrete property, location, budget, timeline, lifestyle, financing, or other requirements.",

                      objections:
                        "Always return useful concerns. If the customer explicitly states a concern, use it. If none is explicitly stated, infer the most relevant likely concern from budget, timing, requirements, comparison behavior, or availability. Never return None identified, No concerns, N/A, or an empty value.",

                      recommended_next_action:
                        "Give one concrete salesperson-ready next step.",

                      suggested_response:
                        "Write a natural customer-facing response grounded in the lead.",
                    },
                }
              ),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ??
              "AI analysis failed."
          );
        }

        const generated =
          normalizeAnalysis(
            result
          );

        if (
          isPlaceholderConcern(
            generated.objections
          )
        ) {
          generated.objections =
            inferConcern(
              lead,
              generated
            );
        }

        if (
          !cleanText(
            generated.intent
          ) ||
          cleanText(
            generated.intent
          ).length <
            MIN_INTENT_LENGTH
        ) {
          generated.intent =
            generated.summary
              ? `${generated.summary} The decision is likely to depend on how well the available options match the customer's stated requirements, budget, and buying timeline.`
              : `The customer is actively evaluating a ${
                  lead.property_requirement ??
                  lead.propertyType ??
                  "property"
                } in ${
                  lead.location ??
                  "the target location"
                }, with the decision primarily shaped by the stated budget, requirements, and purchase timeline.`;
        }

        setAnalysis(
          (current) => ({
            ...current,
            ...generated,
          })
        );

        return generated;
      } catch (err) {
        console.error(
          "Analysis generation error:",
          err
        );

        setAnalysis(
          (current) => ({
            ...current,

            objections:
              isPlaceholderConcern(
                current.objections
              )
                ? inferConcern(
                    lead,
                    current
                  )
                : current.objections,
          })
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to generate lead analysis."
        );

        return null;
      } finally {
        setGeneratingAnalysis(
          false
        );
      }
    };

  /* ==========================================================
     INITIALIZE LEAD + RESTORE CHAT
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const initialize =
      async () => {
        try {
          setLoadingHistory(
            true
          );

          setError("");

          const storageKey =
            getChatStorageKey(
              lead.id
            );

          /*
           * Restore local chat first.
           */
          try {
            const cached =
              localStorage.getItem(
                storageKey
              );

            if (cached) {
              const parsed =
                JSON.parse(
                  cached
                );

              if (
                Array.isArray(
                  parsed
                ) &&
                parsed.length > 0
              ) {
                setMessages(
                  parsed
                );

                return;
              }
            }
          } catch (
            cacheError
          ) {
            console.warn(
              "Could not restore cached chat:",
              cacheError
            );
          }

          /*
           * Complete analysis if needed.
           */
          let currentAnalysis =
            analysis;

          if (
            hasMissingCoreAnalysis(
              currentAnalysis
            )
          ) {
            const generated =
              await generateAnalysis();

            if (
              generated
            ) {
              currentAnalysis =
                {
                  ...currentAnalysis,
                  ...generated,
                };
            }
          }

          if (
            isPlaceholderConcern(
              currentAnalysis.objections
            )
          ) {
            currentAnalysis = {
              ...currentAnalysis,

              objections:
                inferConcern(
                  lead,
                  currentAnalysis
                ),
            };

            setAnalysis(
              currentAnalysis
            );
          }

          if (
            cancelled
          ) {
            return;
          }

          /*
           * Try persistent server history.
           */
          try {
            const historyResponse =
              await fetch(
                `/api/leads/${lead.id}/chat/history`,
                {
                  cache:
                    "no-store",
                }
              );

            if (
              historyResponse.ok
            ) {
              const historyResult =
                await historyResponse.json();

              const history =
                historyResult.success &&
                Array.isArray(
                  historyResult.messages
                )
                  ? historyResult.messages.map(
                      (
                        message: any
                      ) => ({
                        role:
                          message.role ===
                          "user"
                            ? "user"
                            : "assistant",

                        content:
                          message.content,
                      })
                    )
                  : [];

              if (
                history.length >
                0
              ) {
                setMessages(
                  history
                );

                try {
                  localStorage.setItem(
                    storageKey,
                    JSON.stringify(
                      history
                    )
                  );
                } catch {}

                return;
              }
            }
          } catch {
            /*
             * Normal for demo/new leads.
             */
          }

          if (
            cancelled
          ) {
            return;
          }

          /*
           * New conversation.
           */
          const openingMessage: Message =
            {
              role:
                "assistant",

              content:
                buildOpeningMessage(
                  lead,
                  currentAnalysis
                ),
            };

          setMessages([
            openingMessage,
          ]);

          try {
            localStorage.setItem(
              storageKey,
              JSON.stringify([
                openingMessage,
              ])
            );
          } catch {}
        } catch (err) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "Lead initialization error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to initialize this lead."
          );
        } finally {
          if (
            !cancelled
          ) {
            setLoadingHistory(
              false
            );
          }
        }
      };

    initialize();

    return () => {
      cancelled = true;
    };

    /*
     * Only reset when a different lead is opened.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  /* ==========================================================
     PERSIST CHAT
  ========================================================== */

  useEffect(() => {
    if (
      messages.length ===
      0
    ) {
      return;
    }

    try {
      localStorage.setItem(
        getChatStorageKey(
          lead.id
        ),
        JSON.stringify(
          messages
        )
      );
    } catch (error) {
      console.warn(
        "Could not persist chat:",
        error
      );
    }
  }, [
    messages,
    lead.id,
  ]);

  /* ==========================================================
     AI FALLBACK
  ========================================================== */

  const askAnalysisFallback =
    async (
      question: string,
      responseMode: ResponseMode
    ) => {
      const context =
        buildLeadPayload(
          lead
        );

      const prompt =
        responseMode ===
        "suggested_response"
          ? `
You are helping a real-estate salesperson.

Write the revised customer-facing message requested below.

The result must be ONLY the message that can be sent directly to the customer.

Do not explain your reasoning.
Do not speak to the salesperson.
Do not prefix it with "Suggested response".
Do not use markdown.

Lead:
${context.name}

Location:
${context.location}

Property:
${context.property_requirement}

Budget:
${context.budget}

Timeline:
${context.timeline}

Current suggested response:
${analysis.suggested_response ?? ""}

Salesperson request:
${question}
          `.trim()
          : `
You are helping a real-estate salesperson.

Answer the salesperson's strategy question directly.

This is NOT a customer message.

Do NOT write "Hi ${context.name}".
Do NOT write a message for the customer.
Do NOT turn the answer into a suggested reply.

Explain what the salesperson should emphasize, why it matters, what concern to address, or what sales tactic to use, depending on the question.

Lead:
${context.name}

Location:
${context.location}

Property:
${context.property_requirement}

Budget:
${context.budget}

Timeline:
${context.timeline}

Summary:
${analysis.summary ?? ""}

Intent:
${analysis.intent ?? ""}

Requirements:
${analysis.key_requirements ?? ""}

Concerns:
${analysis.objections ?? ""}

Recommended next action:
${analysis.recommended_next_action ?? ""}

Salesperson question:
${question}
          `.trim();

      const response =
        await fetch(
          "/api/analyze-lead",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                ...context,

                original_message:
                  prompt,

                customer_message:
                  prompt,

                message:
                  prompt,
              }
            ),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ??
            "Unable to generate an AI answer."
        );
      }

      const generated =
        normalizeAnalysis(
          result
        );

      return (
        generated.suggested_response ||
        generated.summary ||
        generated.intent ||
        ""
      );
    };

  /* ==========================================================
     UPDATE LEFT SUGGESTED RESPONSE
  ========================================================== */

  const updateSuggestedResponse =
    (
      text: string
    ) => {
      const cleaned =
        cleanText(text);

      if (!cleaned) {
        return;
      }

      setAnalysis(
        (current) => ({
          ...current,
          suggested_response:
            cleaned,
        })
      );

      setFollowUpUpdated(
        true
      );

      setTimeout(
        () =>
          setFollowUpUpdated(
            false
          ),
        2200
      );
    };

  /* ==========================================================
     SEND CHAT
  ========================================================== */

  const handleSend =
    async (
      event: FormEvent
    ) => {
      event.preventDefault();

      const message =
        input.trim();

      if (
        !message ||
        sending
      ) {
        return;
      }

      setInput("");
      setSending(true);
      setError("");

      /*
       * Always show what the salesperson typed.
       */
      setMessages(
        (current) => [
          ...current,
          {
            role: "user",
            content: message,
          },
        ]
      );

      /*
       * Classification happens BEFORE the API request.
       *
       * "Rewrite a more friendly tone"
       * "Make it more assertive"
       * "Write a follow-up"
       *
       * all become suggested_response requests.
       */
      const customerFacing =
        isCustomerFacingRequest(
          message
        );

      const responseMode: ResponseMode =
        customerFacing
          ? "suggested_response"
          : "strategy";

      try {
        const response =
          await fetch(
            `/api/leads/${lead.id}/chat`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  message,
                  responseMode,

                  salespersonName,

                  salespersonLocation:
                    DEMO_PROFILE.location,

                  salespersonPhone:
                    DEMO_PROFILE.phone,

                  leadContext: {
                    id:
                      lead.id,

                    name:
                      lead.name,

                    location:
                      lead.location,

                    property_requirement:
                      lead.property_requirement ??
                      lead.propertyType,

                    budget:
                      lead.budget,

                    timeline:
                      lead.timeline,

                    original_message:
                      lead.original_message ??
                      lead.customer_message ??
                      lead.message ??
                      lead.snippet,

                    ...analysis,

                    objections:
                      isPlaceholderConcern(
                        analysis.objections
                      )
                        ? inferConcern(
                            lead,
                            analysis
                          )
                        : analysis.objections,
                  },
                }
              ),
            }
          );

        const result =
          await response.json();

        if (
          response.ok &&
          result.success &&
          result.message
        ) {
          /*
           * CUSTOMER-FACING REQUEST
           *
           * Actual generated customer text ONLY
           * goes into Suggested Response.
           */
          if (
            responseMode ===
            "suggested_response"
          ) {
            updateSuggestedResponse(
              result.message
            );

            setMessages(
              (current) => [
                ...current,
                {
                  role:
                    "assistant",
                  content:
                    "Done. I’ve updated the Suggested Response on the left.",
                },
              ]
            );

            return;
          }

          /*
           * STRATEGY REQUEST
           *
           * This belongs in the main chat.
           */
          setMessages(
            (current) => [
              ...current,
              {
                role:
                  "assistant",
                content:
                  result.message,
              },
            ]
          );

          return;
        }

        /*
         * New/demo lead that isn't persisted:
         * use the analysis endpoint instead.
         */
        const fallbackAnswer =
          await askAnalysisFallback(
            message,
            responseMode
          );

        if (
          responseMode ===
          "suggested_response"
        ) {
          updateSuggestedResponse(
            fallbackAnswer
          );

          setMessages(
            (current) => [
              ...current,
              {
                role:
                  "assistant",
                content:
                  "Done. I’ve updated the Suggested Response on the left.",
              },
            ]
          );

          return;
        }

        setMessages(
          (current) => [
            ...current,
            {
              role:
                "assistant",
              content:
                fallbackAnswer,
            },
          ]
        );
      } catch (err) {
        console.error(
          "Chat error:",
          err
        );

        /*
         * Second attempt through analysis endpoint.
         */
        try {
          const fallbackAnswer =
            await askAnalysisFallback(
              message,
              responseMode
            );

          if (
            responseMode ===
            "suggested_response"
          ) {
            updateSuggestedResponse(
              fallbackAnswer
            );

            setMessages(
              (current) => [
                ...current,
                {
                  role:
                    "assistant",
                  content:
                    "Done. I’ve updated the Suggested Response on the left.",
                },
              ]
            );

            return;
          }

          setMessages(
            (current) => [
              ...current,
              {
                role:
                  "assistant",
                content:
                  fallbackAnswer,
              },
            ]
          );
        } catch (
          fallbackError
        ) {
          console.error(
            "Fallback AI error:",
            fallbackError
          );

          setError(
            fallbackError instanceof
              Error
              ? fallbackError.message
              : "Unable to get an AI response."
          );
        }
      } finally {
        setSending(false);
      }
    };

  /* ==========================================================
     QUICK PROMPT
  ========================================================== */

  const usePrompt =
    (
      prompt: string
    ) => {
      setInput(
        prompt
      );
    };

  /* ==========================================================
     COPY RESPONSE
  ========================================================== */

  const copyResponse =
    async () => {
      const response =
        analysis.suggested_response ??
        lead.suggested_response ??
        "";

      if (!response) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          response
        );

        setCopied(true);

        setTimeout(
          () =>
            setCopied(false),
          1500
        );
      } catch {}
    };

  /* ==========================================================
     DISPLAY VALUES
  ========================================================== */

  const displaySummary =
    cleanText(
      analysis.summary
    ) ||
    cleanText(
      lead.summary
    ) ||
    cleanText(
      lead.snippet
    ) ||
    "Generating...";

  const requirementItems =
    toBulletItems(
      cleanText(
        analysis.key_requirements
      ) ||
        cleanText(
          lead.key_requirements
        ) ||
        cleanText(
          lead.keyRequirements
        )
    );

  const concernText =
    isPlaceholderConcern(
      analysis.objections
    ) &&
    isPlaceholderConcern(
      lead.objections
    )
      ? inferConcern(
          lead,
          analysis
        )
      : cleanText(
          analysis.objections
        ) ||
        cleanText(
          lead.objections
        ) ||
        inferConcern(
          lead,
          analysis
        );

  const concernItems =
    toBulletItems(
      concernText
    );

  const displayNextAction =
    cleanText(
      analysis.recommended_next_action
    ) ||
    cleanText(
      lead.recommended_next_action
    ) ||
    cleanText(
      lead.recommendedNextAction
    ) ||
    (generatingAnalysis
      ? "Generating..."
      : "Generate the next best action.");

  const displaySuggestedResponse =
    cleanText(
      analysis.suggested_response
    ) ||
    cleanText(
      lead.suggested_response
    ) ||
    cleanText(
      lead.suggestedResponse
    ) ||
    (generatingAnalysis
      ? "Generating..."
      : "Generate a suggested response.");

  const displayScore =
    analysis.score ??
    lead.score ??
    0;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-100 font-sans">

      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6">

        <div className="flex min-w-0 items-center gap-4">

          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          >
            ← Inbox
          </button>

          <div className="h-4 w-px bg-zinc-200" />

          <div className="min-w-0">

            <h2 className="truncate text-sm font-semibold text-zinc-900">
              {lead.ai_title ||
                lead.aiTitle ||
                analysis.ai_title ||
                lead.name}
            </h2>

            <p className="mt-0.5 truncate text-[11px] text-zinc-400">
              {lead.name} •{" "}
              {lead.location} •{" "}
              {lead.budget}
            </p>

          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">

          <button
            type="button"
            onClick={copyResponse}
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-200"
          >
            {copied
              ? "Copied"
              : "Copy Follow-up"}
          </button>

          <a
            href={`tel:${DEMO_PROFILE.phone}`}
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            ☎ Contact Client
          </a>

        </div>
      </header>

      {/* ======================================================
          BODY
      ====================================================== */}

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">

        {/* ====================================================
            LEFT DOSSIER
        ==================================================== */}

        <section className="flex min-h-0 w-1/2 flex-col overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

          {/* HEADER */}

          <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">

            <div>

              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                AI Intelligence Dossier
              </span>

              <h3 className="mt-0.5 text-xl font-bold text-zinc-900">
                Opportunity Analysis
              </h3>

            </div>

            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
              Lead Score: {displayScore}/100
            </span>

          </div>

          {/* CORE INTENT */}

          <div className="space-y-2">

            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Core Intent & Summary
            </h4>

            <div className="rounded-xl border border-zinc-200/60 bg-zinc-50 p-3.5 text-xs leading-relaxed text-zinc-700">
              {displaySummary}
            </div>

          </div>

          {/* REQUIREMENTS + CONCERNS */}

          <div className="mt-5 grid grid-cols-2 gap-3">

            {/* REQUIREMENTS */}

            <div className="rounded-xl border border-zinc-200/70 bg-white p-3.5">

              <h5 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                Key Requirements

              </h5>

              {requirementItems.length >
              0 ? (

                <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-zinc-700">

                  {requirementItems.map(
                    (
                      item,
                      index
                    ) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}

                </ul>

              ) : (

                <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-zinc-700">

                  <li>
                    Property:{" "}
                    {lead.property_requirement ??
                      lead.propertyType ??
                      "Not specified"}
                  </li>

                  <li>
                    Location:{" "}
                    {lead.location ??
                      "Not specified"}
                  </li>

                  {lead.budget && (
                    <li>
                      Budget: {lead.budget}
                    </li>
                  )}

                  {lead.timeline && (
                    <li>
                      Timeline:{" "}
                      {lead.timeline}
                    </li>
                  )}

                </ul>
              )}

            </div>

            {/* CONCERNS */}

            <div className="rounded-xl border border-zinc-200/70 bg-white p-3.5">

              <h5 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">

                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                Concerns

              </h5>

              <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-zinc-700">

                {concernItems.map(
                  (
                    item,
                    index
                  ) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}

              </ul>

            </div>
          </div>

          {/* NEXT ACTION */}

          <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">

            <div className="mb-1.5 flex items-center gap-2">

              <span className="text-base">
                🎯
              </span>

              <h5 className="text-xs font-bold uppercase tracking-wide text-indigo-950">
                Recommended Next Action
              </h5>

            </div>

            <p className="text-xs font-medium leading-relaxed text-indigo-900">
              {displayNextAction}
            </p>

          </div>

          {/* SUGGESTED RESPONSE */}

          <div
            className={[
              "mt-5 rounded-xl transition-all duration-500",
              followUpUpdated
                ? "bg-indigo-50/60 p-2 ring-2 ring-indigo-400 ring-offset-2"
                : "",
            ].join(" ")}
          >

            <div className="space-y-2">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Suggested Response
                  </h4>

                  {followUpUpdated && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-700">
                      Updated
                    </span>
                  )}

                </div>

                <button
                  type="button"
                  onClick={copyResponse}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {copied
                    ? "Copied"
                    : "Copy"}
                </button>

              </div>

              <div
                className={[
                  "rounded-xl border p-3 text-xs leading-relaxed text-zinc-700 transition-all duration-500",
                  followUpUpdated
                    ? "border-indigo-300 bg-white shadow-md"
                    : "border-zinc-200/60 bg-zinc-50",
                ].join(" ")}
              >
                {displaySuggestedResponse}
              </div>

            </div>
          </div>

          {/* LOCATION MAP */}

          <LeadLocationMap
            location={
              lead.location ??
              "Bengaluru"
            }
            title={
              lead.name ??
              "Customer Location"
            }
          />

          {/* PRICE HEAT MAP */}

          <PropertyHeatMap
            location={
              lead.location ??
              "Bengaluru"
            }
            budget={
              lead.budget ?? ""
            }
          />

        </section>

        {/* ====================================================
            RIGHT DEAL STRATEGY ASSISTANT
        ==================================================== */}

        <section className="flex min-h-0 w-1/2 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">

          {/* HEADER */}

          <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50/40 px-5">

            <div className="flex items-center gap-2">

              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <h4 className="text-xs font-bold tracking-tight text-zinc-800">
                Deal Strategy Assistant
              </h4>

            </div>



          </div>

          {/* CHAT */}

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">

            {loadingHistory ? (

              <div className="flex items-center gap-2 text-xs text-zinc-400">

                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" />

                Preparing lead strategy...

              </div>

            ) : (

              messages.map(
                (
                  message,
                  index
                ) => (

                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${
                      message.role ===
                      "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={[
                        "max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed",
                        message.role ===
                        "user"
                          ? "rounded-br-sm bg-indigo-600 text-white"
                          : "rounded-bl-sm border border-zinc-200/60 bg-zinc-100 text-zinc-800",
                      ].join(" ")}
                    >
                      {message.content}
                    </div>

                  </div>

                )
              )
            )}

            {sending && (

              <div className="flex justify-start">

                <div className="rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-3 text-xs text-zinc-500">
                  Thinking...
                </div>

              </div>

            )}

          </div>

          {/* ERROR */}

          {error && (

            <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>

          )}

          {/* ==================================================
              CONSUMABLE SUGGESTIONS
          ================================================== */}

          <div className="flex min-h-[50px] shrink-0 items-center gap-1.5 overflow-x-auto border-t border-zinc-100 bg-zinc-50/50 px-4 py-2">

            {visibleSuggestions.map(
              (
                suggestion,
                index
              ) => (

                <button
                  key={`${suggestion}-${index}`}
                  type="button"
                  onClick={() =>
                    consumeSuggestion(
                      suggestion
                    )
                  }
                  className="
                    shrink-0
                    whitespace-nowrap
                    rounded-full
                    border
                    border-zinc-200
                    bg-white
                    px-3
                    py-1.5
                    text-[11px]
                    font-medium
                    text-zinc-600
                    shadow-sm
                    transition-all
                    hover:border-indigo-400
                    hover:bg-indigo-50
                    hover:text-indigo-700
                    active:scale-95
                  "
                >
                  {suggestion}
                </button>

              )
            )}

            {visibleSuggestions.length ===
              0 && (

              <span className="text-[11px] text-zinc-400">
                Suggestions exhausted for this lead.
              </span>

            )}

          </div>

          {/* INPUT */}

          <form
            onSubmit={handleSend}
            className="flex shrink-0 items-center gap-2 border-t border-zinc-200 p-3"
          >

            <input
              value={input}
              disabled={sending}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              placeholder="Ask anything about this lead..."
              className="
                flex-1
                rounded-xl
                border
                border-zinc-200
                bg-zinc-50
                px-3.5
                py-2
                text-xs
                text-zinc-800
                outline-none
                focus:border-indigo-500
              "
            />

            <button
              type="submit"
              disabled={
                sending ||
                !input.trim()
              }
              className="
                rounded-xl
                bg-indigo-600
                px-4
                py-2
                text-xs
                font-semibold
                text-white
                transition-colors
                hover:bg-indigo-700
                disabled:opacity-50
              "
            >
              {sending
                ? "..."
                : "Send"}
            </button>

          </form>

        </section>
      </div>
    </div>
  );
}
