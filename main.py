"""
Financial Report Extractor v2.1
Extracts financial statements from EastMoney for Chinese stocks.
Features:
- Hierarchical display with indentation matching website structure
- Multi-year support (default 3 years = 12 quarters)
"""

import requests
import pandas as pd
from datetime import datetime
import argparse

# Item format: (display_name, api_field_name, level)
# level: 0 = section header, 1 = main item, 2 = child item (indented)
# api_field_name = None means it's a header/separator

BALANCE_SHEET_ITEMS = [
    # 资产负债表 header
    ("资产负债表", None, 0),
    # 流动资产
    ("流动资产", None, 0),
    ("货币资金", "MONETARYFUNDS", 1),
    ("交易性金融资产", "TRADE_FINASSET_NOTFVTPL", 1),
    ("衍生金融资产", "DERIVE_FINASSET", 1),
    ("应收票据及应收账款", "NOTE_ACCOUNTS_RECE", 1),
    ("其中:应收账款", "ACCOUNTS_RECE", 2),
    ("应收款项融资", "FINANCE_RECE", 1),
    ("预付款项", "PREPAYMENT", 1),
    ("其他应收款合计", "TOTAL_OTHER_RECE", 1),
    ("存货", "INVENTORY", 1),
    ("合同资产", "CONTRACT_ASSET", 1),
    ("一年内到期的非流动资产", "NONCURRENT_ASSET_1YEAR", 1),
    ("其他流动资产", "OTHER_CURRENT_ASSET", 1),
    ("流动资产其他项目", "CURRENT_ASSET_OTHER", 1),
    ("流动资产合计", "TOTAL_CURRENT_ASSETS", 1),
    # 非流动资产
    ("非流动资产", None, 0),
    ("债权投资", "CREDITOR_INVEST", 1),
    ("长期应收款", "LONG_RECE", 1),
    ("长期股权投资", "LONG_EQUITY_INVEST", 1),
    ("其他非流动金融资产", "OTHER_NONCURRENT_FINASSET", 1),
    ("投资性房地产", "INVEST_REALESTATE", 1),
    ("固定资产", "FIXED_ASSET", 1),
    ("在建工程", "CIP", 1),
    ("使用权资产", "USERIGHT_ASSET", 1),
    ("无形资产", "INTANGIBLE_ASSET", 1),
    ("开发支出", "DEVELOP_EXPENSE", 1),
    ("商誉", "GOODWILL", 1),
    ("递延所得税资产", "DEFER_TAX_ASSET", 1),
    ("其他非流动资产", "OTHER_NONCURRENT_ASSET", 1),
    ("非流动资产其他项目", "NONCURRENT_ASSET_OTHER", 1),
    ("非流动资产合计", "TOTAL_NONCURRENT_ASSETS", 1),
    ("资产总计", "TOTAL_ASSETS", 1),
    # 流动负债
    ("流动负债", None, 0),
    ("短期借款", "SHORT_LOAN", 1),
    ("衍生金融负债", "DERIVE_FINLIAB", 1),
    ("应付票据及应付账款", "NOTE_ACCOUNTS_PAYABLE", 1),
    ("其中:应付票据", "NOTE_PAYABLE", 2),
    ("应付账款", "ACCOUNTS_PAYABLE", 2),
    ("合同负债", "CONTRACT_LIAB", 1),
    ("应付职工薪酬", "STAFF_SALARY_PAYABLE", 1),
    ("应交税费", "TAX_PAYABLE", 1),
    ("其他应付款合计", "TOTAL_OTHER_PAYABLE", 1),
    ("预计流动负债", "PREDICT_CURRENT_LIAB", 1),
    ("一年内到期的非流动负债", "NONCURRENT_LIAB_1YEAR", 1),
    ("流动负债其他项目", "CURRENT_LIAB_OTHER", 1),
    ("流动负债合计", "TOTAL_CURRENT_LIAB", 1),
    # 非流动负债
    ("非流动负债", None, 0),
    ("长期借款", "LONG_LOAN", 1),
    ("应付债券", "BOND_PAYABLE", 1),
    ("租赁负债", "LEASE_LIAB", 1),
    ("长期应付职工薪酬", "LONG_STAFFSALARY_PAYABLE", 1),
    ("递延收益", "DEFER_INCOME", 1),
    ("递延所得税负债", "DEFER_TAX_LIAB", 1),
    ("其他非流动负债", "OTHER_NONCURRENT_LIAB", 1),
    ("非流动负债其他项目", "NONCURRENT_LIAB_OTHER", 1),
    ("非流动负债合计", "TOTAL_NONCURRENT_LIAB", 1),
    ("负债合计", "TOTAL_LIABILITIES", 1),
    # 所有者权益
    ("所有者权益(或股东权益)", None, 0),
    ("实收资本（或股本）", "SHARE_CAPITAL", 1),
    ("其他权益工具", "OTHER_EQUITY_TOOL", 1),
    ("资本公积", "CAPITAL_RESERVE", 1),
    ("其他综合收益", "OTHER_COMPRE_INCOME", 1),
    ("专项储备", "SPECIAL_RESERVE", 1),
    ("盈余公积", "SURPLUS_RESERVE", 1),
    ("未分配利润", "UNASSIGN_RPOFIT", 1),
    ("归属于母公司股东权益总计", "TOTAL_PARENT_EQUITY", 1),
    ("少数股东权益", "MINORITY_EQUITY", 1),
    ("股东权益合计", "TOTAL_EQUITY", 1),
    ("负债和股东权益总计", "TOTAL_LIAB_EQUITY", 1),
]

