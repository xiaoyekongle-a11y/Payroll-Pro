"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { JoinForm } from "./join-form";

type AuthTab = "login" | "register" | "join";

interface AuthScreenProps {
  onAuthSuccess: (userData: {
    email: string;
    name: string;
    companyName?: string;
  }) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");

  const tabs: { id: AuthTab; label: string }[] = [
    { id: "login", label: "ログイン" },
    { id: "register", label: "新規登録" },
    { id: "join", label: "招待で参加" },
  ];

  const handleLogin = (email: string) => {
    onAuthSuccess({ email, name: "デモユーザー" });
  };

  const handleRegister = (data: { companyName: string; userName: string; email: string; password: string }) => {
    onAuthSuccess({
      email: data.email,
      name: data.userName || "管理者",
      companyName: data.companyName,
    });
  };

  const handleJoin = (data: { userName: string; email: string; password: string; inviteCode: string }) => {
    onAuthSuccess({
      email: data.email,
      name: data.userName || "メンバー",
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-paper">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-primary">Sala</span>
            <span className="text-ink">rio</span>
          </h1>
          <p className="text-[0.68rem] text-muted uppercase tracking-[0.14em] mt-1">
            給与計算プラットフォーム
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 shadow-lg">
          {/* Tabs */}
          <div className="flex bg-surface-2 rounded-[var(--radius)] p-0.5 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 text-center py-2 px-2 text-[0.68rem] font-bold tracking-wide rounded-[calc(var(--radius)-1px)] transition-all duration-150",
                  activeTab === tab.id
                    ? "bg-surface text-primary shadow-xs"
                    : "text-muted hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Forms */}
          <div className="animate-fade-in">
            {activeTab === "login" && (
              <LoginForm onLogin={handleLogin} onSwitchTab={setActiveTab} />
            )}
            {activeTab === "register" && (
              <RegisterForm onRegister={handleRegister} onSwitchTab={setActiveTab} />
            )}
            {activeTab === "join" && (
              <JoinForm onJoin={handleJoin} onSwitchTab={setActiveTab} />
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-2 mt-6">
          中小企業のための給与計算ソリューション
        </p>
      </div>
    </div>
  );
}
