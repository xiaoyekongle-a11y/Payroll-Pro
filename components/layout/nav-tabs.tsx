"use client";

import { cn } from "@/lib/utils";
import {
  Zap,
  LayoutDashboard,
  FolderOpen,
  FileText,
  Settings,
  Clock,
  FileCheck,
  Building,
  Percent,
  Users,
} from "lucide-react";

export type NavPage =
  | "calcai"
  | "dashboard"
  | "history"
  | "payroll"
  | "settings"
  | "attendance"
  | "yearend"
  | "shahou"
  | "taxrates"
  | "users";

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
  advanced?: boolean;
}

interface NavTabsProps {
  activePage: NavPage;
  onPageChange: (page: NavPage) => void;
  userRole: "owner" | "editor" | "viewer";
  showAdvanced?: boolean;
}

const navItems: NavItem[] = [
  { id: "calcai", label: "自動計算", icon: <Zap className="w-4 h-4" /> },
  { id: "dashboard", label: "ダッシュボード", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "history", label: "履歴", icon: <FolderOpen className="w-4 h-4" /> },
  { id: "payroll", label: "給与計算", icon: <FileText className="w-4 h-4" /> },
  { id: "settings", label: "設定", icon: <Settings className="w-4 h-4" />, ownerOnly: true },
  { id: "attendance", label: "勤怠", icon: <Clock className="w-4 h-4" />, advanced: true },
  { id: "yearend", label: "年末調整", icon: <FileCheck className="w-4 h-4" />, advanced: true },
  { id: "shahou", label: "社保", icon: <Building className="w-4 h-4" />, ownerOnly: true, advanced: true },
  { id: "taxrates", label: "税率", icon: <Percent className="w-4 h-4" />, advanced: true },
  { id: "users", label: "ユーザー", icon: <Users className="w-4 h-4" />, ownerOnly: true, advanced: true },
];

export function NavTabs({ activePage, onPageChange, userRole, showAdvanced = true }: NavTabsProps) {
  const visibleItems = navItems.filter((item) => {
    if (item.ownerOnly && userRole !== "owner") return false;
    if (item.advanced && !showAdvanced) return false;
    return true;
  });

  return (
    <nav className="h-[var(--nav-height)] bg-surface border-b-2 border-border-2 flex px-3 overflow-x-auto scrollbar-hide shadow-[0_1px_4px_rgba(0,0,0,0.06)] sticky top-[var(--header-height)] z-40">
      {visibleItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onPageChange(item.id)}
          className={cn(
            "h-full px-4 flex items-center gap-2 text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-150 border-b-2 -mb-0.5 flex-shrink-0",
            activePage === item.id
              ? "text-primary border-primary bg-primary-light"
              : "text-muted border-transparent hover:text-ink hover:bg-surface-3",
            item.id === "calcai" && activePage !== "calcai" && "text-primary font-bold"
          )}
        >
          {item.icon}
          <span className="hidden sm:inline">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
