"use client"

import { useState, useCallback } from "react"
import { StockForm } from "@/components/stock-form"
import { ProgressIndicator, type ProgressState, type ProgressStatus } from "@/components/progress-indicator"
import { FinancialTabs } from "@/components/financial-tabs"
import { ExportButton } from "@/components/export-button"
import type { FinancialDataRow } from "@/lib/financial-utils"
import { FileSpreadsheet, TrendingUp, Building2 } from "lucide-react"

type ReportType = "balance" | "income" | "cashflow"

interface ReportData {
  dates: string[]
  rows: FinancialDataRow[]
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [stockCode, setStockCode] = useState<string | null>(null)
  const [data, setData] = useState<Record<ReportType, ReportData> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressState>({
    balance: "pending",
    income: "pending",
    cashflow: "pending",
  })

  const handleSubmit = useCallback(async (code: string, years: number) => {
    setIsLoading(true)
    setError(null)
    setData(null)
    setStockCode(code)

    // Reset progress
    setProgress({
      balance: "loading",
      income: "pending",
      cashflow: "pending",
    })

    try {
      const updateProgress = (type: ReportType, status: ProgressStatus) => {
        setProgress((prev) => ({ ...prev, [type]: status }))
      }

      // Start fetching all data
      const response = await fetch("/api/financial-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockCode: code, years }),
      })

      // Update progress as if processing each report
      updateProgress("balance", "complete")
      await new Promise((resolve) => setTimeout(resolve, 200))

      updateProgress("income", "loading")
      await new Promise((resolve) => setTimeout(resolve, 300))
      updateProgress("income", "complete")

      updateProgress("cashflow", "loading")
      await new Promise((resolve) => setTimeout(resolve, 200))
      updateProgress("cashflow", "complete")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "获取数据失败")
      }

      const result = await response.json()
      console.log("[v0] API result:", result)

      if (!result.success) {
        throw new Error(result.error || "获取数据失败")
      }

      setData(result.data)
      setStockCode(result.stockCode)
    } catch (err) {
      console.error("[v0] Error:", err)
      setError(err instanceof Error ? err.message : "获取数据时发生错误")
      setProgress({
        balance: "error",
        income: "error",
        cashflow: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">财务报表提取工具</h1>
              <p className="text-sm text-muted-foreground">快速提取A股上市公司财务数据</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <section className="mb-8">
          <div className="bg-card rounded-2xl border shadow-sm p-6">
            <StockForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </section>

        {/* Progress Section - Only show when loading */}
        {isLoading && (
          <section className="mb-8">
            <ProgressIndicator progress={progress} />
          </section>
        )}

        {/* Error Display */}
        {error && (
          <section className="mb-8">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive">
              {error}
            </div>
          </section>
        )}

        {/* Results Section */}
        {data && stockCode && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/20 rounded-lg">
                  <Building2 className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{stockCode}</h2>
                  <p className="text-sm text-muted-foreground">财务报表数据</p>
                </div>
              </div>
              <ExportButton data={data} stockCode={stockCode} />
            </div>

            <FinancialTabs data={data} />
          </section>
        )}

        {/* Empty State */}
        {!data && !isLoading && !error && (
          <section className="py-16">
            <div className="text-center">
              <div className="inline-flex p-4 bg-muted/50 rounded-full mb-4">
                <TrendingUp className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">输入股票代码开始</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                支持沪深A股，输入6位数字代码或带前缀的代码（如：000063 或 SZ000063）
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
