"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Building2,
  Users,
  CreditCard,
  Shield,
  Bell,
  Plus,
  Copy,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsTab = "company" | "departments" | "billing" | "notifications" | "security";

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "company", label: "会社情報", icon: <Building2 className="w-4 h-4" /> },
  { id: "departments", label: "部署管理", icon: <Users className="w-4 h-4" /> },
  { id: "billing", label: "請求・プラン", icon: <CreditCard className="w-4 h-4" /> },
  { id: "notifications", label: "通知設定", icon: <Bell className="w-4 h-4" /> },
  { id: "security", label: "セキュリティ", icon: <Shield className="w-4 h-4" /> },
];

const industryOptions = [
  { value: "", label: "-- 選択 --" },
  { value: "it", label: "IT・通信" },
  { value: "manufacturing", label: "製造業" },
  { value: "retail", label: "小売・流通" },
  { value: "medical", label: "医療・福祉" },
  { value: "construction", label: "建設" },
  { value: "service", label: "サービス業" },
  { value: "other", label: "その他" },
];

const departments = [
  { id: "1", name: "営業部", employeeCount: 8 },
  { id: "2", name: "開発部", employeeCount: 6 },
  { id: "3", name: "総務部", employeeCount: 5 },
  { id: "4", name: "経理部", employeeCount: 5 },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");
  const [inviteCode] = useState("DEMO2026ABC");

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">設定</h1>
          <p className="text-sm text-muted">会社情報・部署・プランの管理</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-surface-3 hover:text-ink"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 animate-fade-in">
          {activeTab === "company" && (
            <Card>
              <CardHeader>
                <Building2 className="w-4 h-4 text-primary" />
                会社情報
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="会社名" required defaultValue="株式会社サンプル" />
                  <Select label="業種" options={industryOptions} defaultValue="it" />
                  <Input label="代表者名" defaultValue="山田 一郎" />
                  <Input label="設立年月" type="month" defaultValue="2015-04" />
                  <Input label="電話番号" type="tel" defaultValue="03-1234-5678" />
                  <Input label="メールアドレス" type="email" defaultValue="info@sample.co.jp" />
                </div>
                <Input label="住所" defaultValue="東京都渋谷区〇〇1-2-3 サンプルビル5F" />
                
                <div className="pt-4 border-t border-border-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-ink-sub mb-2 block">
                    招待コード
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-surface-2 rounded-[var(--radius)] font-mono text-sm tracking-widest">
                      {inviteCode}
                    </code>
                    <Button variant="secondary" size="sm">
                      <Copy className="w-3.5 h-3.5" />
                      コピー
                    </Button>
                  </div>
                  <p className="text-xs text-muted mt-2">
                    このコードを共有することで、メンバーを招待できます
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button>変更を保存</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "departments" && (
            <Card>
              <CardHeader className="justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  部署管理
                </div>
                <Button size="sm">
                  <Plus className="w-3.5 h-3.5" />
                  部署を追加
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-2 border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-sub">部署名</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-ink-sub">所属人数</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-ink-sub">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.id} className="border-b border-border-2 last:border-0">
                        <td className="px-4 py-3 font-medium">{dept.name}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="default">{dept.employeeCount}名</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-light">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {activeTab === "billing" && (
            <Card>
              <CardHeader>
                <CreditCard className="w-4 h-4 text-primary" />
                請求・プラン
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-primary-light rounded-[var(--radius-lg)] border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">現在のプラン</span>
                    <Badge variant="primary">スタンダード</Badge>
                  </div>
                  <p className="text-2xl font-mono font-bold text-primary">9,800 円 / 月</p>
                  <p className="text-xs text-muted mt-1">従業員50名まで対応</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-[var(--radius-lg)]">
                    <h4 className="font-bold text-sm mb-2">ライト</h4>
                    <p className="text-xl font-mono font-bold">4,980 円 / 月</p>
                    <p className="text-xs text-muted">従業員10名まで</p>
                    <Button variant="secondary" size="sm" className="mt-3 w-full">
                      ダウングレード
                    </Button>
                  </div>
                  <div className="p-4 border border-border rounded-[var(--radius-lg)]">
                    <h4 className="font-bold text-sm mb-2">エンタープライズ</h4>
                    <p className="text-xl font-mono font-bold">29,800 円 / 月</p>
                    <p className="text-xs text-muted">従業員無制限</p>
                    <Button size="sm" className="mt-3 w-full">
                      アップグレード
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <Bell className="w-4 h-4 text-primary" />
                通知設定
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "給与計算完了通知", description: "計算が完了したらメールで通知" },
                  { label: "締め日リマインダー", description: "締め日の3日前に通知" },
                  { label: "扶養の壁アラート", description: "収入が壁に近づいたら通知" },
                  { label: "セキュリティアラート", description: "不審なログインを検知したら通知" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-surface-3 peer-focus:ring-2 peer-focus:ring-primary-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <Shield className="w-4 h-4 text-primary" />
                セキュリティ
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-bold text-sm mb-3">パスワード変更</h4>
                  <div className="space-y-3 max-w-md">
                    <Input label="現在のパスワード" type="password" />
                    <Input label="新しいパスワード" type="password" />
                    <Input label="パスワード確認" type="password" />
                    <Button>パスワードを変更</Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-2">
                  <h4 className="font-bold text-sm mb-3">二要素認証</h4>
                  <div className="flex items-center justify-between p-4 bg-surface-2 rounded-[var(--radius)]">
                    <div>
                      <p className="font-medium text-sm">二要素認証を有効化</p>
                      <p className="text-xs text-muted">ログイン時に追加の認証を要求</p>
                    </div>
                    <Button variant="secondary">設定する</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
