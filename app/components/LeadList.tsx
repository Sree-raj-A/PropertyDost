"use client";

import { useEffect, useMemo, useState } from "react";
import { DEMO_PROFILE } from "../lib/demo-profile";

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
};

type Stage = {
  id: string;
  title: string;
};

export default function LeadList({
  onSelectLead,
  salespersonName,
  onLogout,
}: {
  onSelectLead: (lead: Lead) => void;
  salespersonName: string;
  onLogout: () => void;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [stages, setStages] = useState<Stage[]>([
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
  ]);

  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState<
    "recency" | "urgency" | "proximity"
  >("recency");

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

  /* =========================================================
     LOAD LEADS
  ========================================================= */

  const loadLeads = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await fetch("/api/leads", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to load leads."
        );
      }

      const mapped: Lead[] = (
        result.leads ?? []
      ).map((lead: any) => ({
        id: Number(lead.id),
        name: lead.name || "Unnamed Lead",

        aiTitle:
          lead.ai_title || undefined,

        stage:
          lead.stage || "stage-new",

        priority:
          lead.priority === "Urgent" ||
          lead.priority === "Warm" ||
          lead.priority === "Cool"
            ? lead.priority
            : "Cool",

        urgency: Math.min(
          5,
          Math.max(
            1,
            Number(lead.urgency ?? 3)
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
          lead.key_requirements || "",

        objections:
          lead.objections || "",

        recommendedNextAction:
          lead.recommended_next_action ||
          "",

        suggestedResponse:
          lead.suggested_response ||
          "",

        distanceKm:
          Number(
            lead.distance_km ??
              999999
          ),

        createdAt: lead.created_at
          ? new Date(
              lead.created_at
            ).getTime()
          : Date.now(),
      }));

      setLeads(mapped);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();

    const handleLeadCreated = () => {
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

  /* =========================================================
     MONEY PARSER
  ========================================================= */

  const parseMoney = (
    value: string
  ) => {
    const text = value
      .replace(/,/g, "")
      .replace(/₹/g, "")
      .replace(/\$/g, "")
      .replace(/€/g, "")
      .trim()
      .toLowerCase();

    const number = parseFloat(text);

    if (!Number.isFinite(number)) {
      return 0;
    }

    if (
      text.includes("cr") ||
      text.includes("crore")
    ) {
      return number * 10_000_000;
    }

    if (
      text.includes("lakh") ||
      text.includes("lac")
    ) {
      return number * 100_000;
    }

    if (text.includes("m")) {
      return number * 1_000_000;
    }

    if (text.includes("k")) {
      return number * 1_000;
    }

    return number;
  };

  const maxMoney = Math.max(
    ...leads.map((lead) =>
      parseMoney(lead.budget)
    ),
    1
  );

  /* =========================================================
     FILTER + SORT
  ========================================================= */

  const filteredLeads =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return [...leads]
        .filter((lead) => {
          const matchesSearch =
            !query ||
            lead.name
              .toLowerCase()
              .includes(query) ||
            (lead.aiTitle ?? "")
              .toLowerCase()
              .includes(query) ||
            lead.location
              .toLowerCase()
              .includes(query) ||
            lead.propertyType
              .toLowerCase()
              .includes(query) ||
            lead.snippet
              .toLowerCase()
              .includes(query);

          const matchesPriority =
            filterPriority === "All" ||
            lead.priority ===
              filterPriority;

          const matchesStage =
            filterStage === "All" ||
            lead.stage === filterStage;

          return (
            matchesSearch &&
            matchesPriority &&
            matchesStage
          );
        })
        .sort((a, b) => {
          if (
            sortBy === "urgency"
          ) {
            return (
              b.urgency -
              a.urgency
            );
          }

          if (
            sortBy === "proximity"
          ) {
            const aSameLocation =
              a.location
                .toLowerCase()
                .includes(
                  DEMO_PROFILE.location.toLowerCase()
                );

            const bSameLocation =
              b.location
                .toLowerCase()
                .includes(
                  DEMO_PROFILE.location.toLowerCase()
                );

            if (
              aSameLocation !==
              bSameLocation
            ) {
              return aSameLocation
                ? -1
                : 1;
            }

            return (
              (a.distanceKm ??
                999999) -
              (b.distanceKm ??
                999999)
            );
          }

          return (
            b.createdAt -
            a.createdAt
          );
        });
    }, [
      leads,
      search,
      sortBy,
      filterPriority,
      filterStage,
    ]);

  /* =========================================================
     FILTER CHIPS
  ========================================================= */

  const activeFilters = [
    filterPriority !== "All"
      ? {
          label: `Priority: ${filterPriority}`,
          clear: () =>
            setFilterPriority(
              "All"
            ),
        }
      : null,

    filterStage !== "All"
      ? {
          label: `Stage: ${
            stages.find(
              (stage) =>
                stage.id ===
                filterStage
            )?.title ?? ""
          }`,
          clear: () =>
            setFilterStage("All"),
        }
      : null,
  ].filter(Boolean) as {
    label: string;
    clear: () => void;
  }[];

  /* =========================================================
     STAGES
  ========================================================= */

  const renameStage = (
    stageId: string,
    title: string
  ) => {
    const clean =
      title.trim();

    if (!clean) {
      setEditingStageId(null);
      return;
    }

    setStages((current) =>
      current.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              title: clean,
            }
          : stage
      )
    );

    setEditingStageId(null);
    setMenuOpen(null);
  };

  const addStage = () => {
    setStages((current) => [
      ...current,
      {
        id: `stage-${Date.now()}`,
        title: "New Stage",
      },
    ]);
  };

  const deleteStage = (
    stage: Stage
  ) => {
    if (stages.length <= 1) {
      window.alert(
        "At least one stage must remain."
      );
      return;
    }

    const replacement =
      stages.find(
        (item) =>
          item.id !== stage.id
      );

    if (!replacement) return;

    const affected =
      leads.filter(
        (lead) =>
          lead.stage === stage.id
      );

    const confirmed =
      window.confirm(
        affected.length
          ? `"${stage.title}" contains ${affected.length} lead${affected.length === 1 ? "" : "s"}. Move them to "${replacement.title}" and delete this stage?`
          : `Delete "${stage.title}"?`
      );

    if (!confirmed) return;

    setLeads((current) =>
      current.map((lead) =>
        lead.stage === stage.id
          ? {
              ...lead,
              stage:
                replacement.id,
            }
          : lead
      )
    );

    setStages((current) =>
      current.filter(
        (item) =>
          item.id !== stage.id
      )
    );

    if (
      filterStage === stage.id
    ) {
      setFilterStage("All");
    }

    setMenuOpen(null);
  };

  /* =========================================================
     DRAG + DROP
  ========================================================= */

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    leadId: number
  ) => {
    setDraggedLeadId(leadId);

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      String(leadId)
    );
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
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

    setDraggedLeadId(null);

    if (!leadId) return;

    const lead =
      leads.find(
        (item) =>
          item.id === leadId
      );

    if (
      !lead ||
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

    if (!to) return;

    const confirmed =
      window.confirm(
        `Move "${lead.aiTitle || lead.name}" from "${from?.title ?? "Unknown"}" to "${to.title}"?`
      );

    if (!confirmed) return;

    setLeads((current) =>
      current.map((item) =>
        item.id === leadId
          ? {
              ...item,
              stage:
                destinationStageId,
            }
          : item
      )
    );
  };

  /* =========================================================
     GRID
  ========================================================= */

  const gridTemplateColumns =
    addStageHovered
      ? `repeat(${stages.length + 1}, minmax(0, 1fr))`
      : `repeat(${stages.length}, minmax(0, 1fr)) 40px`;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-zinc-50 font-sans">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="shrink-0 border-b border-zinc-200 bg-white px-7 py-4">
        <div className="flex items-center gap-5">
          <h2 className="whitespace-nowrap text-lg font-bold text-zinc-900">
            Deals Pipeline
          </h2>

          <div className="relative max-w-[620px] flex-1">
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
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              className="
                w-full
                rounded-full
                border
                border-transparent
                bg-zinc-100
                py-2.5
                pl-11
                pr-4
                text-sm
                text-zinc-900
                outline-none
                placeholder:text-zinc-400
                focus:border-blue-500
                focus:bg-white
                focus:ring-2
                focus:ring-blue-100
              "
              placeholder="Search leads..."
            />
          </div>

          {/* =================================================
              PROFILE
          ================================================= */}

          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() =>
                setProfileOpen(
                  (value) => !value
                )
              }
              className="
                flex
                items-center
                gap-2.5
                rounded-xl
                px-2
                py-1.5
                hover:bg-zinc-100
              "
            >
              <div className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-blue-600
                text-sm
                font-bold
                text-white
              ">
                {salespersonName
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div className="hidden text-left xl:block">
                <div className="text-sm font-semibold text-zinc-900">
                  {salespersonName}
                </div>

                <div className="text-[11px] text-zinc-500">
                  Sales Executive
                </div>
              </div>
            </button>

            {profileOpen && (
              <div className="
                absolute
                right-0
                top-12
                z-50
                w-52
                rounded-xl
                border
                border-zinc-200
                bg-white
                p-1.5
                shadow-xl
              ">
                <div className="px-3 py-2">
                  <div className="text-sm font-semibold text-zinc-900">
                    {salespersonName}
                  </div>

                  <div className="text-xs text-zinc-500">
                    Sales Executive
                  </div>

                  <div className="mt-1 text-[11px] text-zinc-400">
                    {DEMO_PROFILE.location}
                  </div>
                </div>

                <div className="my-1 border-t border-zinc-100" />

                <button
                  type="button"
                  onClick={onLogout}
                  className="
                    w-full
                    rounded-lg
                    px-3
                    py-2
                    text-left
                    text-sm
                    font-medium
                    text-red-600
                    hover:bg-red-50
                  "
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================
            SORT + FILTER
        =================================================== */}

        <div className="mt-3 flex items-center gap-2">
          <span className="mr-1 text-sm font-semibold text-zinc-500">
            Sort by
          </span>

          {(
            [
              ["recency", "Recency"],
              ["urgency", "Urgency"],
              ["proximity", "Proximity"],
            ] as const
          ).map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setSortBy(value)
                }
                className={`
                  rounded-lg
                  border
                  px-3.5
                  py-1.5
                  text-sm
                  font-semibold
                  ${
                    sortBy === value
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }
                `}
              >
                {label}
              </button>
            )
          )}

          <div className="relative ml-2">
            <button
              type="button"
              onClick={() =>
                setFilterOpen(
                  (value) => !value
                )
              }
              className={`
                rounded-lg
                border
                px-3.5
                py-1.5
                text-sm
                font-semibold
                ${
                  filterOpen
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-600"
                }
              `}
            >
              Filter ▾
            </button>

            {filterOpen && (
              <div className="
                absolute
                left-0
                top-10
                z-50
                w-64
                rounded-xl
                border
                border-zinc-200
                bg-white
                p-4
                shadow-xl
              ">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Priority
                </label>

                <select
                  value={filterPriority}
                  onChange={(event) =>
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
                  value={filterStage}
                  onChange={(event) =>
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
                    (stage) => (
                      <option
                        key={stage.id}
                        value={stage.id}
                      >
                        {stage.title}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}
          </div>

          {activeFilters.map(
            (filter) => (
              <div
                key={filter.label}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-blue-200
                  bg-blue-50
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-blue-700
                "
              >
                {filter.label}

                <button
                  type="button"
                  onClick={
                    filter.clear
                  }
                  className="
                    flex
                    h-4
                    w-4
                    items-center
                    justify-center
                    rounded-full
                    hover:bg-blue-200
                  "
                >
                  ×
                </button>
              </div>
            )
          )}
        </div>
      </header>

      {/* =====================================================
          BOARD
      ===================================================== */}

      <main className="relative min-h-0 flex-1 overflow-hidden p-6">
        {loading && (
          <div className="
            absolute
            inset-0
            z-40
            flex
            items-center
            justify-center
            bg-zinc-50/80
          ">
            <div className="
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-zinc-200
              bg-white
              px-5
              py-3
              text-sm
              font-semibold
              text-zinc-600
              shadow
            ">
              <span className="
                h-4
                w-4
                animate-spin
                rounded-full
                border-2
                border-zinc-300
                border-t-blue-600
              " />
              Loading leads...
            </div>
          </div>
        )}

        {!loading && loadError && (
          <div className="
            absolute
            inset-0
            z-40
            flex
            items-center
            justify-center
            bg-zinc-50
          ">
            <div className="
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-5
              py-4
              text-sm
              text-red-700
            ">
              <div className="font-bold">
                Could not load leads
              </div>

              <div className="mt-1">
                {loadError}
              </div>

              <button
                type="button"
                onClick={loadLeads}
                className="
                  mt-3
                  rounded-lg
                  bg-red-600
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-white
                "
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div
          className="grid h-full min-h-0 w-full gap-5"
          style={{
            gridTemplateColumns:
              gridTemplateColumns,
            transition:
              "grid-template-columns 650ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {stages.map(
            (stage) => {
              const stageLeads =
                filteredLeads.filter(
                  (lead) =>
                    lead.stage ===
                    stage.id
                );

              return (
                <section
                  key={stage.id}
                  className="
                    flex
                    min-h-0
                    min-w-0
                    flex-col
                    overflow-hidden
                    rounded-xl
                    border
                    border-zinc-200
                  "
                  onDragOver={(event) =>
                    event.preventDefault()
                  }
                  onDrop={(event) =>
                    handleDrop(
                      event,
                      stage.id
                    )
                  }
                >
                  <div className="
                    relative
                    shrink-0
                    bg-zinc-200/70
                    px-4
                    py-3
                  ">
                    {editingStageId ===
                    stage.id ? (
                      <input
                        autoFocus
                        defaultValue={
                          stage.title
                        }
                        onBlur={(event) =>
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
                        className="
                          w-[80%]
                          rounded-md
                          border
                          border-blue-400
                          bg-white
                          px-2
                          py-1
                          text-base
                          font-bold
                          text-zinc-900
                          outline-none
                        "
                      />
                    ) : (
                      <>
                        <h3 className="
                          truncate
                          pr-8
                          text-base
                          font-bold
                          text-zinc-900
                        ">
                          {
                            stage.title
                          }
                        </h3>

                        <p className="
                          mt-1
                          text-sm
                          text-zinc-500
                        ">
                          {
                            stageLeads.length
                          }{" "}
                          {stageLeads.length ===
                          1
                            ? "lead"
                            : "leads"}
                        </p>
                      </>
                    )}

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
                      className="
                        absolute
                        right-3
                        top-3
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        text-lg
                        font-bold
                        text-zinc-700
                        hover:bg-zinc-300
                      "
                    >
                      ⋮
                    </button>

                    {menuOpen ===
                      stage.id && (
                      <div className="
                        absolute
                        right-3
                        top-12
                        z-50
                        w-36
                        rounded-xl
                        border
                        border-zinc-200
                        bg-white
                        p-1.5
                        shadow-xl
                      ">
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
                          className="
                            w-full
                            rounded-lg
                            px-3
                            py-2
                            text-left
                            text-sm
                            font-medium
                            text-zinc-900
                            hover:bg-zinc-100
                          "
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
                          className="
                            w-full
                            rounded-lg
                            px-3
                            py-2
                            text-left
                            text-sm
                            font-medium
                            text-red-600
                            hover:bg-red-50
                          "
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="
                    min-h-0
                    flex-1
                    space-y-3
                    overflow-y-auto
                    bg-zinc-100/60
                    p-3
                  ">
                    {stageLeads.map(
                      (lead) => {
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
                            key={lead.id}
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
                            className={`
                              cursor-grab
                              rounded-xl
                              border
                              border-zinc-200
                              p-4
                              shadow-sm
                              transition-all
                              hover:border-blue-400
                              hover:shadow-md
                              active:cursor-grabbing
                              ${
                                draggedLeadId ===
                                lead.id
                                  ? "opacity-50"
                                  : ""
                              }
                            `}
                          >
                            <div className="
                              mb-3
                              flex
                              items-center
                              gap-2
                            ">
                              <div
                                className={`
                                  h-2
                                  w-10
                                  rounded-full
                                  ${
                                    lead.urgency >=
                                    5
                                      ? "bg-red-500"
                                      : lead.urgency >=
                                        4
                                      ? "bg-amber-400"
                                      : lead.urgency >=
                                        3
                                      ? "bg-blue-500"
                                      : "bg-zinc-300"
                                  }
                                `}
                              />

                              <span className="
                                text-xs
                                font-bold
                                text-zinc-500
                              ">
                                U
                                {
                                  lead.urgency
                                }
                              </span>
                            </div>

                            <h4 className="
                              line-clamp-2
                              text-[15px]
                              font-bold
                              leading-snug
                              text-zinc-900
                            ">
                              {lead.aiTitle ||
                                lead.name}
                            </h4>

                            <p className="
                              mt-1
                              text-xs
                              font-medium
                              text-zinc-500
                            ">
                              {lead.name}
                            </p>

                            <p className="
                              mt-2
                              line-clamp-3
                              text-sm
                              leading-relaxed
                              text-zinc-500
                            ">
                              {lead.snippet}
                            </p>

                            <div className="
                              mt-4
                              flex
                              items-center
                              justify-between
                              gap-3
                              border-t
                              border-zinc-100
                              pt-3
                            ">
                              <span className="
                                whitespace-nowrap
                                text-sm
                                font-bold
                                text-zinc-700
                              ">
                                {lead.budget}
                              </span>

                              <span className="
                                min-w-0
                                truncate
                                text-right
                                text-xs
                                font-medium
                                text-zinc-500
                              ">
                                {lead.location}
                              </span>
                            </div>
                          </article>
                        );
                      }
                    )}

                    {stageLeads.length ===
                      0 && (
                      <div className="
                        flex
                        h-24
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-dashed
                        border-zinc-300
                        text-sm
                        text-zinc-400
                      ">
                        Drop a lead here
                      </div>
                    )}
                  </div>
                </section>
              );
            }
          )}

          {/* Add stage lane */}

          <button
            type="button"
            onClick={addStage}
            onMouseEnter={() =>
              setAddStageHovered(true)
            }
            onMouseLeave={() =>
              setAddStageHovered(false)
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
              <span className="
                whitespace-nowrap
                text-sm
                font-semibold
              ">
                +&nbsp;&nbsp;Add Stage
              </span>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}