"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Save,
  Lock,
  Unlock,
  FileText,
  FileSpreadsheet,
  FileDown,
  Upload,
  ClipboardCopy,
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  Calculator,
  Minus as MinusIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "draft" | "confirmed";
}

const demoEmployees: Employee[] = [
  { id: "1", name: "山田 太郎", department: "営業部", position: "課長", baseSalary: 450000, allowances: 45000, deductions: 89500, netPay: 405500, status: "confirmed" },
  { id: "2", name: "佐藤 花子", department: "開発部", position: "主任", baseSalary: 380000, allowances: 38000, deductions: 75600, netPay: 342400, status: "confirmed" },
  { id: "3", name: "田中 次郎", department: "総務部", position: "一般", baseSalary: 320000, allowances: 25000, deductions: 62000, netPay: 283000, status: "draft" },
  { id: "4", name: "鈴木 美咲", department: "経理部", position: "係長", baseSalary: 400000, allowances: 35000, deductions: 78500, netPay: 356500, status: "confirmed" },
  { id: "5", name: "高橋 健一", department: "営業部", position: "部長", baseSalary: 550000, allowances: 65000, deductions: 112000, netPay: 503000, status: "confirmed" },
  { id: "6", name: "伊藤 あかり", department: "開発部", position: "一般", baseSalary: 300000, allowances: 20000, deductions: 57600, netPay: 262400, status: "draft" },
];

const monthOptions = [
  { value: "2026-03", label: "2026年3月" },
  { value: "2026-02", label: "2026年2月" },
  { value: "2026-01", label: "2026年1月" },
  { value: "2025-12", label: "2025年12月" },
];

const departmentOptions = [
  { value: "", label: "-- 選択 --" },
  { value: "sales", label: "営業部" },
  { value: "dev", label: "開発部" },
  { value: "admin", label: "総務部" },
  { value: "accounting", label: "経理部" },
];

const positionOptions = [
  { value: "", label: "-- 選択 --" },
  { value: "general", label: "一般" },
  { value: "chief", label: "主任" },
  { value: "subsection", label: "係長" },
  { value: "section", label: "課長" },
  { value: "division", label: "部長" },
];

interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function AccordionSection({ title, icon, defaultOpen = true, children }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-2 hover:bg-primary-light transition-colors text-sm font-bold text-ink-sub"
      >
        <div className="flex items-center gap-2">
          {icon}
          {title}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && <div className="p-4 bg-surface">{children}</div>}
    </div>
  );
}

