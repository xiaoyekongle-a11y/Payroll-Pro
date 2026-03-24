"use client";

import { useState } from "react";
import { AuthScreen } from "@/components/auth/auth-screen";
import { CompanySelect, type Company } from "@/components/auth/company-select";
import { AppShell } from "@/components/layout/app-shell";
import { type NavPage } from "@/components/layout/nav-tabs";
import { DashboardPage } from "@/components/pages/dashboard-page";
import { PayrollPage } from "@/components/pages/payroll-page";
import { CalcAIPage } from "@/components/pages/calcai-page";
import { HistoryPage } from "@/components/pages/history-page";
import { SettingsPage } from "@/components/pages/settings-page";

type AppScreen = "auth" | "company-select" | "app";

interface UserData {
  email: string;
  name: string;
}

const demoCompanies: Company[] = [
  { id: "1", name: "株式会社サンプル", role: "owner", employeeCount: 24 },
  { id: "2", name: "テスト商事", role: "editor", employeeCount: 12 },
];

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("auth");
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [activePage, setActivePage] = useState<NavPage>("dashboard");

  const handleAuthSuccess = (userData: { email: string; name: string; companyName?: string }) => {
    setUser({ email: userData.email, name: userData.name });
    
    if (userData.companyName) {
      // New registration - go directly to app
      const newCompany: Company = {
        id: "new",
        name: userData.companyName,
        role: "owner",
        employeeCount: 0,
      };
      setSelectedCompany(newCompany);
      setScreen("app");
    } else {
      // Existing user - show company selection
      setScreen("company-select");
    }
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setScreen("app");
  };

  const handleCreateNewCompany = () => {
    // For demo, create a new company directly
    const newCompany: Company = {
      id: "new-" + Date.now(),
      name: "新規会社",
      role: "owner",
      employeeCount: 0,
    };
    setSelectedCompany(newCompany);
    setScreen("app");
  };

  const handleSignOut = () => {
    setUser(null);
    setSelectedCompany(null);
    setScreen("auth");
    setActivePage("dashboard");
  };

  const handleSwitchCompany = () => {
    setScreen("company-select");
  };

  const handlePageChange = (page: NavPage) => {
    setActivePage(page);
  };

  // Render current screen
  if (screen === "auth") {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  if (screen === "company-select") {
    return (
      <CompanySelect
        companies={demoCompanies}
        onSelect={handleCompanySelect}
        onCreateNew={handleCreateNewCompany}
        onSignOut={handleSignOut}
      />
    );
  }

  // App screen
  return (
    <AppShell
      companyName={selectedCompany?.name || ""}
      userName={user?.name || ""}
      userRole={selectedCompany?.role || "viewer"}
      activePage={activePage}
      onPageChange={handlePageChange}
      onSwitchCompany={handleSwitchCompany}
      onSignOut={handleSignOut}
    >
      {activePage === "dashboard" && <DashboardPage onNavigate={handlePageChange} />}
      {activePage === "payroll" && <PayrollPage />}
      {activePage === "calcai" && <CalcAIPage />}
      {activePage === "history" && <HistoryPage />}
      {activePage === "settings" && <SettingsPage />}
      {/* Placeholder pages for other tabs */}
      {activePage === "attendance" && (
        <div className="p-6 max-w-[1100px] mx-auto">
          <h1 className="text-xl font-bold mb-4">勤怠管理</h1>
          <p className="text-muted">勤怠管理機能は準備中です</p>
        </div>
      )}
      {activePage === "yearend" && (
        <div className="p-6 max-w-[1100px] mx-auto">
          <h1 className="text-xl font-bold mb-4">年末調整</h1>
          <p className="text-muted">年末調整機能は準備中です</p>
        </div>
      )}
      {activePage === "shahou" && (
        <div className="p-6 max-w-[1100px] mx-auto">
          <h1 className="text-xl font-bold mb-4">社会保険届出</h1>
          <p className="text-muted">社会保険届出機能は準備中です</p>
        </div>
      )}
      {activePage === "taxrates" && (
        <div className="p-6 max-w-[1100px] mx-auto">
          <h1 className="text-xl font-bold mb-4">税率設定</h1>
          <p className="text-muted">税率設定機能は準備中です</p>
        </div>
      )}
      {activePage === "users" && (
        <div className="p-6 max-w-[1100px] mx-auto">
          <h1 className="text-xl font-bold mb-4">ユーザー管理</h1>
          <p className="text-muted">ユーザー管理機能は準備中です</p>
        </div>
      )}
    </AppShell>
  );
}
