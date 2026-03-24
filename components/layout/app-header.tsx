"use client";

import { cn, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Bell, Moon, Sun, LogOut, Building2 } from "lucide-react";
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
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const roleLabels = {
    owner: "OWNER",
    editor: "EDITOR",
    viewer: "VIEWER",
  };

  return (
    <header className="h-[var(--header-height)] bg-primary text-white px-5 flex items-center gap-3 sticky top-0 z-50 shadow-[0_2px_8px_rgba(26,86,219,0.3)]">
      {/* Logo */}
      <div className="font-bold text-lg tracking-tight whitespace-nowrap">
        <span className="text-white">Sala</span>
        <span className="text-white/55">rio</span>
      </div>

      {/* Company Badge */}
      <div className="text-xs text-white/70 font-mono px-2.5 py-1 border border-white/20 rounded-full bg-white/10 truncate max-w-[160px]">
        {companyName}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Role Badge */}
      <span className="text-[0.55rem] font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 text-white hidden sm:inline">
        {roleLabels[userRole]}
      </span>

      {/* Notifications */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative w-8 h-8 flex items-center justify-center rounded-[var(--radius)] bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
        aria-label="通知"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-[0.55rem] font-bold rounded-full flex items-center justify-center">
          3
        </span>
      </button>

      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-white/30 transition-colors">
        {getInitials(userName)}
      </div>

      {/* Switch Company */}
      <button
        onClick={onSwitchCompany}
        className="text-xs text-white/90 px-3 py-1.5 rounded-[var(--radius)] bg-white/10 border border-white/20 hover:bg-white/20 transition-colors whitespace-nowrap hidden sm:flex items-center gap-1.5"
      >
        <Building2 className="w-3.5 h-3.5" />
        会社切替
      </button>

      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
        aria-label="ダークモード切替"
      >
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Sign Out */}
      <button
        onClick={onSignOut}
        className="text-xs text-white/90 px-3 py-1.5 rounded-[var(--radius)] bg-white/10 border border-white/20 hover:bg-white/20 transition-colors whitespace-nowrap hidden md:flex items-center gap-1.5"
      >
        <LogOut className="w-3.5 h-3.5" />
        ログアウト
      </button>
    </header>
  );
}