export function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const [isLocked, setIsLocked] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>("1");
  const [employees] = useState<Employee[]>(demoEmployees);

  const currentEmployee = employees.find((e) => e.id === selectedEmployee);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Period Bar */}
      <div className="flex-shrink-0 bg-surface border-b border-border px-6 py-3 flex items-center gap-4 flex-wrap shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-[0.62rem] font-bold uppercase tracking-widest text-muted">対象年月</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-[var(--radius)] font-mono text-sm bg-surface cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-ring"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {isLocked && (
            <Badge variant="primary" className="gap-1">
              <Lock className="w-3 h-3" />
              確定済み
            </Badge>
          )}
        </div>

        <div className="flex-1" />

        {/* Action Clusters */}
        <div className="flex items-center border border-border rounded-[var(--radius)] overflow-hidden bg-surface">
          <span className="text-[0.55rem] font-bold uppercase tracking-wider text-muted px-3 bg-surface-2 h-full flex items-center border-r border-border">確定</span>
          <Button variant="success" size="sm" className="rounded-none border-0">
            <Save className="w-3.5 h-3.5" />
            保存
          </Button>
          {isLocked ? (
            <Button variant="danger" size="sm" className="rounded-none border-0 border-l border-border" onClick={() => setIsLocked(false)}>
              <Unlock className="w-3.5 h-3.5" />
              解除
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="rounded-none border-0 border-l border-border" onClick={() => setIsLocked(true)}>
              <Lock className="w-3.5 h-3.5" />
              ロック
            </Button>
          )}
        </div>

        <div className="flex items-center border border-border rounded-[var(--radius)] overflow-hidden bg-surface">
          <span className="text-[0.55rem] font-bold uppercase tracking-wider text-muted px-3 bg-surface-2 h-full flex items-center border-r border-border">出力</span>
          <Button variant="primary" size="sm" className="rounded-none border-0">
            <FileText className="w-3.5 h-3.5" />
            PDF
          </Button>
          <Button variant="secondary" size="sm" className="rounded-none border-0 border-l border-border">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </Button>
          <Button variant="secondary" size="sm" className="rounded-none border-0 border-l border-border">
            <FileDown className="w-3.5 h-3.5" />
            CSV
          </Button>
        </div>

        <div className="flex items-center border border-border rounded-[var(--radius)] overflow-hidden bg-surface">
          <span className="text-[0.55rem] font-bold uppercase tracking-wider text-muted px-3 bg-surface-2 h-full flex items-center border-r border-border">入力</span>
          <Button variant="secondary" size="sm" className="rounded-none border-0">
            <Upload className="w-3.5 h-3.5" />
            インポート
          </Button>
          <Button variant="secondary" size="sm" className="rounded-none border-0 border-l border-border">
            <ClipboardCopy className="w-3.5 h-3.5" />
            テンプレ
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Employee Form */}
        <div className="w-[360px] flex-shrink-0 border-r border-border overflow-y-auto p-4 bg-paper">
          <Button variant="secondary" size="sm" className="w-full mb-4 justify-center">
            <ClipboardCopy className="w-3.5 h-3.5" />
            前月の数値をコピー
          </Button>

          <AccordionSection title="基本情報" icon={<User className="w-4 h-4" />}>
            <div className="space-y-3">
              <Input label="従業員名" required placeholder="田中 太郎" defaultValue={currentEmployee?.name} />
              <div className="grid grid-cols-2 gap-3">
                <Select label="部署" options={departmentOptions} defaultValue="" />
                <Select label="役職" options={positionOptions} defaultValue="" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="年齢" type="number" defaultValue="35" />
                <Input label="業績係数" type="number" defaultValue="1.0" />
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="給与情報" icon={<Briefcase className="w-4 h-4" />}>
            <div className="space-y-3">
              <Input label="基本給" type="number" defaultValue={currentEmployee?.baseSalary} />
              <Input label="時間外手当" type="number" defaultValue="0" />
              <Input label="通勤手当" type="number" defaultValue="15000" />
            </div>
          </AccordionSection>

          <AccordionSection title="諸手当" icon={<Plus className="w-4 h-4" />} defaultOpen={false}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input placeholder="手当名" className="flex-1" />
                <Input type="number" placeholder="金額" className="w-28" />
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <Trash2 className="w-4 h-4 text-danger" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full border-2 border-dashed border-border text-muted hover:border-primary hover:text-primary">
                <Plus className="w-3.5 h-3.5" />
                手当を追加
              </Button>
            </div>
          </AccordionSection>

          <AccordionSection title="控除" icon={<MinusIcon className="w-4 h-4" />} defaultOpen={false}>
            <div className="space-y-3">
              <Input label="健康保険" type="number" defaultValue="18500" />
              <Input label="厚生年金" type="number" defaultValue="32940" />
              <Input label="雇用保険" type="number" defaultValue="1860" />
              <Input label="所得税" type="number" defaultValue="12200" />
              <Input label="住民税" type="number" defaultValue="24000" />
            </div>
          </AccordionSection>

          <AccordionSection title="計算結果" icon={<Calculator className="w-4 h-4" />}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border-2">
                <span className="text-muted">総支給額</span>
                <span className="font-mono font-bold">{formatCurrency((currentEmployee?.baseSalary || 0) + (currentEmployee?.allowances || 0))}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-2">
                <span className="text-muted">控除合計</span>
                <span className="font-mono font-bold text-danger">- {formatCurrency(currentEmployee?.deductions || 0)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-bold text-ink">差引支給額</span>
                <span className="font-mono font-bold text-xl text-primary">{formatCurrency(currentEmployee?.netPay || 0)}</span>
              </div>
            </div>
          </AccordionSection>
        </div>

        {/* Right Panel - Employee Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-surface border border-border rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="bg-surface-2">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-sub border-b-2 border-border">従業員名</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-sub border-b-2 border-border">部署</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-sub border-b-2 border-border">役職</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-ink-sub border-b-2 border-border">基本給</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-ink-sub border-b-2 border-border">手当</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-ink-sub border-b-2 border-border">控除</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-ink-sub border-b-2 border-border">差引支給額</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-ink-sub border-b-2 border-border">状態</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp.id)}
                    className={cn(
                      "cursor-pointer transition-colors border-b border-border-2 last:border-b-0",
                      selectedEmployee === emp.id ? "bg-primary-light" : "hover:bg-surface-3"
                    )}
                  >
                    <td className="px-4 py-3 font-medium">{emp.name}</td>
                    <td className="px-4 py-3 text-muted">{emp.department}</td>
                    <td className="px-4 py-3 text-muted">{emp.position}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(emp.baseSalary)}</td>
                    <td className="px-4 py-3 text-right font-mono text-success">+{formatNumber(emp.allowances)}</td>
                    <td className="px-4 py-3 text-right font-mono text-danger">-{formatNumber(emp.deductions)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{formatNumber(emp.netPay)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={emp.status === "confirmed" ? "success" : "default"}>
                        {emp.status === "confirmed" ? "確定" : "下書き"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-surface-2 font-bold">
                  <td className="px-4 py-3" colSpan={3}>合計 ({employees.length}名)</td>
                  <td className="px-4 py-3 text-right font-mono">{formatNumber(employees.reduce((s, e) => s + e.baseSalary, 0))}</td>
                  <td className="px-4 py-3 text-right font-mono text-success">+{formatNumber(employees.reduce((s, e) => s + e.allowances, 0))}</td>
                  <td className="px-4 py-3 text-right font-mono text-danger">-{formatNumber(employees.reduce((s, e) => s + e.deductions, 0))}</td>
                  <td className="px-4 py-3 text-right font-mono text-primary text-lg">{formatNumber(employees.reduce((s, e) => s + e.netPay, 0))}</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
