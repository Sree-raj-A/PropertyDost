"use client";

import { useEffect, useMemo, useState } from "react";
import { DEMO_PROFILE } from "../lib/demo-profile";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type MarketArea = {
  name: string;
  price: string;
  level: "high" | "medium" | "low";
};

export default function LeadDetail({
  lead,
  onBack,
  salespersonName,
}: {
  lead: any;
  onBack: () => void;
  salespersonName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [suggestedResponse, setSuggestedResponse] =
    useState<string>(
      lead.suggestedResponse ??
        lead.suggested_response ??
        ""
    );

  const [responseGlow, setResponseGlow] = useState(false);

  const [quickPrompts, setQuickPrompts] =
    useState<string[]>([]);

  const [remainingPrompts, setRemainingPrompts] =
    useState<string[]>([]);

  /* =========================================================
     BASIC LEAD DATA
  ========================================================= */

  const leadTitle =
    lead.ai_title ??
    lead.aiTitle ??
    lead.name ??
    "Lead";

  const leadSummary =
    lead.summary ??
    lead.snippet ??
    "No analysis available.";

  const leadIntent =
    lead.intent ??
    "No intent analysis available.";

  const keyRequirements =
    lead.keyRequirements ??
    lead.key_requirements ??
    "None identified.";

  const objections =
    lead.objections ??
    "None identified.";

  const recommendedAction =
    lead.recommendedNextAction ??
    lead.recommended_next_action ??
    "Thinking...";

  const buyingWindow =
    lead.timeline ??
    lead.buyingWindow ??
    "";

  /* =========================================================
     GOOGLE MAP
  ========================================================= */

  const mapsKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const mapUrl = useMemo(() => {
    if (!mapsKey || !lead.location) {
      return "";
    }

    const query = encodeURIComponent(
      `${lead.location}, India`
    );

    return (
      "https://www.google.com/maps/embed/v1/place" +
      `?key=${mapsKey}&q=${query}`
    );
  }, [mapsKey, lead.location]);

  const mapsSearchUrl = useMemo(() => {
    if (!lead.location) {
      return "#";
    }

    return (
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(
        `${lead.location}, India`
      )
    );
  }, [lead.location]);

  /* =========================================================
     ILLUSTRATIVE MARKET DATA
  ========================================================= */

  const marketAreas: MarketArea[] = [
    {
      name: "Indiranagar",
      price: "₹18,500/sq.ft",
      level: "high",
    },
    {
      name: "Koramangala",
      price: "₹16,800/sq.ft",
      level: "high",
    },
    {
      name: "HSR Layout",
      price: "₹12,900/sq.ft",
      level: "medium",
    },
    {
      name: "Whitefield",
      price: "₹10,700/sq.ft",
      level: "medium",
    },
    {
      name: "Sarjapur Road",
      price: "₹9,200/sq.ft",
      level: "low",
    },
  ];

  /* =========================================================
     CONSUMABLE PROMPTS
  ========================================================= */

  useEffect(() => {
    const property =
      lead.propertyType ??
      lead.property_requirement ??
      "this property";

    const location =
      lead.location ??
      "the requested location";

    const budget =
      lead.budget ??
      "the stated budget";

    const objectionsText = String(
      lead.objections ?? ""
    ).trim();

    const firstObjection =
      objectionsText
        .split(";")[0]
        ?.trim() ?? "";

    const prompts = [
      `What should I emphasize about ${property}?`,
      `How should I position ${location} for this customer?`,
      "What should I say on the first call?",
      "What is the customer's strongest buying signal?",
      "What is the biggest risk in this lead?",
      "What should I ask the customer next?",
      "Give me three talking points for this lead.",
      "How should I handle the customer's main concern?",
      firstObjection
        ? `How should I handle ${firstObjection}?`
        : "What concern should I probe further?",
      `How should I discuss the ${budget} budget?`,
      "What could prevent this deal from progressing?",
      "What would make this customer more likely to book a viewing?",
      "Summarize the customer in three bullet points.",
      "What information am I still missing?",
      "Write a concise call opening.",
      "Write a concise WhatsApp follow-up.",
      "Make the follow-up more assertive.",
      "Make the follow-up warmer.",
      "Make the follow-up shorter.",
      "What should my next action be after the customer's reply?",
    ];

    setQuickPrompts(prompts.slice(0, 3));
    setRemainingPrompts(prompts.slice(3));
  }, [
    lead.id,
    lead.propertyType,
    lead.property_requirement,
    lead.location,
    lead.budget,
    lead.objections,
  ]);

  /* =========================================================
     LOAD CHAT HISTORY
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        setLoadingHistory(true);
        setError("");

        const response = await fetch(
          `/api/leads/${lead.id}/chat/history`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          if (!cancelled) {
            setMessages([]);
          }

          return;
        }

        const result =
          await response.json();

        if (cancelled) {
          return;
        }

        if (
          result.success &&
          Array.isArray(result.messages)
        ) {
          setMessages(
            result.messages.map(
              (item: any) => ({
                role:
                  item.role === "user"
                    ? "user"
                    : "assistant",
                content: String(
                  item.content ?? ""
                ),
              })
            )
          );
        }
      } catch (err) {
        console.error(
          "History loading error:",
          err
        );

        if (!cancelled) {
          setMessages([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [lead.id]);

  /* =========================================================
     AI TEXT FORMATTING
  ========================================================= */

  function renderInline(text: string) {
    const parts =
      text.split(
        /(\*\*.*?\*\*)/g
      );

    return parts.map(
      (part, index) => {
        if (
          part.startsWith("**") &&
          part.endsWith("**")
        ) {
          return (
            <strong key={index}>
              {part.slice(2, -2)}
            </strong>
          );
        }

        return (
          <span key={index}>
            {part}
          </span>
        );
      }
    );
  }

  function renderAIText(
    text: string
  ) {
    const cleaned =
      String(text ?? "")
        .replace(/\r/g, "")
        .replace(
          /^#{1,6}\s*/gm,
          ""
        )
        .replace(
          /^Draft Response:\s*/gim,
          ""
        )
        .replace(
          /^Here is .*?:\s*/gim,
          ""
        )
        .trim();

    const lines =
      cleaned.split("\n");

    return (
      <div className="space-y-2">
        {lines.map(
          (line, index) => {
            const trimmed =
              line.trim();

            if (!trimmed) {
              return (
                <div
                  key={index}
                  className="h-1"
                />
              );
            }

            if (
              trimmed.startsWith("- ") ||
              trimmed.startsWith("* ")
            ) {
              return (
                <div
                  key={index}
                  className="flex gap-2"
                >
                  <span>•</span>

                  <span>
                    {renderInline(
                      trimmed.slice(2)
                    )}
                  </span>
                </div>
              );
            }

            return (
              <p key={index}>
                {renderInline(
                  trimmed
                )}
              </p>
            );
          }
        )}
      </div>
    );
  }

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  async function handleSend(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const text =
      input.trim();

    if (!text || sending) {
      return;
    }

    setInput("");
    setSending(true);
    setError("");

    setMessages(
      (current) => [
        ...current,
        {
          role: "user",
          content: text,
        },
      ]
    );

    try {
      const response =
        await fetch(
          `/api/leads/${lead.id}/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                message: text,
                salespersonName,
                salespersonLocation:
                  DEMO_PROFILE.location,
                salespersonPhone:
                  DEMO_PROFILE.phone,
              }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ??
            "Unable to get a response."
        );
      }

      setMessages(
        (current) => [
          ...current,
          {
            role: "assistant",
            content:
              result.message ??
              "",
          },
        ]
      );

      if (
        result.updateSuggestedResponse &&
        result.suggestedResponse
      ) {
        setSuggestedResponse(
          result.suggestedResponse
        );

        setResponseGlow(true);

        window.setTimeout(
          () => {
            setResponseGlow(false);
          },
          1800
        );
      }
    } catch (err) {
      console.error(
        "Chat error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSending(false);
    }
  }

  /* =========================================================
     CONSUME PROMPT
  ========================================================= */

  function usePrompt(
    prompt: string
  ) {
    setInput(prompt);

    setQuickPrompts(
      (current) => {
        const clickedIndex =
          current.indexOf(
            prompt
          );

        if (
          clickedIndex ===
          -1
        ) {
          return current;
        }

        const replacement =
          remainingPrompts[0];

        if (replacement) {
          const next =
            [...current];

          next[clickedIndex] =
            replacement;

          return next;
        }

        return current.filter(
          (_, index) =>
            index !==
            clickedIndex
        );
      }
    );

    setRemainingPrompts(
      (current) =>
        current.length > 0
          ? current.slice(1)
          : current
    );
  }

  /* =========================================================
     COPY FOLLOW-UP
  ========================================================= */

  async function copyResponse() {
    if (
      !suggestedResponse
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        suggestedResponse
      );

      setCopied(true);

      window.setTimeout(
        () => {
          setCopied(false);
        },
        1500
      );
    } catch (err) {
      console.error(
        "Clipboard error:",
        err
      );
    }
  }

  /* =========================================================
     MARKET BAR
  ========================================================= */

  function marketBarClass(
    level: MarketArea["level"]
  ) {
    if (level === "high") {
      return "h-full w-[92%] rounded-full bg-red-500";
    }

    if (level === "medium") {
      return "h-full w-[65%] rounded-full bg-orange-400";
    }

    return "h-full w-[40%] rounded-full bg-emerald-500";
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-100 font-sans">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6">

        <div className="flex min-w-0 items-center gap-4">

          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
          >
            ← Inbox
          </button>

          <div className="h-4 w-px bg-zinc-200" />

          <div className="min-w-0">

            <h2 className="truncate text-sm font-semibold text-zinc-900">
              {leadTitle}
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
            onClick={
              copyResponse
            }
            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200"
          >
            {copied
              ? "Copied"
              : "Copy Follow-up"}
          </button>

          <a
            href={`tel:${DEMO_PROFILE.phone}`}
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            ☎ Contact Client
          </a>

        </div>
      </header>

      {/* =====================================================
          BODY
      ===================================================== */}

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">

        {/* ===================================================
            LEFT DOSSIER
        =================================================== */}

        <section className="flex min-h-0 w-1/2 flex-col overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

          {/* Header */}

          <div className="mb-6 flex shrink-0 items-center justify-between border-b border-zinc-100 pb-4">

            <div>

              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                AI Intelligence Dossier
              </span>

              <h3 className="mt-0.5 text-xl font-bold text-zinc-900">
                Opportunity Analysis
              </h3>

            </div>

            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
              Lead Score:{" "}
              {lead.score ?? 0}/100
            </span>

          </div>

          {/* Summary */}

          <div className="shrink-0 space-y-2">

            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Core Intent & Summary
            </h4>

            <div className="rounded-xl border border-zinc-200/60 bg-zinc-50 p-3.5 text-xs leading-relaxed text-zinc-700">
              {leadSummary}
            </div>

          </div>

          {/* Intent */}

          <div className="mt-5 shrink-0 space-y-2">

            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Customer Intent
            </h4>

            <div className="rounded-xl border border-zinc-200/60 bg-white p-3.5 text-xs leading-relaxed text-zinc-700">
              {leadIntent}
            </div>

          </div>

          {/* Requirements / Concerns */}

          <div className="mt-5 grid shrink-0 grid-cols-2 gap-3">

            <div className="rounded-xl border border-zinc-200/70 bg-white p-3.5">

              <h5 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                Key Requirements

              </h5>

              <p className="text-xs leading-relaxed text-zinc-700">
                {keyRequirements}
              </p>

            </div>

            <div className="rounded-xl border border-zinc-200/70 bg-white p-3.5">

              <h5 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">

                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                Concerns

              </h5>

              <p className="text-xs leading-relaxed text-zinc-700">
                {objections}
              </p>

            </div>

          </div>

          {/* Buying Window */}

          {buyingWindow && (
            <div className="mt-5 shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 p-4">

              <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Buying Window
              </div>

              <div className="mt-1 text-sm font-medium text-zinc-800">
                {buyingWindow}
              </div>

            </div>
          )}

          {/* Recommended Action */}

          <div className="mt-5 shrink-0 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">

            <div className="mb-1.5 flex items-center gap-2">

              <span>🎯</span>

              <h5 className="text-xs font-bold uppercase tracking-wide text-indigo-950">
                Recommended Next Action
              </h5>

            </div>

            <p className="text-xs font-medium leading-relaxed text-indigo-900">
              {recommendedAction}
            </p>

          </div>

          {/* =================================================
              SUGGESTED FOLLOW-UP
          ================================================= */}

          <div className="mt-5 shrink-0 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">

            <div className="flex min-h-[72px] items-center justify-between border-b border-indigo-100 bg-indigo-50 px-5 py-3.5">

              <div>

                <div className="flex items-center gap-2">

                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
                    ✉
                  </span>

                  <h4 className="text-sm font-bold text-indigo-950">
                    Suggested Follow-up
                  </h4>

                </div>

                <p className="mt-1 text-[10px] text-indigo-700/70">
                  Ready to send to the customer
                </p>

              </div>

              <button
                type="button"
                onClick={
                  copyResponse
                }
                className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100 hover:bg-indigo-50"
              >
                {copied
                  ? "Copied"
                  : "Copy"}
              </button>

            </div>

            <div
              className={
                responseGlow
                  ? "min-h-[120px] bg-white px-5 py-5 text-sm leading-7 text-zinc-800 shadow-[inset_0_0_35px_rgba(99,102,241,0.12)] ring-2 ring-inset ring-indigo-300 transition-all duration-500"
                  : "min-h-[120px] bg-white px-5 py-5 text-sm leading-7 text-zinc-800 transition-all duration-500"
              }
            >
              {suggestedResponse ? (
                renderAIText(
                  suggestedResponse
                )
              ) : (
                <span className="text-zinc-400">
                  Thinking...
                </span>
              )}
            </div>

          </div>

          {/* =================================================
              LOCATION INTELLIGENCE
          ================================================= */}

          <div className="mt-5 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

            {/* Location header */}

            <div className="border-b border-zinc-100 px-5 py-4">

              <div className="text-sm font-bold text-zinc-900">
                Location Intelligence
              </div>

              <div className="mt-0.5 text-[11px] text-zinc-400">
                {lead.location}
              </div>

            </div>

            {/* MAP */}

            <div className="relative h-[300px] min-h-[300px] w-full bg-zinc-100">

              {mapUrl ? (
                <iframe
                  title={`Map of ${lead.location}`}
                  src={mapUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">

                  <div className="text-sm font-semibold text-zinc-700">
                    {lead.location}
                  </div>

                  <p className="mt-1 max-w-xs text-xs text-zinc-400">
                    Add your Google Maps API key to display the interactive map.
                  </p>

                  <a
                    href={mapsSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Open in Google Maps
                  </a>

                </div>
              )}

            </div>

            {/* MARKET HEATMAP */}

            <div className="shrink-0 border-t border-zinc-100 px-5 py-4">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <div className="text-xs font-bold uppercase tracking-wide text-zinc-700">
                    Illustrative Market Heatmap
                  </div>

                  <div className="mt-0.5 text-[10px] text-zinc-400">
                    Synthetic area comparison
                  </div>

                </div>

                <div className="flex shrink-0 items-center gap-3 text-[10px] text-zinc-500">

                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    High
                  </span>

                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-orange-400" />
                    Medium
                  </span>

                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Lower
                  </span>

                </div>

              </div>

              <div className="mt-4 space-y-2">

                {marketAreas.map(
                  (area) => (
                    <div
                      key={
                        area.name
                      }
                      className="flex items-center gap-3"
                    >

                      <div className="w-28 shrink-0 text-xs font-medium text-zinc-600">
                        {area.name}
                      </div>

                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">

                        <div
                          className={marketBarClass(
                            area.level
                          )}
                        />

                      </div>

                      <div className="w-24 shrink-0 text-right text-[11px] font-semibold text-zinc-700">
                        {area.price}
                      </div>

                    </div>
                  )
                )}

              </div>

              <p className="mt-3 text-[9px] leading-relaxed text-zinc-400">
                Illustrative figures for the interface only. They are not live market quotations.
              </p>

            </div>
          </div>
        </section>

        {/* ===================================================
            RIGHT AI ASSISTANT
        =================================================== */}

        <section className="flex min-h-0 w-1/2 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">

          {/* Assistant header */}

          <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50/40 px-5">

            <div className="flex items-center gap-2">

              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <h4 className="text-xs font-bold tracking-tight text-zinc-800">
                Deal Strategy Assistant
              </h4>

            </div>

            

          </div>

          {/* Messages */}

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">

            {loadingHistory ? (
              <div className="flex items-center gap-2 text-xs text-zinc-400">

                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" />

                Thinking...

              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500">
                Ask AI anything about this lead.
              </div>
            ) : (
              messages.map(
                (
                  chatMessage,
                  index
                ) => {

                  const isUser =
                    chatMessage.role ===
                    "user";

                  const alignmentClass =
                    isUser
                      ? "justify-end"
                      : "justify-start";

                  const bubbleClass =
                    isUser
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm border border-zinc-200/60 bg-zinc-100 text-zinc-800";

                  return (
                    <div
                      key={`${chatMessage.role}-${index}`}
                      className={`flex ${alignmentClass}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${bubbleClass}`}
                      >
                        {isUser
                          ? chatMessage.content
                          : renderAIText(
                              chatMessage.content
                            )}
                      </div>
                    </div>
                  );
                }
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

          {/* Error */}

          {error && (
            <div className="mx-4 mb-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Consumable prompts */}

          {quickPrompts.length > 0 && (
            <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-t border-zinc-100 bg-zinc-50/50 px-4 py-2">

              {quickPrompts.map(
                (prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() =>
                      usePrompt(
                        prompt
                      )
                    }
                    className="whitespace-nowrap rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-600 transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95"
                  >
                    {prompt}
                  </button>
                )
              )}

            </div>
          )}

          {/* Input */}

          <form
            onSubmit={
              handleSend
            }
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
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={
                sending ||
                !input.trim()
              }
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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