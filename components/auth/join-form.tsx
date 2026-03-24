"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JoinFormProps {
  onJoin: (data: { userName: string; email: string; password: string; inviteCode: string }) => void;
  onSwitchTab: (tab: "login" | "register" | "join") => void;
}

export function JoinForm({ onJoin, onSwitchTab }: JoinFormProps) {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!inviteCode) {
      setError("招待コードを入力してください");
      setLoading(false);
      return;
    }

    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      setLoading(false);
      return;
    }

    setTimeout(() => {
      onJoin({ userName, email, password, inviteCode });
      setLoading(false);
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <Input
        label="招待コード"
        type="text"
        placeholder="ABC12345"
        className="tracking-widest uppercase"
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
      />
      
      {error && (
        <div className="text-sm text-danger bg-danger-light px-3 py-2 rounded-[var(--radius)] border border-danger/20">
          {error}
        </div>
      )}
      
      <Button type="submit" className="w-full" loading={loading}>
        参加する
      </Button>
      
      <p className="text-center text-xs text-muted">
        招待コードがない方は{" "}
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
