"use client"

import { useCallback, useEffect, useState } from "react"
import { STORAGE_KEY, type JournalEntry } from "./types"

export function useEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  // 初始加载：从 localStorage 读取
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as JournalEntry[]
        setEntries(parsed)
      }
    } catch (err) {
      console.log("[v0] 读取本地手账数据失败:", err)
    } finally {
      setLoaded(true)
    }
  }, [])

  // 数据变化时写回 localStorage
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch (err) {
      console.log("[v0] 保存本地手账数据失败:", err)
    }
  }, [entries, loaded])

  const addEntry = useCallback((entry: Omit<JournalEntry, "id" | "createdAt">) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    setEntries((prev) => [newEntry, ...prev])
  }, [])

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // 按日期倒序（同日期按创建时间倒序）
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return b.createdAt - a.createdAt
  })

  return { entries: sortedEntries, addEntry, deleteEntry, loaded }
}
