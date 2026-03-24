"use client";

import { getInitials } from "@/lib/utils";
import { Bell, LogOut, Building2, ChevronDown } from "lucide-react";
import { useState } from "react";

interface AppHeaderProps {
  companyName: string;
  userName: string;
  userRole: "owner" | "editor" | "viewer";
  onSwitchCompany: () => void;
  onSignOut: () => void;
}

export function AppHeader({
  companyName,
  userName,
  userRole,
  onSwitchCompany,
  onSignOut,
}: AppHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const roleLabels = {
    owner: "管理者",
    editor: "編集者",
    viewer: "閲覧者",
  };

  return (
    <header className="h-[var(--header-height)] bg-white border-b border-border px-4 flex items-center gap-3 sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="font-bold text-base text-ink tracking-tight">Salario</span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-border mx-1" />

      {/* Company Selector */}
      <button
        onClick={onSwitchCompany}
        className="flex items-center gap-1.5 text-sm text-ink hover:text-primary transition-colors group"
      >
        <Building2 className="w-4 h-4 text-muted group-hover:text-primary" />
        <span className="font-medium truncate max-w-[140px]">{companyName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Role Badge */}
      <span className="text-xs px-2 py-0.5 rounded bg-surface-3 text-muted font-medium hidden sm:inline">
        {roleLabels[userRole]}
      </span>

      {/* Notifications */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative w-8 h-8 flex items-center justify-center rounded hover:bg-surface-3 transition-colors text-muted hover:text-ink"
        aria-label="通知"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
      </button>

      {/* User Menu */}
      <div className="flex items-center gap-2 pl-2 border-l border-border">
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
          {getInitials(userName)}
        </div>
        <span className="text-sm font-medium text-ink hidden sm:inline">{userName}</span>
      </div>

      {/* Sign Out */}
      <button
        onClick={onSignOut}
        className="text-xs text-muted hover:text-ink px-2 py-1.5 rounded hover:bg-surface-3 transition-colors whitespace-nowrap flex items-center gap-1"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden md:inline">ログアウト</span>
      </button>
    </header>
  );
}
