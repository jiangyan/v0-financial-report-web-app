import { type NextRequest, NextResponse } from "next/server"

const API_URLS = {
  balance: "https://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/zcfzbAjaxNew",
  income: "https://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/lrbAjaxNew",
  cashflow: "https://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/xjllbAjaxNew",
}

// Report item definitions matching Python script exactly
const BALANCE_SHEET_ITEMS = [
  { name: "资产负债表", field: null, level: 0 },
  { name: "流动资产", field: null, level: 0 },
  { name: "货币资金", field: "MONETARYFUNDS", level: 1 },
  { name: "交易性金融资产", field: "TRADE_FINASSET_NOTFVTPL", level: 1 },
  { name: "衍生金融资产", field: "DERIVE_FINASSET", level: 1 },
  { name: "应收票据及应收账款", field: "NOTE_ACCOUNTS_RECE", level: 1 },
  { name: "其中:应收账款", field: "ACCOUNTS_RECE", level: 2 },
  { name: "应收款项融资", field: "FINANCE_RECE", level: 1 },
  { name: "预付款项", field: "PREPAYMENT", level: 1 },
  { name: "其他应收款合计", field: "TOTAL_OTHER_RECE", level: 1 },
  { name: "存货", field: "INVENTORY", level: 1 },
  { name: "合同资产", field: "CONTRACT_ASSET", level: 1 },
  { name: "一年内到期的非流动资产", field: "NONCURRENT_ASSET_1YEAR", level: 1 },
  { name: "其他流动资产", field: "OTHER_CURRENT_ASSET", level: 1 },
  { name: "流动资产其他项目", field: "CURRENT_ASSET_OTHER", level: 1 },
  { name: "流动资产合计", field: "TOTAL_CURRENT_ASSETS", level: 1 },
  { name: "非流动资产", field: null, level: 0 },
  { name: "债权投资", field: "CREDITOR_INVEST", level: 1 },
  { name: "长期应收款", field: "LONG_RECE", level: 1 },
  { name: "长期股权投资", field: "LONG_EQUITY_INVEST", level: 1 },
  { name: "其他非流动金融资产", field: "OTHER_NONCURRENT_FINASSET", level: 1 },
  { name: "投资性房地产", field: "INVEST_REALESTATE", level: 1 },
  { name: "固定资产", field: "FIXED_ASSET", level: 1 },
  { name: "在建工程", field: "CIP", level: 1 },
  { name: "使用权资产", field: "USERIGHT_ASSET", level: 1 },
  { name: "无形资产", field: "INTANGIBLE_ASSET", level: 1 },
  { name: "开发支出", field: "DEVELOP_EXPENSE", level: 1 },
  { name: "商誉", field: "GOODWILL", level: 1 },
  { name: "递延所得税资产", field: "DEFER_TAX_ASSET", level: 1 },
  { name: "其他非流动资产", field: "OTHER_NONCURRENT_ASSET", level: 1 },
  { name: "非流动资产其他项目", field: "NONCURRENT_ASSET_OTHER", level: 1 },
  { name: "非流动资产合计", field: "TOTAL_NONCURRENT_ASSETS", level: 1 },
  { name: "资产总计", field: "TOTAL_ASSETS", level: 1 },
  { name: "流动负债", field: null, level: 0 },
  { name: "短期借款", field: "SHORT_LOAN", level: 1 },
  { name: "衍生金融负债", field: "DERIVE_FINLIAB", level: 1 },
  { name: "应付票据及应付账款", field: "NOTE_ACCOUNTS_PAYABLE", level: 1 },
  { name: "其中:应付票据", field: "NOTE_PAYABLE", level: 2 },
  { name: "应付账款", field: "ACCOUNTS_PAYABLE", level: 2 },
  { name: "合同负债", field: "CONTRACT_LIAB", level: 1 },
  { name: "应付职工薪酬", field: "STAFF_SALARY_PAYABLE", level: 1 },
  { name: "应交税费", field: "TAX_PAYABLE", level: 1 },
  { name: "其他应付款合计", field: "TOTAL_OTHER_PAYABLE", level: 1 },
  { name: "预计流动负债", field: "PREDICT_CURRENT_LIAB", level: 1 },
  { name: "一年内到期的非流动负债", field: "NONCURRENT_LIAB_1YEAR", level: 1 },
  { name: "流动负债其他项目", field: "CURRENT_LIAB_OTHER", level: 1 },
  { name: "流动负债合计", field: "TOTAL_CURRENT_LIAB", level: 1 },
  { name: "非流动负债", field: null, level: 0 },
  { name: "长期借款", field: "LONG_LOAN", level: 1 },
  { name: "应付债券", field: "BOND_PAYABLE", level: 1 },
  { name: "租赁负债", field: "LEASE_LIAB", level: 1 },
  { name: "长期应付职工薪酬", field: "LONG_STAFFSALARY_PAYABLE", level: 1 },
  { name: "递延收益", field: "DEFER_INCOME", level: 1 },
  { name: "递延所得税负债", field: "DEFER_TAX_LIAB", level: 1 },
  { name: "其他非流动负债", field: "OTHER_NONCURRENT_LIAB", level: 1 },
  { name: "非流动负债其他项目", field: "NONCURRENT_LIAB_OTHER", level: 1 },
  { name: "非流动负债合计", field: "TOTAL_NONCURRENT_LIAB", level: 1 },
  { name: "负债合计", field: "TOTAL_LIABILITIES", level: 1 },
  { name: "所有者权益(或股东权益)", field: null, level: 0 },
  { name: "实收资本（或股本）", field: "SHARE_CAPITAL", level: 1 },
  { name: "其他权益工具", field: "OTHER_EQUITY_TOOL", level: 1 },
  { name: "资本公积", field: "CAPITAL_RESERVE", level: 1 },
  { name: "其他综合收益", field: "OTHER_COMPRE_INCOME", level: 1 },
  { name: "专项储备", field: "SPECIAL_RESERVE", level: 1 },
  { name: "盈余公积", field: "SURPLUS_RESERVE", level: 1 },
  { name: "未分配利润", field: "UNASSIGN_RPOFIT", level: 1 },
  { name: "归属于母公司股东权益总计", field: "TOTAL_PARENT_EQUITY", level: 1 },
  { name: "少数股东权益", field: "MINORITY_EQUITY", level: 1 },
  { name: "股东权益合计", field: "TOTAL_EQUITY", level: 1 },
  { name: "负债和股东权益总计", field: "TOTAL_LIAB_EQUITY", level: 1 },
]

