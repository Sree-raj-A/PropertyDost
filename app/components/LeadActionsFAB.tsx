"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

import { DEMO_PROFILE } from "../lib/demo-profile";

type ManualTab = "full" | "quick";

type FormState = {
  firstName: string;
  lastName: string;
  location: string;
  budget: string;
  propertyRequirement: string;
  timelineStart: string;
  timelineEnd: string;
  message: string;
};

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  location: "",
  budget: "",
  propertyRequirement: "",
  timelineStart: "",
  timelineEnd: "",
  message: "",
};

export default function LeadActionsFAB({
  salespersonName,
}: {
  salespersonName: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [manualTab, setManualTab] =
    useState<ManualTab>("full");

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const [files, setFiles] =
    useState<File[]>([]);

  const [urgency, setUrgency] =
    useState(3);

  const [submitting, setSubmitting] =
    useState(false);

  const [creatingLink, setCreatingLink] =
    useState(false);

  const [toast, setToast] =
    useState("");

  /* =========================================================
     FORM
  ========================================================= */

  function setField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setFiles([]);
    setUrgency(3);
    setManualTab("full");
  }

  function showToast(message: string) {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 3500);
  }

  function openManualLead() {
    setMenuOpen(false);
    setManualTab("full");
    setModalOpen(true);
  }

  function closeManualLead() {
    if (submitting) return;
    setModalOpen(false);
  }

  /* =========================================================
     CUSTOMER FORM LINK
  ========================================================= */

  async function createCustomerLink() {
    if (creatingLink) return;

    try {
      setCreatingLink(true);

      const response = await fetch(
        "/api/intake/create",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            salespersonName,
            salespersonLocation:
              DEMO_PROFILE.location,
            salespersonPhone:
              DEMO_PROFILE.phone,
          }),
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) ?? "";

      let result: any = null;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        result =
          await response.json();
      } else {
        await response.text();

        throw new Error(
          `Customer form service returned ${response.status}.`
        );
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ??
            "Could not create the customer form."
        );
      }

      if (!result.url) {
        throw new Error(
          "The customer form was created without a link."
        );
      }

      try {
        await navigator.clipboard.writeText(
          result.url
        );

        setMenuOpen(false);

        showToast(
          "Customer form link copied."
        );
      } catch {
        setMenuOpen(false);

        showToast(
          `Form created: ${result.url}`
        );
      }
    } catch (error) {
      console.error(
        "Customer form error:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Could not create the customer form."
      );
    } finally {
      setCreatingLink(false);
    }
  }

  /* =========================================================
     FILES
  ========================================================= */

  function handleFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setFiles(
      Array.from(
        event.target.files ?? []
      )
    );
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validateFullDetails() {
    const requiredValues = [
      form.firstName.trim(),
      form.lastName.trim(),
      form.location.trim(),
      form.budget.trim(),
      form.propertyRequirement.trim(),
      form.timelineStart.trim(),
      form.timelineEnd.trim(),
    ];

    if (
      requiredValues.some(
        (value) => !value
      )
    ) {
      showToast(
        "Please complete all required fields."
      );

      return false;
    }

    return true;
  }

  function validateQuickImport() {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.location.trim()
    ) {
      showToast(
        "First name, last name and location are required."
      );

      return false;
    }

    if (files.length === 0) {
      showToast(
        "Please upload at least one screenshot, image, PDF or text file."
      );

      return false;
    }

    return true;
  }

  /* =========================================================
     CREATE LEAD
  ========================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) return;

    const valid =
      manualTab === "full"
        ? validateFullDetails()
        : validateQuickImport();

    if (!valid) return;

    const fullName =
      `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

    try {
      setSubmitting(true);

      const payload =
        new FormData();

      payload.append(
        "name",
        fullName
      );

      payload.append(
        "location",
        form.location.trim()
      );

      payload.append(
        "budget",
        form.budget.trim()
      );

      payload.append(
        "propertyRequirement",
        form.propertyRequirement.trim()
      );

      payload.append(
        "timeline",
        form.timelineStart &&
          form.timelineEnd
          ? `${form.timelineStart} to ${form.timelineEnd}`
          : ""
      );

      payload.append(
        "message",
        form.message.trim()
      );

      payload.append(
        "manualUrgency",
        String(urgency)
      );

      payload.append(
        "salespersonName",
        salespersonName
      );

      payload.append(
        "salespersonLocation",
        DEMO_PROFILE.location
      );

      payload.append(
        "salespersonPhone",
        DEMO_PROFILE.phone
      );

      payload.append(
        "intakeMode",
        manualTab
      );

      for (const file of files) {
        payload.append(
          "files",
          file
        );
      }

      const response =
        await fetch(
          "/api/leads",
          {
            method: "POST",
            body: payload,
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        ) ?? "";

      let result: any = null;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        result =
          await response.json();
      } else {
        await response.text();

        throw new Error(
          `Lead service returned ${response.status}.`
        );
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ??
            "Could not create lead."
        );
      }

      window.dispatchEvent(
        new Event(
          "masal-lead-created"
        )
      );

      setModalOpen(false);
      resetForm();

      showToast(
        `Lead created: ${
          result.lead?.ai_title ??
          fullName
        }`
      );
    } catch (error) {
      console.error(
        "Lead creation error:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Could not create lead."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* =====================================================
          TOAST
      ===================================================== */}

      {toast ? (
        <div className="fixed bottom-24 right-6 z-[130] max-w-[420px] rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-2xl">
          {toast}
        </div>
      ) : null}

      {/* =====================================================
          FAB
      ===================================================== */}

      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">

        {menuOpen ? (
          <div className="mb-1 w-[320px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5">

            {/* ADD LEAD */}

            <button
              type="button"
              onClick={
                openManualLead
              }
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-zinc-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl font-light text-blue-600">
                +
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900">
                  Add lead manually
                </div>

                <div className="mt-0.5 text-xs text-zinc-400">
                  Enter customer details directly
                </div>
              </div>
            </button>

            <div className="border-t border-zinc-100" />

            {/* CUSTOMER FORM */}

            <button
              type="button"
              disabled={
                creatingLink
              }
              onClick={
                createCustomerLink
              }
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600">
                ↗
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900">
                  {creatingLink
                    ? "Creating form..."
                    : "Create customer form link"}
                </div>

                <div className="mt-0.5 text-xs text-zinc-400">
                  {creatingLink
                    ? "Please wait"
                    : "Send a form customers can complete"}
                </div>
              </div>
            </button>

          </div>
        ) : null}

        {/* FAB */}

        <button
          type="button"
          aria-label="Lead actions"
          aria-expanded={
            menuOpen
          }
          onClick={() =>
            setMenuOpen(
              (current) =>
                !current
            )
          }
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:scale-105 hover:bg-blue-700 active:scale-95"
        >
          <span className="text-3xl font-light leading-none">
            {menuOpen
              ? "×"
              : "+"}
          </span>
        </button>

      </div>

      {/* =====================================================
          ADD LEAD MODAL
      ===================================================== */}

      {modalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">

          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  Add New Lead
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Add customer details or import their material.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  submitting
                }
                onClick={
                  closeManualLead
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xl text-zinc-500 transition hover:bg-zinc-200 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* TABS */}

            <div className="flex shrink-0 border-b border-zinc-200">

              <button
                type="button"
                onClick={() =>
                  setManualTab(
                    "full"
                  )
                }
                className={
                  manualTab ===
                  "full"
                    ? "border-b-2 border-blue-600 px-7 py-3 text-sm font-semibold text-blue-600"
                    : "border-b-2 border-transparent px-7 py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-800"
                }
              >
                Full Details
              </button>

              <button
                type="button"
                onClick={() =>
                  setManualTab(
                    "quick"
                  )
                }
                className={
                  manualTab ===
                  "quick"
                    ? "border-b-2 border-blue-600 px-7 py-3 text-sm font-semibold text-blue-600"
                    : "border-b-2 border-transparent px-7 py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-800"
                }
              >
                Quick Import
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="overflow-y-auto bg-zinc-50/50 p-6"
            >

              {manualTab ===
              "full" ? (
                <div className="space-y-5">

                  <div className="grid grid-cols-2 gap-4">

                    <RequiredField
                      label="First Name"
                      value={
                        form.firstName
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "firstName",
                          value
                        )
                      }
                    />

                    <RequiredField
                      label="Last Name"
                      value={
                        form.lastName
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "lastName",
                          value
                        )
                      }
                    />

                    <RequiredField
                      label="Location"
                      value={
                        form.location
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "location",
                          value
                        )
                      }
                    />

                    <RequiredField
                      label="Budget"
                      value={
                        form.budget
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "budget",
                          value
                        )
                      }
                    />

                  </div>

                  <RequiredField
                    label="Property Requirement"
                    value={
                      form.propertyRequirement
                    }
                    onChange={(
                      value
                    ) =>
                      setField(
                        "propertyRequirement",
                        value
                      )
                    }
                  />

                  <div className="grid grid-cols-2 gap-4">

                    <RequiredDateField
                      label="Buying Window Starts"
                      value={
                        form.timelineStart
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "timelineStart",
                          value
                        )
                      }
                    />

                    <RequiredDateField
                      label="Buying Window Ends"
                      value={
                        form.timelineEnd
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "timelineEnd",
                          value
                        )
                      }
                    />

                  </div>

                  <TextAreaField
                    label="Customer Messages and Notes"
                    optional
                    value={
                      form.message
                    }
                    onChange={(
                      value
                    ) =>
                      setField(
                        "message",
                        value
                      )
                    }
                  />

                  <FileBox
                    label="Supporting Images / PDFs"
                    optional
                    files={files}
                    onChange={
                      setFiles
                    }
                    accept="image/*,.pdf"
                  />

                </div>
              ) : (
                <div className="space-y-5">

                  <div className="grid grid-cols-2 gap-4">

                    <RequiredField
                      label="First Name"
                      value={
                        form.firstName
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "firstName",
                          value
                        )
                      }
                    />

                    <RequiredField
                      label="Last Name"
                      value={
                        form.lastName
                      }
                      onChange={(
                        value
                      ) =>
                        setField(
                          "lastName",
                          value
                        )
                      }
                    />

                    <div className="col-span-2">
                      <RequiredField
                        label="Location"
                        value={
                          form.location
                        }
                        onChange={(
                          value
                        ) =>
                          setField(
                            "location",
                            value
                          )
                        }
                      />
                    </div>

                  </div>

                  <TextAreaField
                    label="Customer Messages and Notes"
                    optional
                    value={
                      form.message
                    }
                    onChange={(
                      value
                    ) =>
                      setField(
                        "message",
                        value
                      )
                    }
                  />

                  <FileBox
                    label="Customer Screenshots / Images / PDFs"
                    required
                    files={files}
                    onChange={
                      setFiles
                    }
                    accept="image/*,.pdf,.txt"
                  />

                </div>
              )}

              {/* URGENCY */}

              <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">

                <div className="text-sm font-bold text-zinc-800">
                  Urgency Rating
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  Rate the customer's urgency from 1 to 5.
                </div>

                <div className="mt-4 flex gap-2">

                  {[1, 2, 3, 4, 5].map(
                    (level) => (
                      <button
                        key={
                          level
                        }
                        type="button"
                        onClick={() =>
                          setUrgency(
                            level
                          )
                        }
                        className={
                          urgency ===
                          level
                            ? "flex h-10 w-10 items-center justify-center rounded-lg border border-blue-600 bg-blue-600 text-sm font-bold text-white"
                            : "flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-bold text-zinc-600 hover:border-blue-300"
                        }
                      >
                        {level}
                      </button>
                    )
                  )}

                </div>
              </div>

              {/* FOOTER */}

              <div className="mt-6 flex justify-end gap-3 border-t border-zinc-200 pt-5">

                <button
                  type="button"
                  disabled={
                    submitting
                  }
                  onClick={
                    closeManualLead
                  }
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="flex min-w-[170px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      <span>
                        Thinking...
                      </span>
                    </>
                  ) : (
                    <span>
                      Create Lead
                    </span>
                  )}
                </button>

              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ============================================================
   REQUIRED FIELD
