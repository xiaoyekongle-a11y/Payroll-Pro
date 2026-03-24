"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RegisterFormProps {
  onRegister: (data: { companyName: string; userName: string; email: string; password: string }) => void;
  onSwitchTab: (tab: "login" | "register" | "join") => void;
}

export function RegisterForm({ onRegister, onSwitchTab }: RegisterFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!companyName) {
      setError("会社名を入力してください");
      setLoading(false);
      return;
    }

    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      setLoading(false);
      return;
    }

    setTimeout(() => {
      onRegister({ companyName, userName, email, password });
      setLoading(false);
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="会社名"
        required
        type="text"
        placeholder="株式会社〇〇"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
      />
      <Input
        label="あなたの名前"
        type="text"
        placeholder="山田 太郎"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <Input
        label="メールアドレス"
        type="email"
        placeholder="email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="パスワード"
        hint="6文字以上"
        type="password"
        placeholder="********"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      {error && (
        <div className="text-sm text-danger bg-danger-light px-3 py-2 rounded-[var(--radius)] border border-danger/20">
          {error}
        </div>
      )}
      
      <Button type="submit" className="w-full" loading={loading}>
        会社アカウントを作成
      </Button>
      
      <p className="text-center text-xs text-muted">
        すでにアカウントをお持ちの方は{" "}
        <button
          type="button"
          className="text-primary hover:underline font-medium"
          onClick={() => onSwitchTab("login")}
        >
          ログイン
        </button>
      </p>
    </form>
  );
}