const INCOME_STATEMENT_ITEMS = [
  { name: "利润表", field: null, level: 0 },
  { name: "营业总收入", field: "TOTAL_OPERATE_INCOME", level: 1 },
  { name: "营业收入", field: "OPERATE_INCOME", level: 2 },
  { name: "营业总成本", field: "TOTAL_OPERATE_COST", level: 1 },
  { name: "营业成本", field: "OPERATE_COST", level: 2 },
  { name: "研发费用", field: "RESEARCH_EXPENSE", level: 2 },
  { name: "营业税金及附加", field: "OPERATE_TAX_ADD", level: 2 },
  { name: "销售费用", field: "SALE_EXPENSE", level: 2 },
  { name: "管理费用", field: "MANAGE_EXPENSE", level: 2 },
  { name: "财务费用", field: "FINANCE_EXPENSE", level: 2 },
  { name: "其中:利息费用", field: "FE_INTEREST_EXPENSE", level: 3 },
  { name: "其中:利息收入", field: "FE_INTEREST_INCOME", level: 3 },
  { name: "其他经营收益", field: null, level: 0 },
  { name: "加:公允价值变动收益", field: "FAIRVALUE_CHANGE_INCOME", level: 1 },
  { name: "投资收益", field: "INVEST_INCOME", level: 1 },
  { name: "其中:对联营企业和合营企业的投资收益", field: "INVEST_JOINT_INCOME", level: 2 },
  { name: "资产处置收益", field: "ASSET_DISPOSAL_INCOME", level: 1 },
  { name: "资产减值损失(新)", field: "ASSET_IMPAIRMENT_INCOME", level: 1 },
  { name: "信用减值损失(新)", field: "CREDIT_IMPAIRMENT_INCOME", level: 1 },
  { name: "其他收益", field: "OTHER_INCOME", level: 1 },
  { name: "营业利润", field: "OPERATE_PROFIT", level: 1 },
  { name: "加:营业外收入", field: "NONBUSINESS_INCOME", level: 2 },
  { name: "减:营业外支出", field: "NONBUSINESS_EXPENSE", level: 2 },
  { name: "利润总额", field: "TOTAL_PROFIT", level: 1 },
  { name: "减:所得税", field: "INCOME_TAX", level: 2 },
  { name: "净利润", field: "NETPROFIT", level: 1 },
  { name: "(一)按经营持续性分类", field: null, level: 0 },
  { name: "持续经营净利润", field: "CONTINUED_NETPROFIT", level: 2 },
  { name: "(二)按所有权归属分类", field: null, level: 0 },
  { name: "归属于母公司股东的净利润", field: "PARENT_NETPROFIT", level: 2 },
  { name: "少数股东损益", field: "MINORITY_INTEREST", level: 2 },
  { name: "扣除非经常性损益后的净利润", field: "DEDUCT_PARENT_NETPROFIT", level: 1 },
  { name: "每股收益", field: null, level: 0 },
  { name: "基本每股收益", field: "BASIC_EPS", level: 2 },
  { name: "稀释每股收益", field: "DILUTED_EPS", level: 2 },
  { name: "其他综合收益", field: "OTHER_COMPRE_INCOME", level: 1 },
  { name: "归属于母公司股东的其他综合收益", field: "PARENT_OCI", level: 2 },
  { name: "归属于少数股东的其他综合收益", field: "MINORITY_OCI", level: 2 },
  { name: "综合收益总额", field: "TOTAL_COMPRE_INCOME", level: 1 },
  { name: "归属于母公司股东的综合收益总额", field: "PARENT_TCI", level: 2 },
  { name: "归属于少数股东的综合收益总额", field: "MINORITY_TCI", level: 2 },
]

