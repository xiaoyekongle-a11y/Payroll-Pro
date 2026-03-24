"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  FolderOpen,
  Download,
  Search,
  Calendar,
  FileText,
  Lock,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PayrollRecord {
  id: string;
  period: string;
  employeeCount: number;
  totalAmount: number;
  status: "locked" | "draft";
  createdAt: string;
  updatedAt: string;
}

const demoRecords: PayrollRecord[] = [
  { id: "1", period: "2026年3月", employeeCount: 24, totalAmount: 12450000, status: "draft", createdAt: "2026-03-15", updatedAt: "2026-03-20" },
  { id: "2", period: "2026年2月", employeeCount: 24, totalAmount: 12100000, status: "locked", createdAt: "2026-02-15", updatedAt: "2026-02-28" },
  { id: "3", period: "2026年1月", employeeCount: 23, totalAmount: 11800000, status: "locked", createdAt: "2026-01-15", updatedAt: "2026-01-31" },
  { id: "4", period: "2025年12月", employeeCount: 23, totalAmount: 13200000, status: "locked", createdAt: "2025-12-15", updatedAt: "2025-12-28" },
  { id: "5", period: "2025年11月", employeeCount: 22, totalAmount: 11450000, status: "locked", createdAt: "2025-11-15", updatedAt: "2025-11-30" },
  { id: "6", period: "2025年10月", employeeCount: 22, totalAmount: 11200000, status: "locked", createdAt: "2025-10-15", updatedAt: "2025-10-31" },
];

export function HistoryPage() {
  const [selectedYear, setSelectedYear] = useState("2026");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecords = demoRecords.filter(
    (record) =>
      record.period.includes(selectedYear) &&
      (searchQuery === "" || record.period.includes(searchQuery))
  );

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-primary/10 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">給与履歴</h1>
            <p className="text-sm text-muted">過去の給与計算データを確認・ダウンロード</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-border rounded-[var(--radius)] text-sm bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-ring"
            />
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-border rounded-[var(--radius)] text-sm bg-surface cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-ring"
          >
            <option value="2026">2026年</option>
            <option value="2025">2025年</option>
            <option value="2024">2024年</option>
          </select>
        </div>
      </div>

      {/* Records List */}
      <Card>
        <CardHeader>
          <Calendar className="w-4 h-4 text-primary" />
          給与計算履歴
          <Badge variant="default" className="ml-auto">{filteredRecords.length}件</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-sub">対象期間</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-ink-sub">従業員数</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-ink-sub">支給総額</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-ink-sub">状態</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-ink-sub">更新日</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-ink-sub">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-border-2 last:border-0 hover:bg-surface-3 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted" />
                      <span className="font-medium">{record.period}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-mono">{record.employeeCount}名</td>
                  <td className="px-4 py-4 text-right font-mono font-medium">
                    {formatCurrency(record.totalAmount)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge variant={record.status === "locked" ? "success" : "default"}>
                      {record.status === "locked" ? (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          確定済み
                        </>
                      ) : (
                        "下書き"
                      )}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-center text-muted text-xs font-mono">
                    {record.updatedAt}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-3.5 h-3.5" />
                        詳細
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-3.5 h-3.5" />
                        DL
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12 text-muted">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>該当する履歴がありません</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">年間支給総額</p>
            <p className="text-xl font-mono font-bold text-primary">
              {formatCurrency(demoRecords.filter(r => r.period.includes(selectedYear)).reduce((s, r) => s + r.totalAmount, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">月平均支給額</p>
            <p className="text-xl font-mono font-bold">
              {formatCurrency(
                Math.round(
                  demoRecords.filter(r => r.period.includes(selectedYear)).reduce((s, r) => s + r.totalAmount, 0) /
                  Math.max(1, demoRecords.filter(r => r.period.includes(selectedYear)).length)
                )
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">確定済み期間</p>
            <p className="text-xl font-mono font-bold text-success">
              {demoRecords.filter(r => r.period.includes(selectedYear) && r.status === "locked").length} / {demoRecords.filter(r => r.period.includes(selectedYear)).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