INCOME_STATEMENT_ITEMS = [
    # 利润表 header
    ("利润表", None, 0),
    # 营业收入
    ("营业总收入", "TOTAL_OPERATE_INCOME", 1),
    ("营业收入", "OPERATE_INCOME", 2),
    # 营业成本
    ("营业总成本", "TOTAL_OPERATE_COST", 1),
    ("营业成本", "OPERATE_COST", 2),
    ("研发费用", "RESEARCH_EXPENSE", 2),
    ("营业税金及附加", "OPERATE_TAX_ADD", 2),
    ("销售费用", "SALE_EXPENSE", 2),
    ("管理费用", "MANAGE_EXPENSE", 2),
    ("财务费用", "FINANCE_EXPENSE", 2),
    ("其中:利息费用", "FE_INTEREST_EXPENSE", 3),
    ("其中:利息收入", "FE_INTEREST_INCOME", 3),
    # 其他收益
    ("其他经营收益", None, 0),
    ("加:公允价值变动收益", "FAIRVALUE_CHANGE_INCOME", 1),
    ("投资收益", "INVEST_INCOME", 1),
    ("其中:对联营企业和合营企业的投资收益", "INVEST_JOINT_INCOME", 2),
    ("资产处置收益", "ASSET_DISPOSAL_INCOME", 1),
    ("资产减值损失(新)", "ASSET_IMPAIRMENT_INCOME", 1),
    ("信用减值损失(新)", "CREDIT_IMPAIRMENT_INCOME", 1),
    ("其他收益", "OTHER_INCOME", 1),
    # 营业利润
    ("营业利润", "OPERATE_PROFIT", 1),
    ("加:营业外收入", "NONBUSINESS_INCOME", 2),
    ("减:营业外支出", "NONBUSINESS_EXPENSE", 2),
    # 利润总额
    ("利润总额", "TOTAL_PROFIT", 1),
    ("减:所得税", "INCOME_TAX", 2),
    # 净利润
    ("净利润", "NETPROFIT", 1),
    ("(一)按经营持续性分类", None, 0),
    ("持续经营净利润", "CONTINUED_NETPROFIT", 2),
    ("(二)按所有权归属分类", None, 0),
    ("归属于母公司股东的净利润", "PARENT_NETPROFIT", 2),
    ("少数股东损益", "MINORITY_INTEREST", 2),
    ("扣除非经常性损益后的净利润", "DEDUCT_PARENT_NETPROFIT", 1),
    # 每股收益
    ("每股收益", None, 0),
    ("基本每股收益", "BASIC_EPS", 2),
    ("稀释每股收益", "DILUTED_EPS", 2),
    # 其他综合收益
    ("其他综合收益", "OTHER_COMPRE_INCOME", 1),
    ("归属于母公司股东的其他综合收益", "PARENT_OCI", 2),
    ("归属于少数股东的其他综合收益", "MINORITY_OCI", 2),
    # 综合收益总额
    ("综合收益总额", "TOTAL_COMPRE_INCOME", 1),
    ("归属于母公司股东的综合收益总额", "PARENT_TCI", 2),
    ("归属于少数股东的综合收益总额", "MINORITY_TCI", 2),
]