const CASHFLOW_STATEMENT_ITEMS = [
  { name: "现金流量表", field: null, level: 0 },
  { name: "经营活动产生的现金流量", field: null, level: 0 },
  { name: "销售商品、提供劳务收到的现金", field: "SALES_SERVICES", level: 1 },
  { name: "收到的税收返还", field: "RECEIVE_TAX_REFUND", level: 1 },
  { name: "收到其他与经营活动有关的现金", field: "RECEIVE_OTHER_OPERATE", level: 1 },
  { name: "经营活动现金流入小计", field: "TOTAL_OPERATE_INFLOW", level: 1 },
  { name: "购买商品、接受劳务支付的现金", field: "BUY_SERVICES", level: 1 },
  { name: "支付给职工以及为职工支付的现金", field: "PAY_STAFF_CASH", level: 1 },
  { name: "支付的各项税费", field: "PAY_ALL_TAX", level: 1 },
  { name: "支付其他与经营活动有关的现金", field: "PAY_OTHER_OPERATE", level: 1 },
  { name: "经营活动现金流出小计", field: "TOTAL_OPERATE_OUTFLOW", level: 1 },
  { name: "经营活动产生的现金流量净额", field: "NETCASH_OPERATE", level: 1 },
  { name: "投资活动产生的现金流量", field: null, level: 0 },
  { name: "收回投资收到的现金", field: "WITHDRAW_INVEST", level: 1 },
  { name: "取得投资收益收到的现金", field: "RECEIVE_INVEST_INCOME", level: 1 },
  { name: "处置固定资产、无形资产和其他长期资产收回的现金净额", field: "DISPOSAL_LONG_ASSET", level: 1 },
  { name: "收到的其他与投资活动有关的现金", field: "RECEIVE_OTHER_INVEST", level: 1 },
  { name: "投资活动现金流入小计", field: "TOTAL_INVEST_INFLOW", level: 1 },
  { name: "购建固定资产、无形资产和其他长期资产支付的现金", field: "CONSTRUCT_LONG_ASSET", level: 1 },
  { name: "投资支付的现金", field: "INVEST_PAY_CASH", level: 1 },
  { name: "投资活动现金流出小计", field: "TOTAL_INVEST_OUTFLOW", level: 1 },
  { name: "投资活动产生的现金流量净额", field: "NETCASH_INVEST", level: 1 },
  { name: "筹资活动产生的现金流量", field: null, level: 0 },
  { name: "吸收投资收到的现金", field: "ACCEPT_INVEST_CASH", level: 1 },
  { name: "其中:子公司吸收少数股东投资收到的现金", field: "SUBSIDIARY_ACCEPT_INVEST", level: 2 },
  { name: "取得借款收到的现金", field: "RECEIVE_LOAN_CASH", level: 1 },
  { name: "筹资活动现金流入小计", field: "TOTAL_FINANCE_INFLOW", level: 1 },
  { name: "偿还债务所支付的现金", field: "PAY_DEBT_CASH", level: 1 },
  { name: "分配股利、利润或偿付利息支付的现金", field: "ASSIGN_DIVIDEND_PORFIT", level: 1 },
  { name: "其中:子公司支付给少数股东的股利、利润", field: "SUBSIDIARY_PAY_DIVIDEND", level: 2 },
  { name: "支付的其他与筹资活动有关的现金", field: "PAY_OTHER_FINANCE", level: 1 },
  { name: "筹资活动现金流出小计", field: "TOTAL_FINANCE_OUTFLOW", level: 1 },
  { name: "筹资活动产生的现金流量净额", field: "NETCASH_FINANCE", level: 1 },
  { name: "汇率变动对现金及现金等价物的影响", field: "RATE_CHANGE_EFFECT", level: 1 },
  { name: "现金及现金等价物净增加额", field: "CCE_ADD", level: 1 },
  { name: "加:期初现金及现金等价物余额", field: "BEGIN_CCE", level: 2 },
  { name: "期末现金及现金等价物余额", field: "END_CCE", level: 1 },
]

