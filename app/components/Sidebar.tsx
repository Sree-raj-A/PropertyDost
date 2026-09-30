"use client";

import { useEffect, useMemo, useState } from "react";

type Folder = {
  id: string;
  name: string;
};

type SidebarSection =
  | "urgent"
  | "saved"
  | "completed"
  | "cancelled"
  | null;

type FakeMessage = {
  role: "customer" | "assistant";
  text: string;
};

type FakeLead = {
  id: number;
  name: string;
  title: string;
  location: string;
  budget: string;
  status: string;
  score: number;
  lastMessage: string;
  chat: FakeMessage[];
};

const DEFAULT_FOLDERS: Folder[] = [
  {
    id: "commercial",
    name: "Commercial Lookups",
  },
  {
    id: "net-worth",
    name: "High Net Worth",
  },
  {
    id: "finance",
    name: "Pending Finance",
  },
];

/*
  These are deliberately different from the live leads.
*/

const URGENT_LEADS: FakeLead[] = [
  {
    id: 301,
    name: "Karan Rao",
    title: "Urgent 3BHK Search",
    location: "Indiranagar, Bengaluru",
    budget: "₹2.4 Cr",
    status: "Urgent",
    score: 96,
    lastMessage:
      "Can we view the property this afternoon?",
    chat: [
      {
        role: "customer",
        text:
          "We need to move very quickly.",
      },
      {
        role: "assistant",
        text:
          "I'll prioritize ready-to-move options that match the requirements.",
      },
      {
        role: "customer",
        text:
          "Please send me the shortlist first.",
      },
    ],
  },
  {
    id: 302,
    name: "Meera Shah",
    title: "Premium Whitefield Search",
    location: "Whitefield, Bengaluru",
    budget: "₹1.9 Cr",
    status: "Urgent",
    score: 91,
    lastMessage:
      "Please send the shortlist today.",
    chat: [
      {
        role: "customer",
        text:
          "We want to finalize something this week.",
      },
      {
        role: "assistant",
        text:
          "I'll prioritize the strongest Whitefield matches.",
      },
    ],
  },
  {
    id: 303,
    name: "Dev Menon",
    title: "Koramangala Investment",
    location: "Koramangala, Bengaluru",
    budget: "₹3.1 Cr",
    status: "Urgent",
    score: 89,
    lastMessage:
      "Looking for the investment comparison ASAP.",
    chat: [
      {
        role: "customer",
        text:
          "I need the numbers before tonight.",
      },
      {
        role: "assistant",
        text:
          "I'll prioritize the yield and resale comparison.",
      },
    ],
  },
];

const COMPLETED_LEADS: FakeLead[] = [
  {
    id: 501,
    name: "Nikhil Varma",
    title: "3BHK Koramangala Purchase",
    location: "Koramangala, Bengaluru",
    budget: "₹2.15 Cr",
    status: "Completed",
    score: 94,
    lastMessage:
      "We are happy with the property and would like to proceed.",
    chat: [
      {
        role: "customer",
        text:
          "The second property you showed us looks like the right fit.",
      },
      {
        role: "assistant",
        text:
          "I'll coordinate the final visit and documentation.",
      },
      {
        role: "customer",
        text:
          "Great. Let's proceed with the next steps.",
      },
    ],
  },
  {
    id: 502,
    name: "Lavanya Krishnan",
    title: "Whitefield 2BHK Purchase",
    location: "Whitefield, Bengaluru",
    budget: "₹1.28 Cr",
    status: "Completed",
    score: 88,
    lastMessage:
      "We'll move ahead with the shortlisted community.",
    chat: [
      {
        role: "customer",
        text:
          "The Whitefield option with lower maintenance looks best.",
      },
      {
        role: "assistant",
        text:
          "I'll prepare the final comparison and paperwork.",
      },
      {
        role: "customer",
        text:
          "That works for us.",
      },
    ],
  },
  {
    id: 503,
    name: "Aditya Menon",
    title: "Investment Property Search",
    location: "HSR Layout, Bengaluru",
    budget: "₹1.8 Cr",
    status: "Completed",
    score: 81,
    lastMessage:
      "Thanks, the rental-yield comparison was useful.",
    chat: [
      {
        role: "customer",
        text:
          "I prefer the one with better tenant demand.",
      },
      {
        role: "assistant",
        text:
          "I've sent the final investment comparison.",
      },
    ],
  },
];