CASHFLOW_STATEMENT_ITEMS = [
    # 现金流量表 header
    ("现金流量表", None, 0),
    # 经营活动
    ("经营活动产生的现金流量", None, 0),
    ("销售商品、提供劳务收到的现金", "SALES_SERVICES", 1),
    ("收到的税收返还", "RECEIVE_TAX_REFUND", 1),
    ("收到其他与经营活动有关的现金", "RECEIVE_OTHER_OPERATE", 1),
    ("经营活动现金流入小计", "TOTAL_OPERATE_INFLOW", 1),
    ("购买商品、接受劳务支付的现金", "BUY_SERVICES", 1),
    ("支付给职工以及为职工支付的现金", "PAY_STAFF_CASH", 1),
    ("支付的各项税费", "PAY_ALL_TAX", 1),
    ("支付其他与经营活动有关的现金", "PAY_OTHER_OPERATE", 1),
    ("经营活动现金流出小计", "TOTAL_OPERATE_OUTFLOW", 1),
    ("经营活动产生的现金流量净额", "NETCASH_OPERATE", 1),
    # 投资活动
    ("投资活动产生的现金流量", None, 0),
    ("收回投资收到的现金", "WITHDRAW_INVEST", 1),
    ("取得投资收益收到的现金", "RECEIVE_INVEST_INCOME", 1),
    ("处置固定资产、无形资产和其他长期资产收回的现金净额", "DISPOSAL_LONG_ASSET", 1),
    ("收到的其他与投资活动有关的现金", "RECEIVE_OTHER_INVEST", 1),
    ("投资活动现金流入小计", "TOTAL_INVEST_INFLOW", 1),
    ("购建固定资产、无形资产和其他长期资产支付的现金", "CONSTRUCT_LONG_ASSET", 1),
    ("投资支付的现金", "INVEST_PAY_CASH", 1),
    ("投资活动现金流出小计", "TOTAL_INVEST_OUTFLOW", 1),
    ("投资活动产生的现金流量净额", "NETCASH_INVEST", 1),
    # 筹资活动
    ("筹资活动产生的现金流量", None, 0),
    ("吸收投资收到的现金", "ACCEPT_INVEST_CASH", 1),
    ("其中:子公司吸收少数股东投资收到的现金", "SUBSIDIARY_ACCEPT_INVEST", 2),
    ("取得借款收到的现金", "RECEIVE_LOAN_CASH", 1),
    ("筹资活动现金流入小计", "TOTAL_FINANCE_INFLOW", 1),
    ("偿还债务所支付的现金", "PAY_DEBT_CASH", 1),
    ("分配股利、利润或偿付利息支付的现金", "ASSIGN_DIVIDEND_PORFIT", 1),
    ("其中:子公司支付给少数股东的股利、利润", "SUBSIDIARY_PAY_DIVIDEND", 2),
    ("支付的其他与筹资活动有关的现金", "PAY_OTHER_FINANCE", 1),
    ("筹资活动现金流出小计", "TOTAL_FINANCE_OUTFLOW", 1),
    ("筹资活动产生的现金流量净额", "NETCASH_FINANCE", 1),
    # 汇率变动影响
    ("汇率变动对现金及现金等价物的影响", "RATE_CHANGE_EFFECT", 1),
    # 现金净增加额
    ("现金及现金等价物净增加额", "CCE_ADD", 1),
    ("加:期初现金及现金等价物余额", "BEGIN_CCE", 2),
    ("期末现金及现金等价物余额", "END_CCE", 1),
    # 补充资料
    ("补充资料", None, 0),
    ("净利润", "NETPROFIT", 2),
    ("资产减值准备", "ASSET_IMPAIRMENT", 2),
    ("固定资产和投资性房地产折旧", "FA_IR_DEPR", 2),
    ("其中:固定资产折旧、油气资产折耗、生产性生物资产折旧", "OILGAS_BIOLOGY_DEPR", 3),
    ("使用权资产折旧", "USERIGHT_ASSET_AMORTIZE", 2),
    ("无形资产摊销", "IA_AMORTIZE", 2),
    ("处置固定资产、无形资产和其他长期资产的损失", "DISPOSAL_LONGASSET_LOSS", 2),
    ("公允价值变动损失", "FAIRVALUE_CHANGE_LOSS", 2),
    ("财务费用", "FINANCE_EXPENSE", 2),
    ("投资损失", "INVEST_LOSS", 2),
    ("递延所得税", "DEFER_TAX", 2),
    ("其中:递延所得税资产减少", "DT_ASSET_REDUCE", 3),
    ("递延所得税负债增加", "DT_LIAB_ADD", 3),
    ("存货的减少", "INVENTORY_REDUCE", 2),
    ("经营性应收项目的减少", "OPERATE_RECE_REDUCE", 2),
    ("经营性应付项目的增加", "OPERATE_PAYABLE_ADD", 2),
    ("经营活动产生的现金流量净额其他项目", "OPERATE_NETCASH_OTHERNOTE", 2),
    ("经营活动产生的现金流量净额", "NETCASH_OPERATENOTE", 2),
    ("现金的期末余额", "END_CASH", 2),
    ("减:现金的期初余额", "BEGIN_CASH", 2),
    ("加:现金等价物的期末余额", "END_CASH_EQUIVALENTS", 2),
    ("减:现金等价物的期初余额", "BEGIN_CASH_EQUIVALENTS", 2),
    ("现金及现金等价物的净增加额", "CCE_ADDNOTE", 2),
]


