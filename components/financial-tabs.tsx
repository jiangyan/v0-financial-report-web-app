"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FinancialTable } from "./financial-table"
import type { FinancialDataRow } from "@/lib/financial-utils"

type ReportType = "balance" | "income" | "cashflow"

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  balance: "资产负债表",
  income: "利润表",
  cashflow: "现金流量表",
}

interface ReportData {
  dates: string[]
  rows: FinancialDataRow[]
}

interface FinancialTabsProps {
  data: Record<ReportType, ReportData>
}

export function FinancialTabs({ data }: FinancialTabsProps) {
  const tabs: { type: ReportType; label: string }[] = [
    { type: "balance", label: REPORT_TYPE_LABELS.balance },
    { type: "income", label: REPORT_TYPE_LABELS.income },
    { type: "cashflow", label: REPORT_TYPE_LABELS.cashflow },
  ]

  return (
    <Tabs defaultValue="balance" className="w-full">
      <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl mb-4">
        {tabs.map(({ type, label }) => (
          <TabsTrigger
            key={type}
            value={type}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map(({ type }) => (
        <TabsContent key={type} value={type} className="mt-0">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <FinancialTable dates={data[type]?.dates || []} rows={data[type]?.rows || []} />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
