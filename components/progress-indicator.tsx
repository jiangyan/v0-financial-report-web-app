"use client"

import { CheckCircle2, Circle, Loader2 } from "lucide-react"

export type ProgressStatus = "pending" | "loading" | "complete" | "error"

export type ReportType = "balance" | "income" | "cashflow"

export interface ProgressState {
  balance: ProgressStatus
  income: ProgressStatus
  cashflow: ProgressStatus
}

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  balance: "资产负债表",
  income: "利润表",
  cashflow: "现金流量表",
}

interface ProgressIndicatorProps {
  progress: ProgressState
}

export function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const reportTypes: ReportType[] = ["balance", "income", "cashflow"]

  const getStatusIcon = (status: ProgressStatus) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "loading":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      case "error":
        return <Circle className="h-5 w-5 text-destructive" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusText = (status: ProgressStatus) => {
    switch (status) {
      case "complete":
        return "已完成"
      case "loading":
        return "提取中..."
      case "error":
        return "出错"
      default:
        return "等待中"
    }
  }

  return (
    <div className="bg-card rounded-xl border p-6 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">提取进度</h3>
      <div className="space-y-3">
        {reportTypes.map((type) => (
          <div key={type} className="flex items-center gap-3">
            {getStatusIcon(progress[type])}
            <span className="flex-1 text-sm font-medium">{REPORT_TYPE_LABELS[type]}</span>
            <span className="text-xs text-muted-foreground">{getStatusText(progress[type])}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
