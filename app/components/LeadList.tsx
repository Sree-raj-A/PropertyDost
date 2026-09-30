"use client";

import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";
import { DEMO_PROFILE } from "../lib/demo-profile";

type SortMode =
  | "recency"
  | "urgency"
  | "proximity";

type Lead = {
  id: number;
  name: string;
  aiTitle?: string;

  stage: string;

  priority: "Urgent" | "Warm" | "Cool";
  urgency: number;
  score: number;

  location: string;
  propertyType: string;
  budget: string;

  timeline?: string;

  snippet: string;
  summary?: string;
  intent?: string;

  keyRequirements?: string;
  objections?: string;

  recommendedNextAction?: string;
  suggestedResponse?: string;

  distanceKm?: number;
  createdAt: number;

  isDemo?: boolean;
};

type Stage = {
  id: string;
  title: string;
};

/* ============================================================
   DEMO MODE
============================================================ */

const DEMO_SORT_MODE = true;

/* ============================================================
   DEFAULT STAGES
============================================================ */

const DEFAULT_STAGES: Stage[] = [
  {
    id: "stage-new",
    title: "New Lead",
  },
  {
    id: "stage-contact",
    title: "Contact Made",
  },
  {
    id: "stage-viewing",
    title: "Viewing Scheduled",
  },
  {
    id: "stage-offer",
    title: "Offer Made",
  },
];

/* ============================================================
   DEMO LEADS
============================================================ */

