"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  onSwitchTab: (tab: "login" | "register" | "join") => void;
}

export function LoginForm({ onLogin, onSwitchTab }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Demo validation
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      onLogin(email, password);
      setLoading(false);
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="メールアドレス"
        type="email"
        placeholder="email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="パスワード"
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
        ログイン
      </Button>
      
      <p className="text-center text-xs text-muted">
        アカウントをお持ちでない方は{" "}
        <button
          type="button"
          className="text-primary hover:underline font-medium"
          onClick={() => onSwitchTab("register")}
        >
          新規登録
        </button>
      </p>
    </form>
  );
}
