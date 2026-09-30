"use client";

import { useEffect, useState } from "react";

type SidebarView =
  | "all"
  | "urgent"
  | "saved"
  | "completed"
  | "cancelled";

type Folder = {
  id: string;
  name: string;
};

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
  score: number;
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

const COMPLETED_LEADS: FakeLead[] = [
  {
    id: 5001,
    name: "Nikhil Varma",
    title: "3BHK Koramangala Purchase",
    location: "Koramangala, Bengaluru",
    budget: "₹2.15 Cr",
    score: 94,
    chat: [
      {
        role: "customer",
        text: "The second property you showed us looks like the right fit.",
      },
      {
        role: "assistant",
        text: "I'll coordinate the final visit and documentation.",
      },
      {
        role: "customer",
        text: "Great. Let's proceed with the next steps.",
      },
    ],
  },
  {
    id: 5002,
    name: "Lavanya Krishnan",
    title: "Whitefield 2BHK Purchase",
    location: "Whitefield, Bengaluru",
    budget: "₹1.28 Cr",
    score: 88,
    chat: [
      {
        role: "assistant",
        text: "I've prepared the final comparison.",
      },
      {
        role: "customer",
        text: "The Whitefield option looks best.",
      },
    ],
  },
];

const CANCELLED_LEADS: FakeLead[] = [
  {
    id: 6001,
    name: "Neha Bhat",
    title: "HSR 2BHK Search",
    location: "HSR Layout, Bengaluru",
    budget: "₹1.05 Cr",
    score: 66,
    chat: [
      {
        role: "assistant",
        text: "I found several newer 2BHK communities within the budget.",
      },
      {
        role: "customer",
        text: "We'll probably wait until next year.",
      },
      {
        role: "assistant",
        text: "Understood. I'll keep the previous requirements on record.",
      },
    ],
  },
  {
    id: 6002,
    name: "Riya Kapoor",
    title: "Sadhashivanagar 4BHK",
    location: "Sadhashivanagar, Bengaluru",
    budget: "₹6.8 Cr",
    score: 58,
    chat: [
      {
        role: "assistant",
        text: "I've prepared the premium inventory shortlist.",
      },
      {
        role: "customer",
        text: "We are putting the purchase on hold.",
      },
    ],
  },
];

const URGENT_LEADS: FakeLead[] = [
  {
    id: 7001,
    name: "Karan Rao",
    title: "Urgent 3BHK Search",
    location: "Indiranagar, Bengaluru",
    budget: "₹2.4 Cr",
    score: 96,
    chat: [
      {
        role: "customer",
        text: "We need to move very quickly.",
      },
      {
        role: "assistant",
        text: "I'll prioritize ready-to-move options that match the requirements.",
      },
      {
        role: "customer",
        text: "Please send the shortlist first.",
      },
    ],
  },
  {
    id: 7002,
    name: "Meera Shah",
    title: "Premium Whitefield Search",
    location: "Whitefield, Bengaluru",
    budget: "₹1.9 Cr",
    score: 91,
    chat: [
      {
        role: "customer",
        text: "We want to finalize something this week.",
      },
      {
        role: "assistant",
        text: "I'll prioritize the strongest Whitefield matches.",
      },
    ],
  },
];

const SAVED_LEADS: FakeLead[] = [
  {
    id: 8001,
    name: "Priyanka Iyer",
    title: "Premium 3BHK Shortlist",
    location: "Indiranagar, Bengaluru",
    budget: "₹2.1 Cr",
    score: 87,
    chat: [
      {
        role: "assistant",
        text: "These three properties best match the requirements.",
      },
      {
        role: "customer",
        text: "Please keep these saved for now.",
      },
    ],
  },
];

