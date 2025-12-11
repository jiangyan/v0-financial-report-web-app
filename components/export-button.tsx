"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { type FinancialDataRow, formatNumber } from "@/lib/financial-utils"
import * as XLSX from "xlsx"

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

interface ExportButtonProps {
  data: Record<ReportType, ReportData>
  stockCode: string
}

export function ExportButton({ data, stockCode }: ExportButtonProps) {
  const handleExport = () => {
    const workbook = XLSX.utils.book_new()

    const reportTypes: ReportType[] = ["balance", "income", "cashflow"]

    for (const type of reportTypes) {
      const reportData = data[type]
      if (!reportData) continue

      const { dates, rows } = reportData

      // Format dates for headers
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

      // Build sheet data
      const sheetData: string[][] = []

      // Header row
      sheetData.push(["项目", ...dates.map(formatDateHeader)])

      // Data rows
      for (const row of rows) {
        const indent = "  ".repeat(row.level)
        const rowData: string[] = [indent + row.name]

        for (const date of dates) {
          rowData.push(formatNumber(row.values[date]))
        }

        sheetData.push(rowData)
      }

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

      // Set column widths
      worksheet["!cols"] = [
        { wch: 40 }, // First column wider for item names
        ...dates.map(() => ({ wch: 15 })),
      ]

      XLSX.utils.book_append_sheet(workbook, worksheet, REPORT_TYPE_LABELS[type])
    }

    // Generate filename
    const filename = `${stockCode}_财务报表_${new Date().toISOString().split("T")[0]}.xlsx`

    // Download
    XLSX.writeFile(workbook, filename)
  }

  return (
    <Button onClick={handleExport} variant="outline" size="lg" className="h-12 bg-transparent">
      <Download className="mr-2 h-4 w-4" />
      导出Excel
    </Button>
  )
}
