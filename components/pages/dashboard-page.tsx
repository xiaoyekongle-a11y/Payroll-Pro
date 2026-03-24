"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Zap,
  Clock,
  FileCheck,
  Building,
  FolderOpen,
  TrendingUp,
  AlertTriangle,
  Download,
} from "lucide-react";
import { TrendChart } from "@/components/charts/trend-chart";
import { DeptDonutChart } from "@/components/charts/dept-donut-chart";

import type { NavPage } from "@/components/layout/nav-tabs";

interface DashboardPageProps {
  onNavigate: (page: NavPage) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  // Demo data
  const stats = {
    totalPayroll: 12450000,
    employeeCount: 24,
    avgSalary: 518750,
    socialInsurance: 1867500,
  };

  const budgetData = {
    budget: 13000000,
    actual: 12450000,
    variance: 550000,
    variancePercent: 4.2,
  };

  const wallAlerts = [
    { name: "佐藤 花子", currentYtd: 980000, wall: 1030000, type: "103万円の壁" },
    { name: "田中 次郎", currentYtd: 1250000, wall: 1300000, type: "130万円の壁" },
  ];

  return (
    <div className="p-6 max-w-[1280px] mx-auto space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="今月の人件費合計"
          value={formatCurrency(stats.totalPayroll)}
          subtext="前月比"
          trend={{ value: "+2.3%", direction: "up" }}
          variant="blue"
        />
        <StatCard
          label="従業員数"
          value={`${stats.employeeCount}名`}
          subtext="正社員 18名 / パート 6名"
          variant="green"
        />
        <StatCard
          label="平均給与"
          value={formatCurrency(stats.avgSalary)}
          trend={{ value: "+1.8%", direction: "up" }}
          variant="amber"
        />
        <StatCard
          label="社会保険料合計"
          value={formatCurrency(stats.socialInsurance)}
          subtext="会社負担分"
          variant="red"
        />
      </div>

      {/* Budget & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget Panel */}
        <Card>
          <CardHeader>
            <TrendingUp className="w-4 h-4 text-primary" />
            今月の予実管理
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">予算</span>
              <span className="font-mono font-medium">{formatCurrency(budgetData.budget)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">実績</span>
              <span className="font-mono font-medium">{formatCurrency(budgetData.actual)}</span>
            </div>
            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(budgetData.actual / budgetData.budget) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border-2">
              <span className="text-sm font-medium text-success">予算残</span>
              <span className="font-mono font-bold text-success">
                {formatCurrency(budgetData.variance)} ({budgetData.variancePercent}%)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Wall Alerts */}
        <Card>
          <CardHeader>
            <AlertTriangle className="w-4 h-4 text-warning" />
            扶養の壁アラート
          </CardHeader>
          <CardContent>
            {wallAlerts.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">アラートはありません</p>
            ) : (
              <div className="space-y-3">
                {wallAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-warning-light rounded-[var(--radius)] border border-warning/20"
                  >
                    <div>
                      <div className="font-medium text-sm">{alert.name}</div>
                      <div className="text-xs text-muted">
                        現在: {formatCurrency(alert.currentYtd)} / {alert.type}
                      </div>
                    </div>
                    <div className="text-xs font-mono text-warning font-bold">
                      残り {formatCurrency(alert.wall - alert.currentYtd)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              月別人件費推移
            </div>
            <Button variant="secondary" size="sm">
              <Download className="w-3.5 h-3.5" />
              レポート出力
            </Button>
          </CardHeader>
          <CardContent>
            <TrendChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-4 h-4 rounded-full bg-primary/20" />
            部署別人件費比率
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <DeptDonutChart />
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <Zap className="w-4 h-4 text-primary" />
          クイックアクセス
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <Button
              variant="primary"
              className="flex-col h-auto py-4 gap-2"
              onClick={() => onNavigate("calcai" as NavPage)}
            >
              <Zap className="w-6 h-6" />
              <span className="text-xs">CalcAI</span>
            </Button>
            <Button
              variant="secondary"
              className="flex-col h-auto py-4 gap-2"
              onClick={() => onNavigate("attendance" as NavPage)}
            >
              <Clock className="w-6 h-6" />
              <span className="text-xs">勤怠管理</span>
            </Button>
            <Button
              variant="secondary"
              className="flex-col h-auto py-4 gap-2"
              onClick={() => onNavigate("yearend" as NavPage)}
            >
              <FileCheck className="w-6 h-6" />
              <span className="text-xs">年末調整</span>
            </Button>
            <Button
              variant="secondary"
              className="flex-col h-auto py-4 gap-2"
              onClick={() => onNavigate("shahou" as NavPage)}
            >
              <Building className="w-6 h-6" />
              <span className="text-xs">社保届出</span>
            </Button>
            <Button
              variant="secondary"
              className="flex-col h-auto py-4 gap-2"
              onClick={() => onNavigate("history" as NavPage)}
            >
              <FolderOpen className="w-6 h-6" />
              <span className="text-xs">給与履歴</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