type ReportType = "balance" | "income" | "cashflow"

function normalizeStockCode(code: string): string {
  const cleanCode = code.trim().toUpperCase()
  if (cleanCode.startsWith("SH") || cleanCode.startsWith("SZ")) {
    return cleanCode
  }
  return cleanCode.startsWith("6") ? `SH${cleanCode}` : `SZ${cleanCode}`
}

function generateReportDates(years = 3): string[] {
  const dates: string[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  let year: number, month: number, day: number

  // Determine the most recent quarter end (matching Python logic)
  if (currentMonth >= 10) {
    year = currentYear
    month = 9
    day = 30
  } else if (currentMonth >= 7) {
    year = currentYear
    month = 6
    day = 30
  } else if (currentMonth >= 4) {
    year = currentYear
    month = 3
    day = 31
  } else {
    year = currentYear - 1
    month = 12
    day = 31
  }

  const quartersNeeded = years * 4

  for (let i = 0; i < quartersNeeded; i++) {
    const monthStr = month.toString().padStart(2, "0")
    const dayStr = day.toString().padStart(2, "0")
    dates.push(`${year}-${monthStr}-${dayStr}`)

    // Go back one quarter
    if (month === 3) {
      month = 12
      day = 31
      year -= 1
    } else if (month === 6) {
      month = 3
      day = 31
    } else if (month === 9) {
      month = 6
      day = 30
    } else {
      month = 9
      day = 30
    }
  }

  return dates
}

async function fetchReportData(
  stockCode: string,
  reportType: ReportType,
  datesBatch: string[],
): Promise<Record<string, unknown>[]> {
  const url = API_URLS[reportType]
  const datesStr = datesBatch.join(",")

  const params = new URLSearchParams({
    companyType: "4",
    reportDateType: "0",
    reportType: "1",
    dates: datesStr,
    code: stockCode,
  })

  console.log(`[v0] Fetching ${reportType} for ${stockCode} with dates: ${datesStr}`)
  console.log(`[v0] Full URL: ${url}?${params.toString()}`)

  const response = await fetch(`${url}?${params.toString()}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://emweb.securities.eastmoney.com/",
    },
  })

  if (!response.ok) {
    console.log(`[v0] Response not ok: ${response.status}`)
    throw new Error(`API request failed: ${response.status}`)
  }

  const data = await response.json()
  console.log(`[v0] Response data keys:`, Object.keys(data))
  console.log(`[v0] Data array length:`, data.data?.length || 0)

  return data.data || []
}

function getItemsForReportType(reportType: ReportType) {
  switch (reportType) {
    case "balance":
      return BALANCE_SHEET_ITEMS
    case "income":
      return INCOME_STATEMENT_ITEMS
    case "cashflow":
      return CASHFLOW_STATEMENT_ITEMS
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stockCode, years = 3 } = body

    if (!stockCode) {
      return NextResponse.json({ error: "Stock code is required" }, { status: 400 })
    }

    const normalizedCode = normalizeStockCode(stockCode)
    const dates = generateReportDates(years)

    console.log(`[v0] Normalized code: ${normalizedCode}`)
    console.log(`[v0] Generated dates:`, dates)

    const reportTypes: ReportType[] = ["balance", "income", "cashflow"]
    const results: Record<
      string,
      {
        dates: string[]
        rows: Array<{
          name: string
          level: number
          values: Record<string, number | string | null>
        }>
      }
    > = {}

    for (const reportType of reportTypes) {
      const allData: Record<string, unknown>[] = []

      // Batch dates in groups of 5 (API limit)
      for (let i = 0; i < dates.length; i += 5) {
        const batchDates = dates.slice(i, i + 5)
        const batchData = await fetchReportData(normalizedCode, reportType, batchDates)
        allData.push(...batchData)
      }

      console.log(`[v0] Total records for ${reportType}:`, allData.length)

      // Sort by date (newest first)
      const sortedData = allData.sort((a, b) => {
        const dateA = (a.REPORT_DATE as string) || ""
        const dateB = (b.REPORT_DATE as string) || ""
        return dateB.localeCompare(dateA)
      })

      // Get actual dates from data
      const actualDates = sortedData
        .map((r) => {
          const reportDate = r.REPORT_DATE as string
          return reportDate ? reportDate.substring(0, 10) : ""
        })
        .filter(Boolean)

      // Create date-indexed map
      const dataByDate: Record<string, Record<string, unknown>> = {}
      for (const row of sortedData) {
        const reportDate = (row.REPORT_DATE as string)?.substring(0, 10)
        if (reportDate) {
          dataByDate[reportDate] = row
        }
      }

      // Build rows with values
      const items = getItemsForReportType(reportType)
      const rows = items.map((item) => {
        const values: Record<string, number | string | null> = {}

        if (item.field === null) {
          // Section header - no values
          for (const date of actualDates) {
            values[date] = ""
          }
        } else {
          for (const date of actualDates) {
            const dateData = dataByDate[date]
            if (dateData && dateData[item.field] !== undefined) {
              values[date] = dateData[item.field] as number | null
            } else {
              values[date] = null
            }
          }
        }

        return {
          name: item.name,
          level: item.level,
          values,
        }
      })

      results[reportType] = {
        dates: actualDates,
        rows,
      }
    }

    return NextResponse.json({
      success: true,
      stockCode: normalizedCode,
      data: results,
    })
  } catch (error) {
    console.error("[v0] Error fetching financial data:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch data" },
      { status: 500 },
    )
  }
}
