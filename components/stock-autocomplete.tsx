"use client"

import * as React from "react"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { SSE_STOCKS, type StockInfo } from "@/lib/sse-stock-data"
import { Search, X } from "lucide-react"

interface StockAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (stock: StockInfo) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function StockAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "输入股票代码、名称或拼音首字母",
  disabled = false,
  className,
}: StockAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter stocks based on search term (code, name, or pinyin)
  const filteredStocks = useMemo(() => {
    if (!value.trim()) return []

    const searchTerm = value.toLowerCase().trim()
    const results = SSE_STOCKS.filter((stock) => {
      return (
        stock.code.includes(searchTerm) ||
        stock.name.toLowerCase().includes(searchTerm) ||
        stock.pinyin.toLowerCase().includes(searchTerm)
      )
    })

    // Limit results for performance
    return results.slice(0, 50)
  }, [value])

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredStocks])

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const highlightedItem = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex])

  const handleSelect = useCallback((stock: StockInfo) => {
    onChange(stock.code)
    onSelect?.(stock)
    setIsOpen(false)
    inputRef.current?.focus()
  }, [onChange, onSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || filteredStocks.length === 0) {
      if (e.key === "ArrowDown" && filteredStocks.length > 0) {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredStocks.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      case "Enter":
        e.preventDefault()
        if (filteredStocks[highlightedIndex]) {
          handleSelect(filteredStocks[highlightedIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        break
    }
  }, [isOpen, filteredStocks, highlightedIndex, handleSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setIsOpen(true)
  }

  const handleClear = () => {
    onChange("")
    inputRef.current?.focus()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const showDropdown = isOpen && filteredStocks.length > 0

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim() && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "pl-10 pr-10 h-12",
            className
          )}
          autoComplete="off"
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 max-h-[300px] overflow-y-auto rounded-md border bg-popover shadow-lg"
        >
          {filteredStocks.map((stock, index) => (
            <button
              key={stock.code}
              type="button"
              onClick={() => handleSelect(stock)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                highlightedIndex === index
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              <span className="font-mono text-primary font-medium min-w-[60px]">
                {stock.code}
              </span>
              <span className="flex-1 truncate">{stock.name}</span>
              <span className="text-muted-foreground text-xs uppercase">
                {stock.pinyin}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
