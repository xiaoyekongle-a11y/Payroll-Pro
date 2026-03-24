"use client";

import { type ReactNode } from "react";
import { AppHeader } from "./app-header";
import { NavTabs, type NavPage } from "./nav-tabs";

interface AppShellProps {
  companyName: string;
  userName: string;
  userRole: "owner" | "editor" | "viewer";
  activePage: NavPage;
  onPageChange: (page: NavPage) => void;
  onSwitchCompany: () => void;
  onSignOut: () => void;
  children: ReactNode;
}

export function AppShell({
  companyName,
  userName,
  userRole,
  activePage,
  onPageChange,
  onSwitchCompany,
  onSignOut,
  children,
}: AppShellProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-paper">
      <AppHeader
        companyName={companyName}
        userName={userName}
        userRole={userRole}
        onSwitchCompany={onSwitchCompany}
        onSignOut={onSignOut}
      />
      <NavTabs
        activePage={activePage}
        onPageChange={onPageChange}
        userRole={userRole}
        showAdvanced={true}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