const CANCELLED_LEADS: FakeLead[] = [
  {
    id: 601,
    name: "Neha Bhat",
    title: "HSR 2BHK Search",
    location: "HSR Layout, Bengaluru",
    budget: "₹1.05 Cr",
    status: "Cancelled",
    score: 66,
    lastMessage:
      "We have decided to postpone the purchase.",
    chat: [
      {
        role: "assistant",
        text:
          "I found several newer 2BHK communities within the stated budget.",
      },
      {
        role: "customer",
        text:
          "We'll probably wait until next year.",
      },
      {
        role: "assistant",
        text:
          "Understood. I'll keep the previous requirements on record.",
      },
    ],
  },
  {
    id: 602,
    name: "Riya Kapoor",
    title: "Sadhashivanagar 4BHK",
    location: "Sadhashivanagar, Bengaluru",
    budget: "₹6.8 Cr",
    status: "Cancelled",
    score: 58,
    lastMessage:
      "The timing isn't right for us anymore.",
    chat: [
      {
        role: "assistant",
        text:
          "I've prepared the premium inventory shortlist.",
      },
      {
        role: "customer",
        text:
          "We are putting the purchase on hold.",
      },
    ],
  },
];

const SAVED_LEADS: FakeLead[] = [
  {
    id: 701,
    name: "Priyanka Iyer",
    title: "Premium 3BHK Shortlist",
    location: "Indiranagar, Bengaluru",
    budget: "₹2.1 Cr",
    status: "Saved",
    score: 87,
    lastMessage:
      "Keep this shortlist for our next discussion.",
    chat: [
      {
        role: "assistant",
        text:
          "These three properties best match the requirements.",
      },
      {
        role: "customer",
        text:
          "Please keep these saved for now.",
      },
    ],
  },
  {
    id: 702,
    name: "Siddharth Rao",
    title: "Investment Property Options",
    location: "HSR Layout, Bengaluru",
    budget: "₹1.7 Cr",
    status: "Saved",
    score: 82,
    lastMessage:
      "I'll come back to these options next week.",
    chat: [
      {
        role: "assistant",
        text:
          "The strongest investment candidates are saved here.",
      },
    ],
  },
];

const DEFAULT_FOLDER_CONTENTS: Record<
  string,
  FakeLead[]
> = {
  commercial: [
    {
      id: 801,
      name: "Arvind Joshi",
      title: "Commercial Office Search",
      location: "Outer Ring Road, Bengaluru",
      budget: "₹4.2 Cr",
      status: "Saved",
      score: 79,
      lastMessage:
        "Need a comparison of the shortlisted buildings.",
      chat: [
        {
          role: "customer",
          text:
            "I'm comparing three office spaces.",
        },
        {
          role: "assistant",
          text:
            "I'll organize the comparison around rent, access and amenities.",
        },
      ],
    },
  ],
  "net-worth": [
    {
      id: 802,
      name: "Vivek Malhotra",
      title: "Luxury 4BHK Search",
      location: "Sadashivanagar, Bengaluru",
      budget: "₹7.5 Cr",
      status: "Saved",
      score: 92,
      lastMessage:
        "Keep these premium options shortlisted.",
      chat: [
        {
          role: "customer",
          text:
            "We prefer something very private.",
        },
        {
          role: "assistant",
          text:
            "I'll focus on low-density premium developments.",
        },
      ],
    },
  ],
  finance: [],
};

const STORAGE_KEY =
  "propertydost-folders";

const FOLDER_CONTENTS_KEY =
  "propertydost-folder-contents";

