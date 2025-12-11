"use client"

import { formatNumber } from "@/lib/financial-utils"
import type { FinancialDataRow } from "@/lib/financial-utils"

interface FinancialTableProps {
  dates: string[]
  rows: FinancialDataRow[]
}

export function FinancialTable({ dates, rows }: FinancialTableProps) {
  // Format date for display (2024-12-31 -> 2024Q4)
  const formatDateHeader = (date: string): string => {
    const [year, month] = date.split("-")
    const quarterMap: Record<string, string> = {
      "03": "Q1",
      "06": "Q2",
      "09": "Q3",
      "12": "Q4",
    }
    return `${year}${quarterMap[month] || ""}`
  }

  const getIndentClass = (level: number): string => {
    switch (level) {
      case 0:
        return "font-semibold bg-muted/50"
      case 1:
        return "pl-4"
      case 2:
        return "pl-8 text-muted-foreground"
      case 3:
        return "pl-12 text-muted-foreground text-sm"
      default:
        return ""
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="sticky left-0 bg-muted/30 text-left py-3 px-4 font-medium min-w-[240px]">项目</th>
            {dates.map((date) => (
              <th key={date} className="text-right py-3 px-4 font-medium min-w-[120px]">
                {formatDateHeader(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${row.name}-${index}`}
              className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${getIndentClass(row.level)}`}
            >
              <td
                className={`sticky left-0 bg-background py-2.5 px-4 ${row.level === 0 ? "bg-muted/50 font-semibold" : ""}`}
              >
                {row.name}
              </td>
              {dates.map((date) => (
                <td key={date} className="text-right py-2.5 px-4 tabular-nums">
                  {formatNumber(row.values[date])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
