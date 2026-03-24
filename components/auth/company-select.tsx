"use client";

import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, LogOut } from "lucide-react";

export interface Company {
  id: string;
  name: string;
  role: "owner" | "editor" | "viewer";
  employeeCount: number;
}

interface CompanySelectProps {
  companies: Company[];
  onSelect: (company: Company) => void;
  onCreateNew: () => void;
  onSignOut: () => void;
}

export function CompanySelect({ companies, onSelect, onCreateNew, onSignOut }: CompanySelectProps) {
  const roleLabels = {
    owner: { label: "OWNER", variant: "primary" as const },
    editor: { label: "EDITOR", variant: "purple" as const },
    viewer: { label: "VIEWER", variant: "default" as const },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-paper">
      <div className="w-full max-w-[540px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">会社を選択</h1>
          <p className="text-sm text-muted mt-1">参加している会社をクリックして開始</p>
        </div>

        {/* Company List */}
        <div className="space-y-3 mb-4">
          {companies.length === 0 ? (
            <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-8 text-center">
              <Building2 className="w-12 h-12 text-muted-2 mx-auto mb-3" />
              <p className="text-sm text-muted">参加している会社がありません</p>
              <p className="text-xs text-muted-2 mt-1">新しい会社を作成するか、招待コードで参加してください</p>
            </div>
          ) : (
            companies.map((company) => (
              <button
                key={company.id}
                onClick={() => onSelect(company)}
                className={cn(
                  "w-full bg-surface border border-border rounded-[var(--radius-lg)] p-4",
                  "flex items-center gap-4 text-left",
                  "shadow-xs transition-all duration-150",
                  "hover:border-primary hover:shadow-md hover:-translate-y-0.5 hover:bg-primary-light"
                )}
              >
                {/* Company Avatar */}
                <div className="w-11 h-11 rounded-[10px] bg-primary text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {getInitials(company.name)}
                </div>
                
                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-ink truncate">{company.name}</div>
                  <div className="text-xs text-muted font-mono mt-0.5">
                    {company.employeeCount} 名の従業員
                  </div>
                </div>
                
                {/* Role Badge */}
                <Badge variant={roleLabels[company.role].variant}>
                  {roleLabels[company.role].label}
                </Badge>
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full justify-center"
            onClick={onCreateNew}
          >
            <Plus className="w-4 h-4" />
            新しい会社を作成
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-center"
            onClick={onSignOut}
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </Button>
        </div>
      </div>
    </div>
  );
}
