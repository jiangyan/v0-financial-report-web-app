import type { ReportType } from "./financial-constants"

// Generate quarterly report dates for the past N years
export function generateReportDates(years = 3): string[] {
  const dates: string[] = []
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  // Determine the latest available quarter
  let latestQuarter: number
  if (currentMonth >= 10) {
    latestQuarter = 3 // Q3 report available (ends Sep 30)
  } else if (currentMonth >= 7) {
    latestQuarter = 2 // Q2 report available (ends Jun 30)
  } else if (currentMonth >= 4) {
    latestQuarter = 1 // Q1 report available (ends Mar 31)
  } else {
    latestQuarter = 4 // Previous year's Q4 report
  }

  const quarterEnds = ["03-31", "06-30", "09-30", "12-31"]

  // Start from the latest available quarter
  let year = latestQuarter === 4 && currentMonth < 4 ? currentYear - 1 : currentYear
  let quarter = latestQuarter

  // Generate dates for the specified number of years (4 quarters per year)
  const totalQuarters = years * 4
  for (let i = 0; i < totalQuarters; i++) {
    dates.push(`${year}-${quarterEnds[quarter - 1]}`)
    quarter--
    if (quarter === 0) {
      quarter = 4
      year--
    }
  }

  return dates
}

// Format number for display (Chinese style: 亿/万)
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "-"
  }

  const absValue = Math.abs(value)
  const sign = value < 0 ? "-" : ""

  if (absValue >= 100000000) {
    // 亿
    return `${sign}${(absValue / 100000000).toFixed(2)}亿`
  } else if (absValue >= 10000) {
    // 万
    return `${sign}${(absValue / 10000).toFixed(2)}万`
  } else if (absValue === 0) {
    return "0"
  } else {
    return `${sign}${absValue.toFixed(2)}`
  }
}

// Build EastMoney API URL
export function buildApiUrl(stockCode: string, reportType: ReportType, dates: string[]): string {
  const companyType = stockCode.startsWith("SH6") || stockCode.startsWith("6") ? "4" : "5"
  const secCode = stockCode.replace(/^(SH|SZ)/i, "")
  const fullCode =
    stockCode.toUpperCase().startsWith("SH") || stockCode.toUpperCase().startsWith("SZ")
      ? stockCode.toUpperCase()
      : stockCode.startsWith("6")
        ? `SH${stockCode}`
        : `SZ${stockCode}`

  const dateParams = dates.map((d) => `REPORT_DATE%3D%27${d}%27`).join("%2C")

  const baseUrl = "https://datacenter.eastmoney.com/securities/api/data/v1/get"
  const params = new URLSearchParams({
    reportName: `RPT_${fullCode.substring(0, 2).toUpperCase() === "SH" ? "DMSK" : "DMSK"}_FN_${reportType.toUpperCase()}`,
    columns: "ALL",
    quoteColumns: "",
    filter: `(SECUCODE%3D%22${fullCode}.${fullCode.substring(0, 2).toUpperCase() === "SH" ? "SH" : "SZ"}%22)(${dateParams})`,
    pageNumber: "1",
    pageSize: "200",
    sortTypes: "-1",
    sortColumns: "REPORT_DATE",
    source: "HSF10",
    client: "PC",
  })

  return `${baseUrl}?${params.toString()}`
}

// Validate stock code format
export function validateStockCode(code: string): { valid: boolean; message: string } {
  const cleanCode = code.trim().toUpperCase()

  if (!cleanCode) {
    return { valid: false, message: "请输入股票代码" }
  }

  // Allow formats: 000063, SZ000063, 600000, SH600000
  const pattern = /^(SH|SZ)?[0-9]{6}$/i
  if (!pattern.test(cleanCode)) {
    return { valid: false, message: "股票代码格式不正确，请输入6位数字或带前缀的代码（如：SZ000063）" }
  }

  return { valid: true, message: "" }
}

// Normalize stock code to full format (e.g., 000063 -> SZ000063)
export function normalizeStockCode(code: string): string {
  const cleanCode = code.trim().toUpperCase()

  if (cleanCode.startsWith("SH") || cleanCode.startsWith("SZ")) {
    return cleanCode
  }

  // Shanghai stocks start with 6
  if (cleanCode.startsWith("6")) {
    return `SH${cleanCode}`
  }

  // Shenzhen stocks
  return `SZ${cleanCode}`
}

export interface FinancialDataRow {
  name: string
  level: number
  values: Record<string, number | null>
}

export interface ExtractedData {
  reportType: ReportType
  label: string
  dates: string[]
  rows: FinancialDataRow[]
}