============================================================ */

function RequiredField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-zinc-700">
        {label}
        <span className="ml-1 text-red-500">
          *
        </span>
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

/* ============================================================
   DATE FIELD
============================================================ */

function RequiredDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-zinc-700">
        {label}
        <span className="ml-1 text-red-500">
          *
        </span>
      </label>

      <input
        type="date"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

/* ============================================================
   TEXT AREA
============================================================ */

function TextAreaField({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-zinc-700">
        {label}

        {optional ? (
          <span className="ml-1.5 text-xs font-normal text-zinc-400">
            (optional)
          </span>
        ) : (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <textarea
        rows={7}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

/* ============================================================
   FILE BOX
============================================================ */

function FileBox({
  label,
  required = false,
  optional = false,
  files,
  onChange,
  accept,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  files: File[];
  onChange: (
    files: File[]
  ) => void;
  accept: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-zinc-700">
        {label}

        {required ? (
          <span className="ml-1 text-red-500">
            *
          </span>
        ) : null}

        {optional ? (
          <span className="ml-1.5 text-xs font-normal text-zinc-400">
            (optional)
          </span>
        ) : null}
      </label>

      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-white px-4 py-5 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
        <span className="text-sm font-semibold text-zinc-700">
          Choose files
        </span>

        <span className="mt-1 text-xs text-zinc-400">
          Images, PDFs or text files
        </span>

        <input
          type="file"
          multiple
          accept={accept}
          onChange={(
            event
          ) =>
            onChange(
              Array.from(
                event.target
                  .files ?? []
              )
            )
          }
          className="hidden"
        />
      </label>

      {files.length > 0 ? (
        <div className="mt-2 space-y-1">
          {files.map(
            (file) => (
              <div
                key={`${file.name}-${file.size}`}
                className="flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-600"
              >
                <span className="truncate">
                  {file.name}
                </span>

                <span className="ml-3 shrink-0 text-zinc-400">
                  {Math.max(
                    1,
                    Math.round(
                      file.size /
                        1024
                    )
                  )}{" "}
                  KB
                </span>
              </div>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}