export default function Sidebar() {
  const [folders, setFolders] =
    useState<Folder[]>(
      DEFAULT_FOLDERS
    );

  const [folderContents, setFolderContents] =
    useState<
      Record<string, FakeLead[]>
    >(
      DEFAULT_FOLDER_CONTENTS
    );

  const [expandedSection, setExpandedSection] =
    useState<SidebarSection>(null);

  const [expandedFolders, setExpandedFolders] =
    useState<Record<string, boolean>>({});

  const [showFolderDialog, setShowFolderDialog] =
    useState(false);

  const [newFolderName, setNewFolderName] =
    useState("");

  const [selectedLead, setSelectedLead] =
    useState<FakeLead | null>(null);

  const [showStatistics, setShowStatistics] =
    useState(false);

  /* =========================================================
     LOAD PERSISTED FOLDERS
  ========================================================= */

  useEffect(() => {
    const storedFolders =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (storedFolders) {
      try {
        const parsed =
          JSON.parse(
            storedFolders
          );

        if (
          Array.isArray(parsed)
        ) {
          setFolders(parsed);
        }
      } catch {
        // Ignore malformed localStorage.
      }
    }

    const storedContents =
      localStorage.getItem(
        FOLDER_CONTENTS_KEY
      );

    if (storedContents) {
      try {
        const parsed =
          JSON.parse(
            storedContents
          );

        if (
          parsed &&
          typeof parsed === "object"
        ) {
          setFolderContents(
            parsed
          );
        }
      } catch {
        // Ignore malformed localStorage.
      }
    }
  }, []);

  /* =========================================================
     SAVE FOLDERS
  ========================================================= */

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(folders)
    );
  }, [folders]);

  useEffect(() => {
    localStorage.setItem(
      FOLDER_CONTENTS_KEY,
      JSON.stringify(
        folderContents
      )
    );
  }, [folderContents]);

  /* =========================================================
     EVENTS
  ========================================================= */

  function dispatchView(
    view: string
  ) {
    window.dispatchEvent(
      new CustomEvent(
        "masal-sidebar-view",
        {
          detail: view,
        }
      )
    );
  }

  /* =========================================================
     FOLDER OPERATIONS
  ========================================================= */

  function toggleFolder(
    folderId: string
  ) {
    setExpandedFolders(
      (current) => ({
        ...current,
        [folderId]:
          !current[folderId],
      })
    );
  }

  function createFolder() {
    const name =
      newFolderName.trim();

    if (!name) {
      return;
    }

    const id =
      `folder-${Date.now()}`;

    const folder: Folder = {
      id,
      name,
    };

    setFolders(
      (current) => [
        ...current,
        folder,
      ]
    );

    setFolderContents(
      (current) => ({
        ...current,
        [id]: [],
      })
    );

    setExpandedFolders(
      (current) => ({
        ...current,
        [id]: true,
      })
    );

    setNewFolderName("");
    setShowFolderDialog(false);
  }

  function deleteFolder(
    folderId: string
  ) {
    setFolders(
      (current) =>
        current.filter(
          (folder) =>
            folder.id !==
            folderId
        )
    );

    setFolderContents(
      (current) => {
        const next = {
          ...current,
        };

        delete next[folderId];

        return next;
      }
    );

    setExpandedFolders(
      (current) => {
        const next = {
          ...current,
        };

        delete next[folderId];

        return next;
      }
    );
  }

  /* =========================================================
     SECTION DATA
  ========================================================= */

  function sectionLeads(
    section: SidebarSection
  ) {
    if (
      section ===
      "urgent"
    ) {
      return URGENT_LEADS;
    }

    if (
      section ===
      "saved"
    ) {
      return SAVED_LEADS;
    }

    if (
      section ===
      "completed"
    ) {
      return COMPLETED_LEADS;
    }

    if (
      section ===
      "cancelled"
    ) {
      return CANCELLED_LEADS;
    }

    return [];
  }

  function toggleSection(
    section: SidebarSection
  ) {
    if (
      expandedSection ===
      section
    ) {
      setExpandedSection(
        null
      );

      return;
    }

    setExpandedSection(section);

    if (section) {
      dispatchView(section);
    }
  }

  /* =========================================================
     STATISTICS
  ========================================================= */

  function openStatistics() {
    setShowStatistics(true);
    setExpandedSection(null);
  }

  const totalArchived =
    COMPLETED_LEADS.length +
    CANCELLED_LEADS.length;

  const folderCount =
    folders.length;

  const stats = useMemo(
    () => ({
      totalLeads: 48,
      conversion: 31,
      pipeline: "₹42.8 Cr",
      avgScore: 84,
      analyses: 127,
      followUps: 94,
      responses: 63,
    }),
    []
  );

  return (
    <>
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="flex h-screen w-80 shrink-0 flex-col border-r border-zinc-200 bg-white">

        {/* BRAND */}

        <div className="flex h-20 shrink-0 items-center justify-between border-b border-zinc-200 px-5">

          <div>
            <div className="font-serif text-xl font-semibold italic text-zinc-900">
              PropertyDost
            </div>

            <div className="mt-0.5 text-[10px] text-zinc-400">
              Intelligent sales management
            </div>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
            onClick={() =>
              window.dispatchEvent(
                new Event(
                  "masal-toggle-sidebar"
                )
              )
            }
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

        </div>

        {/* SCROLLABLE MENU */}

        <div className="min-h-0 flex-1 overflow-y-auto">

          {/* ALL LEADS */}

          <button
            type="button"
            onClick={() => {
              setExpandedSection(
                null
              );

              dispatchView("all");
            }}
            className="flex w-full items-center gap-3 border-l-4 border-blue-600 bg-blue-600 px-5 py-3.5 text-left text-sm font-semibold text-white"
          >
            <span className="w-5 text-center">
              ▱
            </span>

            All Leads
          </button>

          {/* URGENT */}

          <button
            type="button"
            onClick={() =>
              toggleSection(
                "urgent"
              )
            }
            className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm font-medium text-zinc-600 hover:bg-red-50"
          >
            <span className="w-5 text-center text-red-500">
              ⚠
            </span>

            <span className="flex-1">
              Urgent
            </span>

            <span className="rounded-sm bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
              {URGENT_LEADS.length}
            </span>

            <span className="ml-1 text-zinc-400">
              {expandedSection ===
              "urgent"
                ? "⌃"
                : "⌄"}
            </span>
          </button>

          {expandedSection ===
          "urgent" ? (
            <InlineLeadSection
              leads={URGENT_LEADS}
              selectedLeadId={
                selectedLead?.id ??
                null
              }
              onSelect={
                setSelectedLead
              }
              emptyText="No urgent leads."
            />
          ) : null}

          {/* SAVED */}

          <button
            type="button"
            onClick={() =>
              toggleSection(
                "saved"
              )
            }
            className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <span className="w-5 text-center text-amber-500">
              ★
            </span>

            <span className="flex-1">
              Saved
            </span>

            <span className="text-zinc-400">
              {expandedSection ===
              "saved"
                ? "⌃"
                : "⌄"}
            </span>
          </button>

          {expandedSection ===
          "saved" ? (
            <div className="border-b border-zinc-200 bg-zinc-50/60">

              <InlineLeadSection
                leads={SAVED_LEADS}
                selectedLeadId={
                  selectedLead?.id ??
                  null
                }
                onSelect={
                  setSelectedLead
                }
                emptyText="No saved leads."
              />

              {/* FOLDERS */}

              <div className="border-t border-zinc-200 px-3 py-2">
                <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Folders
                </div>

                {folders.length ===
                0 ? (
                  <div className="rounded-lg px-2 py-3 text-center text-xs text-zinc-400">
                    No folders yet.
                  </div>
                ) : (
                  folders.map(
                    (folder) => {
                      const contents =
                        folderContents[
                          folder.id
                        ] ??
                        [];

                      const expanded =
                        Boolean(
                          expandedFolders[
                            folder.id
                          ]
                        );

                      return (
                        <div
                          key={
                            folder.id
                          }
                          className="mb-1 overflow-hidden rounded-lg border border-zinc-200 bg-white"
                        >
                          <div className="flex items-center">

                            <button
                              type="button"
                              onClick={() =>
                                toggleFolder(
                                  folder.id
                                )
                              }
                              className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left"
                            >
                              <span className="text-xs text-zinc-400">
                                {expanded
                                  ? "⌃"
                                  : "⌄"}
                              </span>

                              <span className="truncate text-xs font-semibold text-zinc-600">
                                {folder.name}
                              </span>

                              <span className="ml-auto rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400">
                                {
                                  contents.length
                                }
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteFolder(
                                  folder.id
                                )
                              }
                              className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                              title="Delete folder"
                              aria-label={`Delete ${folder.name}`}
                            >
                              🗑
                            </button>

                          </div>

                          {expanded ? (
                            <div className="border-t border-zinc-100 bg-zinc-50/60">

                              {contents.length ===
                              0 ? (
                                <div className="px-4 py-4 text-center text-[11px] text-zinc-400">
                                  Folder is empty.
                                </div>
                              ) : (
                                contents.map(
                                  (
                                    lead
                                  ) => (
                                    <button
                                      key={
                                        lead.id
                                      }
                                      type="button"
                                      onClick={() =>
                                        setSelectedLead(
                                          lead
                                        )
                                      }
                                      className="w-full border-b border-zinc-100 px-4 py-2.5 text-left last:border-0 hover:bg-white"
                                    >
                                      <div className="truncate text-xs font-semibold text-zinc-700">
                                        {
                                          lead.name
                                        }
                                      </div>

                                      <div className="mt-0.5 truncate text-[10px] text-zinc-400">
                                        {
                                          lead.title
                                        }
                                      </div>
                                    </button>
                                  )
                                )
                              )}

                            </div>
                          ) : null}
                        </div>
                      );
                    }
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    setShowFolderDialog(
                      true
                    )
                  }
                  className="mt-2 w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50"
                >
                  + Create Folder
                </button>
              </div>
            </div>
          ) : null}

          {/* DIVIDER */}

          <div className="my-1 border-t border-zinc-200" />

          {/* COMPLETED */}

          <button
            type="button"
            onClick={() =>
              toggleSection(
                "completed"
              )
            }
            className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm font-medium text-zinc-600 hover:bg-emerald-50"
          >
            <span className="w-5 text-center text-zinc-500">
              ✓
            </span>

            <span className="flex-1">
              Completed
            </span>

            <span className="text-zinc-400">
              {expandedSection ===
              "completed"
                ? "⌃"
                : "⌄"}
            </span>
          </button>

          {expandedSection ===
          "completed" ? (
            <InlineLeadSection
              leads={COMPLETED_LEADS}
              selectedLeadId={
                selectedLead?.id ??
                null
              }
              onSelect={
                setSelectedLead
              }
              emptyText="No completed leads."
            />
          ) : null}

          {/* CANCELLED */}

          <button
            type="button"
            onClick={() =>
              toggleSection(
                "cancelled"
              )
            }
            className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <span className="w-5 text-center text-zinc-500">
              ×
            </span>

            <span className="flex-1">
              Cancelled
            </span>

            <span className="text-zinc-400">
              {expandedSection ===
              "cancelled"
                ? "⌃"
                : "⌄"}
            </span>
          </button>

          {expandedSection ===
          "cancelled" ? (
            <InlineLeadSection
              leads={CANCELLED_LEADS}
              selectedLeadId={
                selectedLead?.id ??
                null
              }
              onSelect={
                setSelectedLead
              }
              emptyText="No cancelled leads."
            />
          ) : null}

          <div className="h-5" />
        </div>

        {/* ===================================================
            STATISTICS
        =================================================== */}

        <button
          type="button"
          onClick={
            openStatistics
          }
          className="flex h-14 shrink-0 items-center gap-3 border-t border-zinc-200 bg-zinc-100 px-5 text-left text-sm font-bold text-zinc-700 hover:bg-zinc-200"
        >
          <span className="w-5 text-center">
            ▥
          </span>

          Statistics
        </button>
      </aside>

      {/* =====================================================
          LEAD CHAT MODAL
      ===================================================== */}

      {selectedLead ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-6 backdrop-blur-sm">

          <div className="flex h-[82vh] w-full max-w-4xl min-h-0 overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER / DETAILS */}

            <div className="flex w-1/3 min-h-0 flex-col border-r border-zinc-200 bg-zinc-50">

              <div className="shrink-0 border-b border-zinc-200 p-5">

                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {selectedLead.status}
                </div>

                <h3 className="mt-2 text-lg font-bold text-zinc-900">
                  {selectedLead.name}
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  {selectedLead.title}
                </p>

                <div className="mt-4 space-y-2 text-xs text-zinc-500">

                  <div>
                    {selectedLead.location}
                  </div>

                  <div>
                    {selectedLead.budget}
                  </div>

                  <div>
                    Lead Score{" "}
                    <strong className="text-indigo-600">
                      {selectedLead.score}/100
                    </strong>
                  </div>

                </div>

              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">

                <div className="rounded-xl border border-zinc-200 bg-white p-3">

                  <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                    Last activity
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                    {selectedLead.lastMessage}
                  </p>

                </div>

              </div>
            </div>

            {/* CHAT */}

            <div className="flex min-w-0 flex-1 min-h-0 flex-col">

              <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-5">

                <div>
                  <div className="text-sm font-bold text-zinc-900">
                    Conversation History
                  </div>

                  <div className="text-[10px] text-zinc-400">
                    Archived lead
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedLead(
                      null
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-lg text-zinc-500 hover:bg-zinc-200"
                >
                  ×
                </button>

              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5">

                <div className="space-y-4">

                  {selectedLead.chat.map(
                    (
                      message,
                      index
                    ) => {
                      const customer =
                        message.role ===
                        "customer";

                      return (
                        <div
                          key={
                            index
                          }
                          className={
                            customer
                              ? "flex justify-start"
                              : "flex justify-end"
                          }
                        >

                          <div
                            className={
                              customer
                                ? "max-w-[78%] rounded-2xl rounded-bl-sm border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-800"
                                : "max-w-[78%] rounded-2xl rounded-br-sm bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white"
                            }
                          >
                            <div
                              className={
                                customer
                                  ? "mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400"
                                  : "mb-1 text-[10px] font-bold uppercase tracking-wide text-blue-100"
                              }
                            >
                              {customer
                                ? "Customer"
                                : "Assistant"}
                            </div>

                            {
                              message.text
                            }
                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

              <div className="shrink-0 border-t border-zinc-200 bg-zinc-50 p-3">

                <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-400">
                  Archived conversation. New messages are disabled.
                </div>

              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* =====================================================
          STATISTICS MODAL
      ===================================================== */}

      {showStatistics ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/35 p-6 backdrop-blur-sm">

          <div className="flex h-[88vh] w-full max-w-5xl min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  Sales Statistics
                </h2>

                <p className="mt-1 text-xs text-zinc-400">
                  Performance overview
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowStatistics(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-lg text-zinc-500 hover:bg-zinc-200"
              >
                ×
              </button>

            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">

              <div className="grid grid-cols-4 gap-4">

                <StatCard
                  label="Total Leads"
                  value={`${stats.totalLeads}`}
                  detail="+12 this month"
                />

                <StatCard
                  label="Conversion"
                  value={`${stats.conversion}%`}
                  detail="+4.2% vs last month"
                />

                <StatCard
                  label="Pipeline Value"
                  value={stats.pipeline}
                  detail="Active opportunities"
                />

                <StatCard
                  label="Avg. Lead Score"
                  value={`${stats.avgScore}`}
                  detail="Across active leads"
                />

              </div>

              <div className="mt-5 grid grid-cols-2 gap-5">

                <div className="rounded-2xl border border-zinc-200 bg-white p-5">

                  <h3 className="text-sm font-bold text-zinc-800">
                    Pipeline Health
                  </h3>

                  <div className="mt-5 space-y-4">

                    <ProgressRow
                      label="New Lead"
                      value="14"
                      width="72%"
                    />

                    <ProgressRow
                      label="Contact Made"
                      value="11"
                      width="58%"
                    />

                    <ProgressRow
                      label="Viewing Scheduled"
                      value="8"
                      width="43%"
                    />

                    <ProgressRow
                      label="Offer Made"
                      value="5"
                      width="28%"
                    />

                    <ProgressRow
                      label="Completed"
                      value="10"
                      width="51%"
                    />

                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5">

                  <h3 className="text-sm font-bold text-zinc-800">
                    Lead Sources
                  </h3>

                  <div className="mt-5 space-y-4">

                    <SourceRow
                      label="Customer Forms"
                      value="38%"
                    />

                    <SourceRow
                      label="WhatsApp"
                      value="27%"
                    />

                    <SourceRow
                      label="Manual"
                      value="21%"
                    />

                    <SourceRow
                      label="Documents"
                      value="14%"
                    />

                  </div>
                </div>

              </div>

              <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">

                <h3 className="text-sm font-bold text-zinc-800">
                  Activity Snapshot
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-4">

                  <ActivityStat
                    label="AI Analyses"
                    value={`${stats.analyses}`}
                  />

                  <ActivityStat
                    label="Follow-ups Generated"
                    value={`${stats.followUps}`}
                  />

                  <ActivityStat
                    label="Customer Responses"
                    value={`${stats.responses}`}
                  />

                </div>

              </div>

              <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">

                <h3 className="text-sm font-bold text-zinc-800">
                  Archived Activity
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-4">

                  <MiniMetric
                    label="Completed"
                    value={`${COMPLETED_LEADS.length}`}
                  />

                  <MiniMetric
                    label="Cancelled"
                    value={`${CANCELLED_LEADS.length}`}
                  />

                  <MiniMetric
                    label="Saved Folders"
                    value={`${folderCount}`}
                  />

                </div>

              </div>

              <div className="h-8" />
            </div>
          </div>
        </div>
      ) : null}

      {/* =====================================================
          CREATE FOLDER MODAL
      ===================================================== */}

      {showFolderDialog ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <h2 className="text-lg font-bold text-zinc-900">
              Create Folder
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Create a folder for organizing saved leads.
            </p>

            <input
              autoFocus
              value={newFolderName}
              onChange={(event) =>
                setNewFolderName(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  createFolder();
                }
              }}
              placeholder="Folder name"
              className="mt-5 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-5 flex justify-end gap-2">

              <button
                type="button"
                onClick={() => {
                  setShowFolderDialog(
                    false
                  );
                  setNewFolderName(
                    ""
                  );
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  !newFolderName.trim()
                }
                onClick={
                  createFolder
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Create Folder
              </button>

            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ============================================================
   INLINE LEAD SECTION
============================================================ */

function InlineLeadSection({
  leads,
  selectedLeadId,
  onSelect,
  emptyText,
}: {
  leads: FakeLead[];
  selectedLeadId: number | null;
  onSelect: (
    lead: FakeLead
  ) => void;
  emptyText: string;
}) {
  if (leads.length === 0) {
    return (
      <div className="border-b border-zinc-200 bg-zinc-50/60 px-8 py-5 text-center text-xs text-zinc-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="max-h-72 overflow-y-auto border-b border-zinc-200 bg-zinc-50/60">

      {leads.map((lead) => (
        <button
          key={lead.id}
          type="button"
          onClick={() =>
            onSelect(lead)
          }
          className={
            selectedLeadId ===
            lead.id
              ? "w-full border-l-4 border-blue-600 bg-white px-8 py-3.5 text-left"
              : "w-full border-l-4 border-transparent px-8 py-3.5 text-left hover:bg-white"
          }
        >
          <div className="truncate text-xs font-bold text-zinc-700">
            {lead.name}
          </div>

          <div className="mt-0.5 truncate text-[10px] text-zinc-400">
            {lead.title}
          </div>

          <div className="mt-2 flex items-center justify-between">

            <span className="text-[10px] font-medium text-zinc-400">
              {lead.budget}
            </span>

            <span className="text-[10px] font-bold text-indigo-600">
              {lead.score}/100
            </span>

          </div>
        </button>
      ))}

    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="text-xs font-bold uppercase tracking-wide text-zinc-400">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold text-zinc-900">
        {value}
      </div>

      <div className="mt-1 text-xs text-zinc-400">
        {detail}
      </div>
    </div>
  );
}

/* ============================================================
   PROGRESS
============================================================ */

function ProgressRow({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-zinc-600">
          {label}
        </span>

        <span className="font-bold text-zinc-800">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   SOURCE
============================================================ */

function SourceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-zinc-600">
        {label}
      </span>

      <span className="text-xs font-bold text-zinc-900">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   ACTIVITY
============================================================ */

function ActivityStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 text-center">
      <div className="text-2xl font-bold text-zinc-900">
        {value}
      </div>

      <div className="mt-1 text-xs text-zinc-400">
        {label}
      </div>
    </div>
  );
}

/* ============================================================
   MINI METRIC
============================================================ */

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4 text-center">
      <div className="text-xl font-bold text-zinc-900">
        {value}
      </div>

      <div className="mt-1 text-xs text-zinc-400">
        {label}
      </div>
    </div>
  );
}