def format_number(value):
    """Format number to Chinese style (亿/万), return empty string if None/invalid."""
    if value is None or value == '' or value == 'None':
        return '--'
    try:
        num = float(value)
        if num == 0:
            return '--'
        abs_num = abs(num)
        if abs_num >= 100000000:  # >= 1亿
            return f"{num/100000000:.2f}亿"
        elif abs_num >= 10000:  # >= 1万
            return f"{num/10000:.2f}万"
        else:
            return f"{num:.2f}"
    except (ValueError, TypeError):
        return '--'


def generate_report_dates(years=3):
    """Generate report dates for the specified number of years.
    Returns list of dates in format YYYY-MM-DD for quarterly reports.
    """
    current = datetime.now()
    current_year = current.year
    current_month = current.month
    
    # Determine the most recent quarter end
    if current_month >= 10:
        start_quarter = (current_year, 9, 30)
    elif current_month >= 7:
        start_quarter = (current_year, 6, 30)
    elif current_month >= 4:
        start_quarter = (current_year, 3, 31)
    else:
        start_quarter = (current_year - 1, 12, 31)
    
    # Generate quarterly dates
    dates = []
    year, month, day = start_quarter
    
    quarters_needed = years * 4  # 4 quarters per year
    
    for _ in range(quarters_needed):
        dates.append(f"{year}-{month:02d}-{day:02d}")
        # Go back one quarter
        if month == 3:
            month = 12
            day = 31
            year -= 1
        elif month == 6:
            month = 3
            day = 31
        elif month == 9:
            month = 6
            day = 30
        else:  # month == 12
            month = 9
            day = 30
    
    return dates