const DEMO_SORT_LEADS: Lead[] = [
  {
    id: -1,
    name: "Rahul Menon",
    aiTitle: "3BHK Family Home • ₹1.85 Cr",
    stage: "stage-new",
    priority: "Urgent",
    urgency: 5,
    score: 96,
    location: "Indiranagar, Bengaluru",
    propertyType: "3BHK",
    budget: "₹1.85 Cr",
    timeline: "Immediate",
    snippet:
      "High-intent family buyer looking for a ready-to-move 3BHK.",
    summary:
      "High-intent family buyer looking for a ready-to-move 3BHK.",
    intent:
      "Buy a premium family home with immediate possession.",
    keyRequirements:
      "3BHK; parking; ready-to-move; metro access",
    objections:
      "Wants to compare two projects before committing.",
    recommendedNextAction:
      "Send two ready-to-move options and propose a site visit.",
    suggestedResponse:
      "I've shortlisted two ready-to-move 3BHK homes matching your requirements.",
    distanceKm: 6.2,
    createdAt:
      Date.now() - 15 * 60 * 1000,
    isDemo: true,
  },

  {
    id: -2,
    name: "Priya Shah",
    aiTitle: "2BHK Whitefield • ₹1.20 Cr",
    stage: "stage-new",
    priority: "Warm",
    urgency: 4,
    score: 86,
    location: "Whitefield, Bengaluru",
    propertyType: "2BHK",
    budget: "₹1.20 Cr",
    timeline: "1-2 months",
    snippet:
      "IT professional comparing newer communities near the tech corridor.",
    distanceKm: 17.4,
    createdAt:
      Date.now() - 4 * 60 * 60 * 1000,
    isDemo: true,
  },

  {
    id: -3,
    name: "Vikram Joshi",
    aiTitle: "Koramangala Investment • ₹1.65 Cr",
    stage: "stage-new",
    priority: "Warm",
    urgency: 4,
    score: 83,
    location: "Koramangala, Bengaluru",
    propertyType: "2.5BHK",
    budget: "₹1.65 Cr",
    timeline: "2-3 months",
    snippet:
      "Investor comparing rental yield and resale prospects.",
    distanceKm: 4.1,
    createdAt:
      Date.now() - 2 * 60 * 60 * 1000,
    isDemo: true,
  },

  {
    id: -4,
    name: "Meera Nair",
    aiTitle: "HSR Layout 2BHK • ₹98 L",
    stage: "stage-new",
    priority: "Cool",
    urgency: 2,
    score: 68,
    location: "HSR Layout, Bengaluru",
    propertyType: "2BHK",
    budget: "₹98 L",
    timeline: "3-6 months",
    snippet:
      "End-user buyer prioritizing commute and budget discipline.",
    distanceKm: 1.8,
    createdAt:
      Date.now() - 12 * 60 * 60 * 1000,
    isDemo: true,
  },

  {
    id: -5,
    name: "Aditya Kapoor",
    aiTitle: "Luxury 3BHK • ₹2.75 Cr",
    stage: "stage-contact",
    priority: "Urgent",
    urgency: 5,
    score: 94,
    location: "Indiranagar, Bengaluru",
    propertyType: "3BHK",
    budget: "₹2.75 Cr",
    timeline: "This month",
    snippet:
      "Already shortlisted and ready for physical viewing.",
    distanceKm: 7.2,
    createdAt:
      Date.now() - 6 * 60 * 60 * 1000,
    isDemo: true,
  },

  {
    id: -6,
    name: "Neha Iyer",
    aiTitle: "2BHK Sarjapur • ₹88 L",
    stage: "stage-contact",
    priority: "Warm",
    urgency: 3,
    score: 76,
    location: "Sarjapur Road, Bengaluru",
    propertyType: "2BHK",
    budget: "₹88 L",
    timeline: "1-3 months",
    snippet:
      "Interested buyer with a scheduled weekend viewing.",
    distanceKm: 10.6,
    createdAt:
      Date.now() - 18 * 60 * 60 * 1000,
    isDemo: true,
  },

  {
    id: -7,
    name: "Karan Bhat",
    aiTitle: "Whitefield 3BHK • ₹1.55 Cr",
    stage: "stage-viewing",
    priority: "Urgent",
    urgency: 5,
    score: 91,
    location: "Whitefield, Bengaluru",
    propertyType: "3BHK",
    budget: "₹1.55 Cr",
    timeline: "Immediate",
    snippet:
      "Offer discussion underway after successful site visit.",
    distanceKm: 15.3,
    createdAt:
      Date.now() - 9 * 60 * 60 * 1000,
    isDemo: true,
  },

  {
    id: -8,
    name: "Aisha Thomas",
    aiTitle: "2BHK Bellandur • ₹1.08 Cr",
    stage: "stage-viewing",
    priority: "Warm",
    urgency: 3,
    score: 79,
    location: "Bellandur, Bengaluru",
    propertyType: "2BHK",
    budget: "₹1.08 Cr",
    timeline: "2 weeks",
    snippet:
      "Negotiating price after viewing two shortlisted properties.",
    distanceKm: 11.2,
    createdAt:
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    isDemo: true,
  },

  {
    id: -9,
    name: "Sanjay Rao",
    aiTitle: "3BHK Hebbal • ₹1.42 Cr",
    stage: "stage-offer",
    priority: "Warm",
    urgency: 4,
    score: 88,
    location: "Hebbal, Bengaluru",
    propertyType: "3BHK",
    budget: "₹1.42 Cr",
    timeline: "2 weeks",
    snippet:
      "Buyer has submitted a preliminary offer.",
    distanceKm: 12.8,
    createdAt:
      Date.now() - 10 * 60 * 60 * 1000,
    isDemo: true,
  },

  {
    id: -10,
    name: "Aarav Krishnan",
    aiTitle: "2BHK Bellandur • ₹1.02 Cr",
    stage: "stage-offer",
    priority: "Cool",
    urgency: 2,
    score: 71,
    location: "Bellandur, Bengaluru",
    propertyType: "2BHK",
    budget: "₹1.02 Cr",
    timeline: "1 month",
    snippet:
      "Negotiating final price and parking allocation.",
    distanceKm: 11.4,
    createdAt:
      Date.now() - 24 * 60 * 60 * 1000,
    isDemo: true,
  },
];

/* ============================================================
   STAGE NORMALIZATION
============================================================ */

function normalizeStageId(
  value: string | undefined | null
): string {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  switch (raw) {
    case "new":
    case "new lead":
    case "stage new":
    case "stage new lead":
      return "stage-new";

    case "contact":
    case "contact made":
    case "stage contact":
    case "stage contact made":
      return "stage-contact";

    case "viewing":
    case "viewing scheduled":
    case "stage viewing":
    case "stage viewing scheduled":
      return "stage-viewing";

    case "offer":
    case "offer made":
    case "stage offer":
    case "stage offer made":
      return "stage-offer";

    default:
      return value ?? "stage-new";
  }
}

/* ============================================================
   DISTANCE FALLBACK
============================================================ */