const FOLDER_CONTENTS: Record<string, FakeLead[]> = {
  commercial: [
    {
      id: 9001,
      name: "Arvind Joshi",
      title: "Commercial Office Search",
      location: "Outer Ring Road, Bengaluru",
      budget: "₹4.2 Cr",
      score: 79,
      chat: [
        {
          role: "customer",
          text: "I'm comparing three office spaces.",
        },
        {
          role: "assistant",
          text: "I'll organize the comparison around rent, access and amenities.",
        },
      ],
    },
  ],
  "net-worth": [
    {
      id: 9002,
      name: "Vivek Malhotra",
      title: "Luxury 4BHK Search",
      location: "Sadashivanagar, Bengaluru",
      budget: "₹7.5 Cr",
      score: 92,
      chat: [
        {
          role: "customer",
          text: "We prefer something very private.",
        },
        {
          role: "assistant",
          text: "I'll focus on low-density premium developments.",
        },
      ],
    },
  ],
  finance: [],
};

const FOLDERS_KEY = "propertydost-folders";
const FOLDER_CONTENTS_KEY =
  "propertydost-folder-contents";

export default function Sidebar() {
  const [collapsed, setCollapsed] =
    useState(false);

  const [savedOpen, setSavedOpen] =
    useState(true);

  const [expandedSection, setExpandedSection] =
    useState<SidebarView | null>(null);

  const [folders, setFolders] =
    useState<Folder[]>(DEFAULT_FOLDERS);

  const [folderContents, setFolderContents] =
    useState<Record<string, FakeLead[]>>(
      FOLDER_CONTENTS
    );

  const [expandedFolders, setExpandedFolders] =
    useState<Record<string, boolean>>({});

  const [showCreateFolder, setShowCreateFolder] =
    useState(false);

  const [folderName, setFolderName] =
    useState("");

  const [selectedArchivedLead, setSelectedArchivedLead] =
    useState<FakeLead | null>(null);

  const [showStatistics, setShowStatistics] =
    useState(false);

  useEffect(() => {
    try {
      const savedFolders =
        localStorage.getItem(FOLDERS_KEY);

      if (savedFolders) {
        const parsed =
          JSON.parse(savedFolders);

        if (Array.isArray(parsed)) {
          setFolders(parsed);
        }
      }

      const savedContents =
        localStorage.getItem(
          FOLDER_CONTENTS_KEY
        );

      if (savedContents) {
        const parsed =
          JSON.parse(savedContents);

        if (
          parsed &&
          typeof parsed === "object"
        ) {
          setFolderContents(parsed);
        }
      }
    } catch {
      // Ignore malformed local storage.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      FOLDERS_KEY,
      JSON.stringify(folders)
    );
  }, [folders]);

  useEffect(() => {
    localStorage.setItem(
      FOLDER_CONTENTS_KEY,
      JSON.stringify(folderContents)
    );
  }, [folderContents]);

  function dispatchView(
    view: SidebarView
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

  function activateView(
    view: SidebarView
  ) {
    setExpandedSection(
      expandedSection === view
        ? null
        : view
    );

    dispatchView(view);

    if (view === "all") {
      setExpandedSection(null);
    }
  }

  function createFolder() {
    const cleanName =
      folderName.trim();

    if (!cleanName) return;

    const id = `folder-${Date.now()}`;

    setFolders((current) => [
      ...current,
      {
        id,
        name: cleanName,
      },
    ]);

    setFolderContents((current) => ({
      ...current,
      [id]: [],
    }));

    setExpandedFolders((current) => ({
      ...current,
      [id]: true,
    }));

    setFolderName("");
    setShowCreateFolder(false);
  }

  function deleteFolder(
    id: string
  ) {
    setFolders((current) =>
      current.filter(
        (folder) => folder.id !== id
      )
    );

    setFolderContents((current) => {
      const next = {
        ...current,
      };

      delete next[id];

      return next;
    });

    setExpandedFolders((current) => {
      const next = {
        ...current,
      };

      delete next[id];

      return next;
    });
  }

  function sectionLeads(
    section: SidebarView
  ): FakeLead[] {
    switch (section) {
      case "urgent":
        return URGENT_LEADS;
      case "saved":
        return SAVED_LEADS;
      case "completed":
        return COMPLETED_LEADS;
      case "cancelled":
        return CANCELLED_LEADS;
      default:
        return [];
    }
  }

  const sectionLabels: Record<
    Exclude<SidebarView, "all">,
    string
  > = {
    urgent: "Urgent Leads",
    saved: "Saved Leads",
    completed: "Completed Leads",
    cancelled: "Cancelled Leads",
  };

  return (
    <>
      <aside
        className={[
          "flex h-screen shrink-0 flex-col border-r border-zinc-200 bg-white",
          "transition-[width] duration-200",
          collapsed
            ? "w-16"
            : "w-80",
        ].join(" ")}
      >
        {/* HEADER */}

        <div
          className={[
            "flex h-20 shrink-0 items-center border-b border-zinc-200",
            collapsed
              ? "justify-center px-2"
              : "justify-between px-5",
          ].join(" ")}
        >
          {!collapsed && (
            <div>
              <div className="font-serif text-xl font-semibold italic text-zinc-900">
                PropertyDost
              </div>

              <div className="mt-0.5 text-[10px] text-zinc-400">
                Sales ka ek sathi!
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              setCollapsed(
                (value) => !value
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {collapsed
              ? "›"
              : "☰"}
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {/* ALL LEADS */}

          <button
            type="button"
            onClick={() => activateView("all")}
            className={[
              "flex w-full items-center gap-3 border-l-4 border-blue-600 bg-blue-600 py-3.5 text-left text-sm font-semibold text-white",
              collapsed
                ? "justify-center px-2"
                : "px-5",
            ].join(" ")}
            title="All Leads"
          >
            <span className="text-base">
              ▱
            </span>

            {!collapsed && (
              <span>
                All Leads
              </span>
            )}
          </button>

          {/* URGENT */}

          <button
            type="button"
            onClick={() =>
              activateView("urgent")
            }
            className={[
              "flex w-full items-center gap-3 py-3.5 text-left text-sm font-medium text-zinc-600 hover:bg-red-50",
              collapsed
                ? "justify-center px-2"
                : "px-5",
            ].join(" ")}
            title="Urgent"
          >
            <span className="text-red-500">
              ⚠
            </span>

            {!collapsed && (
              <>
                <span className="flex-1">
                  Urgent
                </span>

                <span className="rounded-sm bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                  {URGENT_LEADS.length}
                </span>

                <span className="text-zinc-400">
                  {expandedSection ===
                  "urgent"
                    ? "⌃"
                    : "⌄"}
                </span>
              </>
            )}
          </button>

          {!collapsed &&
            expandedSection ===
              "urgent" && (
              <ArchivedList
                leads={sectionLeads("urgent")}
                title={
                  sectionLabels.urgent
                }
                onSelect={
                  setSelectedArchivedLead
                }
              />
            )}

          {/* SAVED */}

          <button
            type="button"
            onClick={() => {
              if (collapsed) return;
              setSavedOpen(
                (value) => !value
              );
            }}
            className={[
              "flex w-full items-center gap-3 py-3.5 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-50",
              collapsed
                ? "justify-center px-2"
                : "px-5",
            ].join(" ")}
            title="Saved"
          >
            <span className="text-amber-500">
              ★
            </span>

            {!collapsed && (
              <>
                <span className="flex-1">
                  Saved
                </span>

                <span className="text-zinc-400">
                  {savedOpen
                    ? "⌃"
                    : "⌄"}
                </span>
              </>
            )}
          </button>

          {!collapsed &&
            savedOpen && (
              <div className="border-b border-zinc-200 bg-zinc-50/60">
                <ArchivedList
                  leads={SAVED_LEADS}
                  title="Saved Leads"
                  onSelect={
                    setSelectedArchivedLead
                  }
                />

                <div className="border-t border-zinc-200 p-3">
                  <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Folders
                  </div>

                  {folders.map(
                    (folder) => {
                      const contents =
                        folderContents[
                          folder.id
                        ] ?? [];

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
                                setExpandedFolders(
                                  (current) => ({
                                    ...current,
                                    [folder.id]:
                                      !expanded,
                                  })
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
                                {
                                  folder.name
                                }
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
                              className="mr-1 flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                              title="Delete folder"
                            >
                              🗑
                            </button>
                          </div>

                          {expanded && (
                            <div className="border-t border-zinc-100 bg-zinc-50">
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
                                        setSelectedArchivedLead(
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
                          )}
                        </div>
                      );
                    }
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setShowCreateFolder(
                        true
                      )
                    }
                    className="mt-2 w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    + Create Folder
                  </button>
                </div>
              </div>
            )}

          <div className="my-1 border-t border-zinc-200" />

          {/* COMPLETED */}

          <button
            type="button"
            onClick={() =>
              activateView("completed")
            }
            className={[
              "flex w-full items-center gap-3 py-3.5 text-left text-sm font-medium text-zinc-600 hover:bg-emerald-50",
              collapsed
                ? "justify-center px-2"
                : "px-5",
            ].join(" ")}
            title="Completed"
          >
            <span>✓</span>

            {!collapsed && (
              <>
                <span className="flex-1">
                  Completed
                </span>

                <span className="text-zinc-400">
                  {expandedSection ===
                  "completed"
                    ? "⌃"
                    : "⌄"}
                </span>
              </>
            )}
          </button>

          {!collapsed &&
            expandedSection ===
              "completed" && (
              <ArchivedList
                leads={
                  COMPLETED_LEADS
                }
                title="Completed Leads"
                onSelect={
                  setSelectedArchivedLead
                }
              />
            )}

          {/* CANCELLED */}

          <button
            type="button"
            onClick={() =>
              activateView("cancelled")
            }
            className={[
              "flex w-full items-center gap-3 py-3.5 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-50",
              collapsed
                ? "justify-center px-2"
                : "px-5",
            ].join(" ")}
            title="Cancelled"
          >
            <span>×</span>

            {!collapsed && (
              <>
                <span className="flex-1">
                  Cancelled
                </span>

                <span className="text-zinc-400">
                  {expandedSection ===
                  "cancelled"
                    ? "⌃"
                    : "⌄"}
                </span>
              </>
            )}
          </button>

          {!collapsed &&
            expandedSection ===
              "cancelled" && (
              <ArchivedList
                leads={
                  CANCELLED_LEADS
                }
                title="Cancelled Leads"
                onSelect={
                  setSelectedArchivedLead
                }
              />
            )}
        </div>

        {/* STATISTICS */}

        <button
          type="button"
          onClick={() =>
            setShowStatistics(true)
          }
          className={[
            "flex h-14 shrink-0 items-center gap-3 border-t border-zinc-200 bg-zinc-100 text-left text-sm font-bold text-zinc-700 hover:bg-zinc-200",
            collapsed
              ? "justify-center px-2"
              : "px-5",
          ].join(" ")}
          title="Statistics"
        >
          <span>▥</span>

          {!collapsed && (
            <span>
              Statistics
            </span>
          )}
        </button>
      </aside>

      {/* ARCHIVED CHAT */}

      {selectedArchivedLead && (
        <ArchivedChat
          lead={
            selectedArchivedLead
          }
          onClose={() =>
            setSelectedArchivedLead(
              null
            )
          }
        />
      )}

      {/* STATISTICS */}

      {showStatistics && (
        <StatisticsModal
          onClose={() =>
            setShowStatistics(
              false
            )
          }
        />
      )}

      {/* CREATE FOLDER */}

      {showCreateFolder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-zinc-900">
              Create Folder
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Organize saved leads into a custom folder.
            </p>

            <input
              autoFocus
              value={folderName}
              onChange={(event) =>
                setFolderName(
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
                  setShowCreateFolder(
                    false
                  );
                  setFolderName("");
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  createFolder
                }
                disabled={
                  !folderName.trim()
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ArchivedList({
  leads,
  title,
  onSelect,
}: {
  leads: FakeLead[];
  title: string;
  onSelect: (
    lead: FakeLead
  ) => void;
}) {
  return (
    <div className="max-h-72 overflow-y-auto border-b border-zinc-200 bg-zinc-50/60">
      <div className="px-8 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        {title}
      </div>

      {leads.length === 0 ? (
        <div className="px-8 py-5 text-center text-xs text-zinc-400">
          Empty.
        </div>
      ) : (
        leads.map((lead) => (
          <button
            key={lead.id}
            type="button"
            onClick={() =>
              onSelect(lead)
            }
            className="w-full border-l-4 border-transparent px-8 py-3 text-left hover:border-blue-600 hover:bg-white"
          >
            <div className="truncate text-xs font-bold text-zinc-700">
              {lead.name}
            </div>

            <div className="mt-0.5 truncate text-[10px] text-zinc-400">
              {lead.title}
            </div>

            <div className="mt-1 text-[10px] font-semibold text-zinc-400">
              {lead.budget}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

function ArchivedChat({
  lead,
  onClose,
}: {
  lead: FakeLead;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-6 backdrop-blur-sm">
      <div className="flex h-[82vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="w-1/3 border-r border-zinc-200 bg-zinc-50">
          <div className="border-b border-zinc-200 p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Archived Lead
            </div>

            <h2 className="mt-2 text-lg font-bold text-zinc-900">
              {lead.name}
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {lead.title}
            </p>

            <div className="mt-4 space-y-1.5 text-xs text-zinc-500">
              <div>
                {lead.location}
              </div>

              <div>
                {lead.budget}
              </div>

              <div>
                Score{" "}
                <strong className="text-indigo-600">
                  {lead.score}/100
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-5">
            <div className="text-sm font-bold text-zinc-900">
              Conversation History
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-lg text-zinc-500 hover:bg-zinc-200"
            >
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div className="space-y-4">
              {lead.chat.map(
                (message, index) => {
                  const isCustomer =
                    message.role ===
                    "customer";

                  return (
                    <div
                      key={index}
                      className={
                        isCustomer
                          ? "flex justify-start"
                          : "flex justify-end"
                      }
                    >
                      <div
                        className={
                          isCustomer
                            ? "max-w-[78%] rounded-2xl rounded-bl-sm border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-800"
                            : "max-w-[78%] rounded-2xl rounded-br-sm bg-blue-600 px-4 py-3 text-sm text-white"
                        }
                      >
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-60">
                          {isCustomer
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
              Archived conversation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatisticsModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/35 p-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
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
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-lg text-zinc-500 hover:bg-zinc-200"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-6">
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Total Leads"
              value="48"
              detail="+12 this month"
            />

            <StatCard
              label="Conversion"
              value="31%"
              detail="+4.2% vs last month"
            />

            <StatCard
              label="Pipeline Value"
              value="₹42.8 Cr"
              detail="Active opportunities"
            />

            <StatCard
              label="Avg. Lead Score"
              value="84"
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

          <div className="mt-5 grid grid-cols-3 gap-4">
            <MiniMetric
              label="AI Analyses"
              value="127"
            />

            <MiniMetric
              label="Follow-ups Generated"
              value="94"
            />

            <MiniMetric
              label="Customer Responses"
              value="63"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-zinc-600">
          {label}
        </span>

        <span className="font-bold text-zinc-800">
          {value}
        </span>
      </div>

      <div className="h-2 rounded-full bg-zinc-100">
        <div
          className="h-2 rounded-full bg-blue-600"
          style={{ width }}
        />
      </div>
    </div>
  );
}

function SourceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-zinc-600">
        {label}
      </span>

      <strong className="text-zinc-900">
        {value}
      </strong>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-5 text-center">
      <div className="text-2xl font-bold text-zinc-900">
        {value}
      </div>

      <div className="mt-1 text-xs text-zinc-400">
        {label}
      </div>
    </div>
  );
}