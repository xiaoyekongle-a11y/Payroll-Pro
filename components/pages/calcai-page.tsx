"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Zap,
  Upload,
  Play,
  CheckCircle,
  AlertCircle,
  FileText,
  Calculator,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

const presets = [
  { id: "standard", label: "標準計算", description: "基本給 + 残業手当 + 通勤手当" },
  { id: "hourly", label: "時給計算", description: "時給 x 勤務時間" },
  { id: "daily", label: "日給計算", description: "日給 x 出勤日数" },
  { id: "custom", label: "カスタム", description: "独自の計算式を設定" },
];

const employeeTypeOptions = [
  { value: "fulltime", label: "正社員" },
  { value: "parttime", label: "パート・アルバイト" },
  { value: "contract", label: "契約社員" },
];

export function CalcAIPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedPreset, setSelectedPreset] = useState("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<null | { total: number; breakdown: { label: string; value: number }[] }>(null);

  const steps = [
    { number: 1, label: "条件設定" },
    { number: 2, label: "データ入力" },
    { number: 3, label: "計算実行" },
    { number: 4, label: "結果確認" },
  ];

  const handleCalculate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setResults({
        total: 405500,
        breakdown: [
          { label: "基本給", value: 350000 },
          { label: "時間外手当", value: 45000 },
          { label: "通勤手当", value: 15000 },
          { label: "健康保険料", value: -18500 },
          { label: "厚生年金", value: -32940 },
          { label: "雇用保険", value: -1860 },
          { label: "所得税", value: -12200 },
          { label: "住民税", value: -24000 },
        ],
      });
      setIsProcessing(false);
      setCurrentStep(4);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-primary flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">CalcAI - 自動給与計算</h1>
          <p className="text-sm text-muted">条件を設定するだけで自動的に給与を計算します</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.number as Step)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all",
                currentStep === step.number
                  ? "bg-primary text-white shadow-md"
                  : currentStep > step.number
                  ? "bg-success-light text-success"
                  : "bg-surface-3 text-muted"
              )}
            >
              {currentStep > step.number ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-current/20 text-xs flex items-center justify-center">
                  {step.number}
                </span>
              )}
              {step.label}
            </button>
            {index < steps.length - 1 && (
              <ArrowRight className="w-4 h-4 text-muted mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="animate-fade-in">
        {/* Step 1: Preset Selection */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <Calculator className="w-4 h-4 text-primary" />
              計算プリセットを選択
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={cn(
                      "p-4 rounded-[var(--radius-lg)] border-2 text-left transition-all",
                      selectedPreset === preset.id
                        ? "border-primary bg-primary-light"
                        : "border-border hover:border-muted-2"
                    )}
                  >
                    <div className="font-bold text-sm mb-1">{preset.label}</div>
                    <div className="text-xs text-muted">{preset.description}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setCurrentStep(2)}>
                  次へ
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Data Input */}
        {currentStep === 2 && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <FileText className="w-4 h-4 text-primary" />
                基本情報
              </CardHeader>
              <CardContent className="space-y-4">
                <Select label="雇用形態" options={employeeTypeOptions} defaultValue="fulltime" />
                <Input label="基本給" type="number" defaultValue="350000" />
                <Input label="所定労働時間" type="number" hint="月あたり" defaultValue="160" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Upload className="w-4 h-4 text-primary" />
                勤怠データ
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="実働時間" type="number" defaultValue="168" />
                <Input label="時間外労働" type="number" hint="25%増" defaultValue="8" />
                <Input label="深夜労働" type="number" hint="50%増" defaultValue="0" />
                <Input label="休日労働" type="number" hint="35%増" defaultValue="0" />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <Sparkles className="w-4 h-4 text-primary" />
                手当・控除
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Input label="通勤手当" type="number" defaultValue="15000" />
                  <Input label="住宅手当" type="number" defaultValue="0" />
                  <Input label="家族手当" type="number" defaultValue="0" />
                </div>
              </CardContent>
            </Card>

            <div className="md:col-span-2 flex justify-between">
              <Button variant="secondary" onClick={() => setCurrentStep(1)}>
                戻る
              </Button>
              <Button onClick={() => setCurrentStep(3)}>
                次へ
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Calculate */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <Zap className="w-4 h-4 text-primary" />
              計算実行
            </CardHeader>
            <CardContent className="text-center py-12">
              {isProcessing ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
                  <p className="text-muted">計算中...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mx-auto">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">準備完了</h3>
                    <p className="text-sm text-muted mb-6">入力されたデータを基に給与を計算します</p>
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button variant="secondary" onClick={() => setCurrentStep(2)}>
                      戻る
                    </Button>
                    <Button size="lg" onClick={handleCalculate}>
                      <Zap className="w-5 h-5" />
                      計算を実行
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Results */}
        {currentStep === 4 && results && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="bg-primary text-white">
                <CheckCircle className="w-4 h-4" />
                計算完了
              </CardHeader>
              <CardContent className="py-8">
                <div className="text-center mb-8">
                  <p className="text-sm text-muted mb-2">差引支給額</p>
                  <p className="text-4xl font-bold text-primary font-mono">
                    {formatCurrency(results.total)}
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  {results.breakdown.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between py-2 border-b border-border-2 last:border-0"
                    >
                      <span className="text-sm text-muted">{item.label}</span>
                      <span
                        className={cn(
                          "font-mono font-medium",
                          item.value < 0 ? "text-danger" : "text-ink"
                        )}
                      >
                        {item.value < 0 ? "-" : ""}
                        {formatCurrency(Math.abs(item.value))}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
              <Button variant="secondary" onClick={() => setCurrentStep(1)}>
                新規計算
              </Button>
              <Button>
                <FileText className="w-4 h-4" />
                給与明細を出力
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