function fallbackDistance(
  location: string
): number {
  const value =
    location.toLowerCase();

  if (value.includes("hsr")) {
    return 1.8;
  }

  if (
    value.includes("koramangala")
  ) {
    return 4.1;
  }

  if (
    value.includes("indiranagar")
  ) {
    return 7.2;
  }

  if (
    value.includes("bellandur")
  ) {
    return 11.2;
  }

  if (
    value.includes("sarjapur")
  ) {
    return 10.6;
  }

  if (
    value.includes("whitefield")
  ) {
    return 15.3;
  }

  if (
    value.includes("hebbal")
  ) {
    return 12.8;
  }

  return 999999;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function LeadList({
  onSelectLead,
  salespersonName,
  onLogout,
}: {
  onSelectLead: (lead: Lead) => void;
  salespersonName: string;
  onLogout: () => void;
}) {
  const [leads, setLeads] =
    useState<Lead[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [stages, setStages] =
    useState<Stage[]>(
      DEFAULT_STAGES
    );

  const [search, setSearch] =
    useState("");

  const [sortBy, setSortBy] =
    useState<SortMode>(
      "recency"
    );

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [filterPriority, setFilterPriority] =
    useState("All");

  const [filterStage, setFilterStage] =
    useState("All");

  const [menuOpen, setMenuOpen] =
    useState<string | null>(null);

  const [editingStageId, setEditingStageId] =
    useState<string | null>(null);

  const [draggedLeadId, setDraggedLeadId] =
    useState<number | null>(null);

  const [addStageHovered, setAddStageHovered] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  /*
   * undefined:
   *   first card = expanded by default
   *   remaining cards = collapsed by default
   *
   * true:
   *   expanded
   *
   * false:
   *   collapsed
   */
  const [cardExpanded, setCardExpanded] =
    useState<Record<number, boolean>>({});

  /* ==========================================================
     LOAD LEADS
  ========================================================== */

  const loadLeads =
    async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response =
          await fetch(
            "/api/leads",
            {
              cache:
                "no-store",
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ||
              "Failed to load leads."
          );
        }

        const mapped: Lead[] =
          (
            result.leads ?? []
          ).map(
            (lead: any) => ({
              id: Number(
                lead.id
              ),

              name:
                lead.name ||
                "Unnamed Lead",

              aiTitle:
                lead.ai_title ||
                undefined,

              stage:
                normalizeStageId(
                  lead.stage
                ),

              priority:
                lead.priority ===
                  "Urgent" ||
                lead.priority ===
                  "Warm" ||
                lead.priority ===
                  "Cool"
                  ? lead.priority
                  : "Cool",

              urgency:
                Math.min(
                  5,
                  Math.max(
                    1,
                    Number(
                      lead.urgency ??
                        3
                    )
                  )
                ),

              score: Number(
                lead.score ?? 0
              ),

              location:
                lead.location ||
                "Location not provided",

              propertyType:
                lead.property_requirement ||
                "Property requirement not provided",

              budget:
                lead.budget ||
                "Budget not provided",

              timeline:
                lead.timeline || "",

              snippet:
                lead.summary ||
                lead.original_message ||
                "No summary available.",

              summary:
                lead.summary || "",

              intent:
                lead.intent || "",

              keyRequirements:
                lead.key_requirements ||
                "",

              objections:
                lead.objections ||
                "",

              recommendedNextAction:
                lead.recommended_next_action ||
                "",

              suggestedResponse:
                lead.suggested_response ||
                "",

              distanceKm:
                Number.isFinite(
                  Number(
                    lead.distance_km
                  )
                )
                  ? Number(
                      lead.distance_km
                    )
                  : fallbackDistance(
                      lead.location ||
                        ""
                    ),

              createdAt:
                lead.created_at
                  ? new Date(
                      lead.created_at
                    ).getTime()
                  : Date.now(),
            })
          );

        let finalLeads =
          mapped;

        if (
          DEMO_SORT_MODE &&
          mapped.length < 8
        ) {
          const existingIds =
            new Set(
              mapped.map(
                (lead) =>
                  lead.id
              )
            );

          const missingDemo =
            DEMO_SORT_LEADS.filter(
              (lead) =>
                !existingIds.has(
                  lead.id
                )
            );

          finalLeads = [
            ...mapped,
            ...missingDemo,
          ];
        }

        setLeads(
          finalLeads
        );
      } catch (error) {
        console.error(
          "Load leads error:",
          error
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load leads."
        );

        setLeads(
          DEMO_SORT_MODE
            ? DEMO_SORT_LEADS
            : []
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadLeads();

    const handleLeadCreated =
      () => {
        loadLeads();
      };

    window.addEventListener(
      "masal-lead-created",
      handleLeadCreated
    );

    return () => {
      window.removeEventListener(
        "masal-lead-created",
        handleLeadCreated
      );
    };
  }, []);

  /* ==========================================================
     MONEY PARSER
  ========================================================== */

  const parseMoney = (
    value: string
  ) => {
    const text =
      value
        .replace(/,/g, "")
        .replace(/₹/g, "")
        .replace(/\$/g, "")
        .replace(/€/g, "")
        .trim()
        .toLowerCase();

    const number =
      parseFloat(text);

    if (
      !Number.isFinite(
        number
      )
    ) {
      return 0;
    }

    if (
      text.includes("cr") ||
      text.includes("crore")
    ) {
      return (
        number * 10_000_000
      );
    }

    if (
      text.includes("lakh") ||
      text.includes("lac")
    ) {
      return (
        number * 100_000
      );
    }

    if (
      text.includes("m")
    ) {
      return (
        number * 1_000_000
      );
    }

    if (
      text.includes("k")
    ) {
      return number * 1000;
    }

    return number;
  };

  const maxMoney =
    Math.max(
      ...leads.map(
        (lead) =>
          parseMoney(
            lead.budget
          )
      ),
      1
    );

  /* ==========================================================
     SORT
  ========================================================== */

  const compareLeads =
    (
      a: Lead,
      b: Lead
    ) => {
      if (
        sortBy ===
        "urgency"
      ) {
        const urgencyDifference =
          b.urgency -
          a.urgency;

        if (
          urgencyDifference !==
          0
        ) {
          return urgencyDifference;
        }

        return (
          b.score -
          a.score
        );
      }

      if (
        sortBy ===
        "proximity"
      ) {
        const aDistance =
          a.distanceKm ??
          fallbackDistance(
            a.location
          );

        const bDistance =
          b.distanceKm ??
          fallbackDistance(
            b.location
          );

        const distanceDifference =
          aDistance -
          bDistance;

        if (
          distanceDifference !==
          0
        ) {
          return distanceDifference;
        }

        return (
          b.urgency -
          a.urgency
        );
      }

      const recencyDifference =
        b.createdAt -
        a.createdAt;

      if (
        recencyDifference !==
        0
      ) {
        return recencyDifference;
      }

      return (
        b.score -
        a.score
      );
    };

  /* ==========================================================
     FILTERS
  ========================================================== */

  const visibleLeads =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return leads.filter(
        (lead) => {
          const searchable =
            [
              lead.name,
              lead.aiTitle,
              lead.location,
              lead.propertyType,
              lead.budget,
              lead.snippet,
              lead.summary,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !query ||
            searchable.includes(
              query
            );

          const matchesPriority =
            filterPriority ===
              "All" ||
            lead.priority ===
              filterPriority;

          const matchesStage =
            filterStage ===
              "All" ||
            lead.stage ===
              filterStage;

          return (
            matchesSearch &&
            matchesPriority &&
            matchesStage
          );
        }
      );
    }, [
      leads,
      search,
      filterPriority,
      filterStage,
    ]);

  /* ==========================================================
     ACTIVE FILTERS
  ========================================================== */

  const activeFilters = [
    filterPriority !==
    "All"
      ? {
          label: `Priority: ${filterPriority}`,
          clear: () =>
            setFilterPriority(
              "All"
            ),
        }
      : null,

    filterStage !==
    "All"
      ? {
          label: `Stage: ${
            stages.find(
              (stage) =>
                stage.id ===
                filterStage
            )?.title ??
            ""
          }`,
          clear: () =>
            setFilterStage(
              "All"
            ),
        }
      : null,
  ].filter(Boolean) as {
    label: string;
    clear: () => void;
  }[];

  /* ==========================================================
     STAGE MANAGEMENT
  ========================================================== */

  const renameStage =
    (
      stageId: string,
      title: string
    ) => {
      const clean =
        title.trim();

      if (!clean) {
        setEditingStageId(
          null
        );
        return;
      }

      setStages(
        (current) =>
          current.map(
            (stage) =>
              stage.id ===
              stageId
                ? {
                    ...stage,
                    title:
                      clean,
                  }
                : stage
          )
      );

      setEditingStageId(
        null
      );

      setMenuOpen(
        null
      );
    };

  const addStage =
    () => {
      setStages(
        (current) => [
          ...current,
          {
            id: `stage-${Date.now()}`,
            title:
              "New Stage",
          },
        ]
      );
    };

  const deleteStage =
    (stage: Stage) => {
      if (
        stages.length <=
        1
      ) {
        window.alert(
          "At least one stage must remain."
        );
        return;
      }

      const replacement =
        stages.find(
          (item) =>
            item.id !==
            stage.id
        );

      if (!replacement) {
        return;
      }

      const affected =
        leads.filter(
          (lead) =>
            lead.stage ===
            stage.id
        );

      const confirmed =
        window.confirm(
          affected.length
            ? `"${stage.title}" contains ${affected.length} lead${
                affected.length ===
                1
                  ? ""
                  : "s"
              }. Move them to "${replacement.title}" and delete this stage?`
            : `Delete "${stage.title}"?`
        );

      if (!confirmed) {
        return;
      }

      setLeads(
        (current) =>
          current.map(
            (lead) =>
              lead.stage ===
              stage.id
                ? {
                    ...lead,
                    stage:
                      replacement.id,
                  }
                : lead
          )
      );

      setStages(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              stage.id
          )
      );

      if (
        filterStage ===
        stage.id
      ) {
        setFilterStage(
          "All"
        );
      }

      setMenuOpen(
        null
      );
    };

  /* ==========================================================
     DRAG + DROP
  ========================================================== */

  const handleDragStart =
    (
      event: DragEvent<HTMLElement>,
      leadId: number
    ) => {
      setDraggedLeadId(
        leadId
      );

      event.dataTransfer.effectAllowed =
        "move";

      event.dataTransfer.setData(
        "text/plain",
        String(
          leadId
        )
      );
    };

  const handleDrop =
    (
      event: DragEvent<HTMLElement>,
      destinationStageId: string
    ) => {
      event.preventDefault();

      const stored =
        event.dataTransfer.getData(
          "text/plain"
        );

      const leadId =
        draggedLeadId ??
        (stored
          ? Number(stored)
          : null);

      setDraggedLeadId(
        null
      );

      if (
        leadId ===
          null ||
        !Number.isFinite(
          leadId
        )
      ) {
        return;
      }

      const lead =
        leads.find(
          (item) =>
            item.id ===
            leadId
        );

      if (!lead) {
        return;
      }

      if (
        lead.stage ===
        destinationStageId
      ) {
        return;
      }

      const from =
        stages.find(
          (stage) =>
            stage.id ===
            lead.stage
        );

      const to =
        stages.find(
          (stage) =>
            stage.id ===
            destinationStageId
        );

      if (!to) {
        return;
      }

      const confirmed =
        window.confirm(
          `Move "${
            lead.aiTitle ||
            lead.name
          }" from "${
            from?.title ??
            "Unknown"
          }" to "${
            to.title
          }"?`
        );

      if (!confirmed) {
        return;
      }

      setLeads(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              leadId
                ? {
                    ...item,
                    stage:
                      destinationStageId,
                  }
                : item
          )
      );
    };

  /* ==========================================================
     CARD TOGGLE
  ========================================================== */

  const toggleCard =
    (
      event: MouseEvent<HTMLButtonElement>,
      leadId: number,
      currentExpanded: boolean
    ) => {
      event.stopPropagation();

      setCardExpanded(
        (current) => ({
          ...current,
          [leadId]:
            !currentExpanded,
        })
      );
    };

  /* ==========================================================
     GRID
  ========================================================== */

  const gridTemplateColumns =
    addStageHovered
      ? `repeat(${stages.length + 1}, minmax(0, 1fr))`
      : `repeat(${stages.length}, minmax(0, 1fr)) 40px`;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-zinc-50 font-sans">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="shrink-0 border-b border-zinc-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">

          {/* SEARCH */}

          <div className="min-w-0 flex-1">
            <div className="relative w-full max-w-[720px]">
              <svg
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.2-5.2m0 0A7.5 7.5 0 1 0 5.2 5.2a7.5 7.5 0 0 0 10.6 10.6Z"
                />
              </svg>

              <input
                type="search"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-full border border-transparent bg-zinc-100 py-2 pl-11 pr-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="Search leads..."
              />
            </div>
          </div>

          {/* SORT */}

          <div className="flex shrink-0 items-center gap-1.5">
            {(
              [
                [
                  "recency",
                  "Recency",
                ],
                [
                  "urgency",
                  "Urgency",
                ],
                [
                  "proximity",
                  "Proximity",
                ],
              ] as const
            ).map(
              ([
                value,
                label,
              ]) => (
                <button
                  key={
                    value
                  }
                  type="button"
                  onClick={() =>
                    setSortBy(
                      value
                    )
                  }
                  className={[
                    "h-10 rounded-lg border px-3.5 text-sm font-semibold transition-colors",
                    sortBy ===
                    value
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
                  ].join(
                    " "
                  )}
                >
                  {
                    label
                  }
                </button>
              )
            )}
          </div>

          {/* FILTER */}

          <div className="relative shrink-0">
            <button
              type="button"
              aria-label="Filter leads"
              title="Filter"
              onClick={() =>
                setFilterOpen(
                  (value) =>
                    !value
                )
              }
              className={[
                "flex h-10 w-10 items-center justify-center rounded-lg border transition-colors",
                filterOpen
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
              ].join(
                " "
              )}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 5h16l-6.5 7.2V18l-3 1.5v-7.3L4 5Z"
                />
              </svg>
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl">

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Priority
                </label>

                <select
                  value={
                    filterPriority
                  }
                  onChange={(
                    event
                  ) =>
                    setFilterPriority(
                      event.target.value
                    )
                  }
                  className="mb-4 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                >
                  <option value="All">
                    All
                  </option>

                  <option value="Urgent">
                    Urgent
                  </option>

                  <option value="Warm">
                    Warm
                  </option>

                  <option value="Cool">
                    Cool
                  </option>
                </select>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Engagement Stage
                </label>

                <select
                  value={
                    filterStage
                  }
                  onChange={(
                    event
                  ) =>
                    setFilterStage(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                >
                  <option value="All">
                    All
                  </option>

                  {stages.map(
                    (
                      stage
                    ) => (
                      <option
                        key={
                          stage.id
                        }
                        value={
                          stage.id
                        }
                      >
                        {
                          stage.title
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            )}
          </div>

          {/* PROFILE */}

          <div className="relative ml-1 shrink-0">
            <button
              type="button"
              onClick={() =>
                setProfileOpen(
                  (value) =>
                    !value
                )
              }
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-zinc-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {salespersonName
                  .slice(
                    0,
                    2
                  )
                  .toUpperCase()}
              </div>

              <div className="hidden text-left xl:block">
                <div className="text-sm font-semibold text-zinc-900">
                  {
                    salespersonName
                  }
                </div>

                <div className="text-[11px] text-zinc-500">
                  Sales Executive
                </div>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl">
                <div className="px-3 py-2">

                  <div className="text-sm font-semibold text-zinc-900">
                    {
                      salespersonName
                    }
                  </div>

                  <div className="text-xs text-zinc-500">
                    Sales Executive
                  </div>

                  <div className="mt-1 text-[11px] text-zinc-400">
                    {
                      DEMO_PROFILE.location
                    }
                  </div>
                </div>

                <div className="my-1 border-t border-zinc-100" />

                <button
                  type="button"
                  onClick={
                    onLogout
                  }
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ACTIVE FILTERS */}

        {activeFilters.length >
          0 && (
          <div className="mt-2 flex items-center gap-2">
            {activeFilters.map(
              (filter) => (
                <div
                  key={
                    filter.label
                  }
                  className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                >
                  {
                    filter.label
                  }

                  <button
                    type="button"
                    onClick={
                      filter.clear
                    }
                    className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-blue-200"
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </header>

      {/* ======================================================
          BOARD
      ====================================================== */}

      <main className="relative min-h-0 flex-1 overflow-hidden p-6">

        {loading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-50/80">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-600 shadow">

              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" />

              Loading leads...
            </div>
          </div>
        )}

        {!loading &&
          loadError &&
          !DEMO_SORT_MODE && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-50">
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

                <div className="font-bold">
                  Could not load leads
                </div>

                <div className="mt-1">
                  {
                    loadError
                  }
                </div>

                <button
                  type="button"
                  onClick={
                    loadLeads
                  }
                  className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

        <div
          className="grid h-full min-h-0 w-full gap-5"
          style={{
            gridTemplateColumns,
            transition:
              "grid-template-columns 750ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >

          {/* ==================================================
              STAGES
          ================================================== */}

          {stages.map(
            (stage) => {
              const stageLeads =
                [
                  ...visibleLeads.filter(
                    (lead) =>
                      lead.stage ===
                      stage.id
                  ),
                ].sort(
                  compareLeads
                );

              return (
                <section
                  key={
                    stage.id
                  }
                  className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-200"
                  onDragOver={(
                    event
                  ) =>
                    event.preventDefault()
                  }
                  onDrop={(
                    event
                  ) =>
                    handleDrop(
                      event,
                      stage.id
                    )
                  }
                >

                  {/* ========================================
                      THIN COLUMN HEADER
                  ======================================== */}

                  <div className="relative flex h-[64px] shrink-0 items-center justify-between bg-zinc-200/70 px-4">

                    <div className="min-w-0">
                      {editingStageId ===
                      stage.id ? (
                        <input
                          autoFocus
                          defaultValue={
                            stage.title
                          }
                          onBlur={(
                            event
                          ) =>
                            renameStage(
                              stage.id,
                              event
                                .currentTarget
                                .value
                            )
                          }
                          onKeyDown={(
                            event
                          ) => {
                            if (
                              event.key ===
                              "Enter"
                            ) {
                              renameStage(
                                stage.id,
                                event
                                  .currentTarget
                                  .value
                              );
                            }

                            if (
                              event.key ===
                              "Escape"
                            ) {
                              setEditingStageId(
                                null
                              );
                            }
                          }}
                          className="w-[80%] rounded-md border border-blue-400 bg-white px-2 py-1 text-sm font-medium text-zinc-900 outline-none"
                        />
                      ) : (
                        <h3 className="truncate pr-8 text-[17px] font-medium text-zinc-900">
                          {
                            stage.title
                          }
                        </h3>
                      )}

                      <p className="mt-0.5 text-xs text-zinc-500">
                        {
                          stageLeads.length
                        }{" "}
                        {
                          stageLeads.length ===
                          1
                            ? "lead"
                            : "leads"
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setMenuOpen(
                          menuOpen ===
                            stage.id
                            ? null
                            : stage.id
                        )
                      }
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-lg font-bold text-zinc-700 hover:bg-zinc-300"
                    >
                      ⋮
                    </button>

                    {menuOpen ===
                      stage.id && (
                      <div className="absolute right-3 top-11 z-50 w-36 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl">

                        <button
                          type="button"
                          onClick={() => {
                            setEditingStageId(
                              stage.id
                            );

                            setMenuOpen(
                              null
                            );
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                        >
                          Rename
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteStage(
                              stage
                            )
                          }
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ========================================
                      COLUMN BODY
                  ======================================== */}

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-zinc-100/60 p-3">

                    {stageLeads.map(
                      (
                        lead,
                        index
                      ) => {

                        /*
                         * Top card starts expanded.
                         * Every other card starts collapsed.
                         * After interaction, explicit state wins.
                         */
                        const isExpanded =
                          cardExpanded[
                            lead.id
                          ] ??
                          index ===
                            0;

                        const moneyRatio =
                          parseMoney(
                            lead.budget
                          ) /
                          maxMoney;

                        const urgencyRatio =
                          lead.urgency /
                          5;

                        const goldAlpha =
                          0.035 +
                          moneyRatio *
                            0.14;

                        const redAlpha =
                          0.025 +
                          urgencyRatio *
                            0.12;

                        return (
                          <article
                            key={
                              lead.id
                            }
                            draggable
                            onDragStart={(
                              event
                            ) =>
                              handleDragStart(
                                event,
                                lead.id
                              )
                            }
                            onDragEnd={() =>
                              setDraggedLeadId(
                                null
                              )
                            }
                            onClick={() =>
                              onSelectLead(
                                lead
                              )
                            }
                            style={{
                              backgroundImage: `
                                linear-gradient(
                                  135deg,
                                  rgba(245,158,11,${goldAlpha}),
                                  rgba(239,68,68,${redAlpha}) 52%,
                                  rgba(255,255,255,0.98) 100%
                                )
                              `,
                            }}
                            className={[
                              "rounded-xl border border-zinc-200 shadow-sm transition-all",
                              "hover:border-blue-400 hover:shadow-md",
                              draggedLeadId ===
                              lead.id
                                ? "opacity-50"
                                : "",
                            ].join(
                              " "
                            )}
                          >

                            {/* ==================================
                                SINGLE TOP CARD ROW
                            ================================== */}

                            <div
                              className={
                                isExpanded
                                  ? "px-4 pt-4"
                                  : "px-3.5 py-3"
                              }
                            >
                              <div className="flex items-center gap-3">

                                {/* ONE PRIORITY PILL */}

                                <div className="flex shrink-0 items-center gap-2">
                                  <div
                                    className={[
                                      "h-2 w-10 rounded-full",
                                      lead.urgency >=
                                      5
                                        ? "bg-red-500"
                                        : lead.urgency >=
                                          4
                                        ? "bg-amber-400"
                                        : lead.urgency >=
                                          3
                                        ? "bg-blue-500"
                                        : "bg-zinc-300",
                                    ].join(
                                      " "
                                    )}
                                  />

                                  <span className="text-xs font-bold text-zinc-500">
                                    U
                                    {
                                      lead.urgency
                                    }
                                  </span>
                                </div>

                                {/* TITLE + NAME */}

                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-bold text-zinc-900">
                                    {
                                      lead.aiTitle ||
                                      lead.name
                                    }
                                  </div>

                                  <div className="truncate text-xs text-zinc-500">
                                    {
                                      lead.name
                                    }{" "}
                                    ·{" "}
                                    {
                                      lead.budget
                                    }
                                  </div>
                                </div>

                                {/* PERMANENT TOGGLE */}

                                <button
                                  type="button"
                                  aria-label={
                                    isExpanded
                                      ? "Collapse lead"
                                      : "Expand lead"
                                  }
                                  aria-expanded={
                                    isExpanded
                                  }
                                  onClick={(
                                    event
                                  ) =>
                                    toggleCard(
                                      event,
                                      lead.id,
                                      isExpanded
                                    )
                                  }
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white hover:text-blue-600"
                                >
                                  <svg
                                    className={[
                                      "h-4 w-4 transition-transform duration-200",
                                      isExpanded
                                        ? "rotate-90"
                                        : "",
                                    ].join(
                                      " "
                                    )}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="m9 18 6-6-6-6"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* ==================================
                                EXPANDED CONTENT

                                No duplicated title/name.
                                No second priority pill.
                                No demo label.
                            ================================== */}

                            {isExpanded && (
                              <div className="px-4 pb-4 pt-3">

                                <p className="text-sm leading-relaxed text-zinc-500">
                                  {
                                    lead.snippet
                                  }
                                </p>

                                <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">

                                  <span className="whitespace-nowrap text-sm font-bold text-zinc-700">
                                    {
                                      lead.budget
                                    }
                                  </span>

                                  <span className="min-w-0 truncate text-right text-xs font-medium text-zinc-500">
                                    {
                                      lead.location
                                    }
                                  </span>

                                </div>
                              </div>
                            )}
                          </article>
                        );
                      }
                    )}

                    {stageLeads.length ===
                      0 && (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-400">
                        Drop a lead here
                      </div>
                    )}
                  </div>
                </section>
              );
            }
          )}

          {/* ==================================================
              ADD STAGE
          ================================================== */}

          <button
            type="button"
            onClick={
              addStage
            }
            onMouseEnter={() =>
              setAddStageHovered(
                true
              )
            }
            onMouseLeave={() =>
              setAddStageHovered(
                false
              )
            }
            className="
              h-full
              min-h-0
              min-w-0
              w-full
              rounded-xl
              border-2
              border-dashed
              border-zinc-300
              bg-white
              text-zinc-500
              transition-colors
              duration-200
              hover:border-blue-400
              hover:bg-blue-50
              hover:text-blue-600
            "
          >
            {!addStageHovered ? (
              <span className="text-2xl">
                +
              </span>
            ) : (
              <span className="whitespace-nowrap text-sm font-semibold">
                +&nbsp;&nbsp;Add Stage
              </span>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}