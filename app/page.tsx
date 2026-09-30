"use client";

import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";
import LeadList from "./components/LeadList";
import LeadDetail from "./components/LeadDetail";
import LeadActionsFAB from "./components/LeadActionsFAB";
import LoginScreen from "./components/LoginScreen";

export default function Dashboard() {
  const [salespersonName, setSalespersonName] =
    useState("");

  const [selectedLead, setSelectedLead] =
    useState<any | null>(null);

  const [ready, setReady] =
    useState(false);

  /* =========================================================
     RESTORE LOGIN
  ========================================================= */

  useEffect(() => {
    const savedName =
      localStorage.getItem(
        "masal-salesperson-name"
      );

    if (savedName) {
      setSalespersonName(
        savedName.trim()
      );
    }

    setReady(true);
  }, []);

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleLogin = (
    name: string
  ) => {
    const cleanName =
      name.trim();

    if (!cleanName) {
      return;
    }

    localStorage.setItem(
      "masal-salesperson-name",
      cleanName
    );

    setSalespersonName(
      cleanName
    );
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem(
      "masal-salesperson-name"
    );

    setSelectedLead(null);
    setSalespersonName("");
  };

  /* =========================================================
     INITIAL LOADING
  ========================================================= */

  if (!ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="text-sm text-zinc-500">
          Loading...
        </div>
      </div>
    );
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  if (!salespersonName) {
    return (
      <LoginScreen
        onLogin={handleLogin}
      />
    );
  }

  /* =========================================================
     LEAD DETAIL
  ========================================================= */

  if (selectedLead) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <LeadDetail
          lead={selectedLead}
          salespersonName={
            salespersonName
          }
          onBack={() =>
            setSelectedLead(null)
          }
        />
      </div>
    );
  }

  /* =========================================================
     MAIN CRM
  ========================================================= */

  return (
    <div className="
      relative
      flex
      h-screen
      w-screen
      overflow-hidden
      bg-zinc-50
    ">

      <Sidebar />

      <main className="
        flex
        min-w-0
        flex-1
        flex-col
        overflow-hidden
      ">
        <LeadList
          salespersonName={
            salespersonName
          }
          onSelectLead={
            setSelectedLead
          }
          onLogout={
            handleLogout
          }
        />
      </main>

      <LeadActionsFAB
        salespersonName={
          salespersonName
        }
      />

    </div>
  );
}