def get_financial_report(stock_code, report_type, dates_batch):
    """
    Fetch financial report data from EastMoney API.
    
    Args:
        stock_code: Stock code like "SZ000063"
        report_type: "balance", "income", or "cashflow"
        dates_batch: List of dates to fetch (max 5 per call)
    
    Returns:
        List of report data dictionaries
    """
    url_map = {
        "balance": "https://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/zcfzbAjaxNew",
        "income": "https://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/lrbAjaxNew",
        "cashflow": "https://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/xjllbAjaxNew",
    }
    
    url = url_map[report_type]
    dates_str = ",".join(dates_batch)
    
    params = {
        "companyType": "4",
        "reportDateType": "0",
        "reportType": "1",
        "dates": dates_str,
        "code": stock_code,
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://emweb.securities.eastmoney.com/",
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data.get("data", [])
    except Exception as e:
        print(f"Error fetching {report_type} report: {e}")
        return []


def fetch_all_reports(stock_code, report_type, dates):
    """
    Fetch all reports by making multiple API calls (API limits to 5 per call).
    
    Args:
        stock_code: Stock code like "SZ000063"
        report_type: "balance", "income", or "cashflow"
        dates: Full list of dates to fetch
    
    Returns:
        Combined list of all report data
    """
    all_data = []
    batch_size = 5
    
    for i in range(0, len(dates), batch_size):
        batch = dates[i:i+batch_size]
        print(f"  Fetching {report_type} batch {i//batch_size + 1}: {batch[0]} to {batch[-1]}")
        data = get_financial_report(stock_code, report_type, batch)
        all_data.extend(data)
    
    return all_data


def build_report_dataframe(items, reports):
    """
    Build a DataFrame from report items and API data.
    
    Args:
        items: List of (display_name, api_field, level) tuples
        reports: List of report data from API
    
    Returns:
        pandas DataFrame with hierarchical item names and values
    """
    # Sort reports by date (newest first)
    reports = sorted(reports, key=lambda x: x.get("REPORT_DATE", ""), reverse=True)
    
    # Get report dates for column headers
    dates = [r.get("REPORT_DATE", "")[:10] for r in reports]
    
    rows = []
    for display_name, api_field, level in items:
        # Create indented name based on level
        indent = ""
        if level == 2:
            indent = "  "
        elif level == 3:
            indent = "    "
        
        indented_name = indent + display_name
        
        row = {"项目": indented_name}
        
        if api_field is None:
            # Section header - no values
            for date in dates:
                row[date] = ""
        else:
            # Data row - get values from each report
            for i, report in enumerate(reports):
                value = report.get(api_field)
                row[dates[i]] = format_number(value)
        
        rows.append(row)
    
    df = pd.DataFrame(rows)
    return df


def main():
    parser = argparse.ArgumentParser(description="Extract financial reports from EastMoney")
    parser.add_argument("--stock", default="SZ000063", help="Stock code (e.g., SZ000063)")
    parser.add_argument("--years", type=int, default=3, help="Number of years to extract (default: 3)")
    parser.add_argument("--output", default=None, help="Output Excel filename")
    args = parser.parse_args()
    
    stock_code = args.stock
    years = args.years
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = args.output or f"财务报表_{stock_code}_{timestamp}.xlsx"
    
    print(f"Extracting financial reports for {stock_code}")
    print(f"Period: {years} years ({years * 4} quarters)")
    
    # Generate dates
    dates = generate_report_dates(years)
    print(f"Date range: {dates[-1]} to {dates[0]}")
    
    # Fetch all reports
    print("\nFetching balance sheet...")
    balance_data = fetch_all_reports(stock_code, "balance", dates)
    print(f"  Retrieved {len(balance_data)} records")
    
    print("\nFetching income statement...")
    income_data = fetch_all_reports(stock_code, "income", dates)
    print(f"  Retrieved {len(income_data)} records")
    
    print("\nFetching cash flow statement...")
    cashflow_data = fetch_all_reports(stock_code, "cashflow", dates)
    print(f"  Retrieved {len(cashflow_data)} records")
    
    # Build DataFrames
    print("\nBuilding reports...")
    balance_df = build_report_dataframe(BALANCE_SHEET_ITEMS, balance_data)
    income_df = build_report_dataframe(INCOME_STATEMENT_ITEMS, income_data)
    cashflow_df = build_report_dataframe(CASHFLOW_STATEMENT_ITEMS, cashflow_data)
    
    # Export to Excel
    print(f"\nExporting to {output_file}...")
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        balance_df.to_excel(writer, sheet_name="资产负债表", index=False)
        income_df.to_excel(writer, sheet_name="利润表", index=False)
        cashflow_df.to_excel(writer, sheet_name="现金流量表", index=False)
        
        # Auto-adjust column widths
        for sheet_name in writer.sheets:
            worksheet = writer.sheets[sheet_name]
            # Set first column (项目) wider for indented items
            worksheet.column_dimensions['A'].width = 50
            # Set data columns
            for col_idx in range(2, len(dates) + 2):
                col_letter = chr(64 + col_idx) if col_idx <= 26 else 'A' + chr(64 + col_idx - 26)
                worksheet.column_dimensions[col_letter].width = 15
    
    print(f"\nDone! Report saved to {output_file}")
    print(f"  - 资产负债表: {len(balance_df)} rows")
    print(f"  - 利润表: {len(income_df)} rows")
    print(f"  - 现金流量表: {len(cashflow_df)} rows")


if __name__ == "__main__":
    main()
