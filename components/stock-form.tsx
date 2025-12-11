"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { validateStockCode } from "@/lib/financial-utils"
import { Search, Loader2 } from "lucide-react"

interface StockFormProps {
  onSubmit: (stockCode: string, years: number) => void
  isLoading: boolean
}

export function StockForm({ onSubmit, isLoading }: StockFormProps) {
  const [stockCode, setStockCode] = useState("")
  const [years, setYears] = useState("3")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateStockCode(stockCode)
    if (!validation.valid) {
      setError(validation.message)
      return
    }

    setError("")
    onSubmit(stockCode, Number.parseInt(years))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="stock-code">股票代码</Label>
          <Input
            id="stock-code"
            placeholder="输入股票代码，如：000063 或 SZ000063"
            value={stockCode}
            onChange={(e) => {
              setStockCode(e.target.value)
              setError("")
            }}
            className="h-12 text-base"
            disabled={isLoading}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="w-full sm:w-32 space-y-2">
          <Label htmlFor="years">年数</Label>
          <Select value={years} onValueChange={setYears} disabled={isLoading}>
            <SelectTrigger id="years" className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1年</SelectItem>
              <SelectItem value="2">2年</SelectItem>
              <SelectItem value="3">3年</SelectItem>
              <SelectItem value="4">4年</SelectItem>
              <SelectItem value="5">5年</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button type="submit" size="lg" className="h-12 px-8" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提取中...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                提取数据
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
