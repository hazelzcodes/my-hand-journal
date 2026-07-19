"use client"

import { useState } from "react"
import { Trash2, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type JournalEntry, moodOf } from "@/lib/types"

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: `${d.getMonth() + 1}月`,
    year: d.getFullYear(),
    weekday: weekdays[d.getDay()],
  }
}

interface EntryCardProps {
  entry: JournalEntry
  onDelete: (id: string) => void
}

export function EntryCard({ entry, onDelete }: EntryCardProps) {
  const [confirming, setConfirming] = useState(false)
  const d = formatDate(entry.date)
  const mood = moodOf(entry.mood)

  return (
    <article
      className="group relative flex gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-[0_2px_10px_-4px_oklch(0.6_0.03_60/0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-8px_oklch(0.6_0.05_60/0.35)]"
    >
      {/* 左侧装订线 */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: mood.tint }}
      />

      {/* 左侧日期块，根据心情着色 */}
      <div
        className="ml-1 flex shrink-0 flex-col items-center justify-center rounded-xl px-3 py-2 text-center"
        style={{ backgroundColor: mood.tint, color: mood.ink }}
      >
        <span className="text-xs opacity-80">{d.month}</span>
        <span className="font-display text-3xl leading-none">{d.day}</span>
        <span className="mt-1 text-[0.65rem] opacity-80">{d.weekday}</span>
      </div>

      {/* 右侧内容 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl font-bold tracking-wide text-balance text-foreground">
            {entry.title}
          </h3>
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xl"
            style={{ backgroundColor: mood.tint }}
            title={mood.label}
            aria-label={`心情：${mood.label}`}
          >
            <span aria-hidden="true">{entry.mood}</span>
          </span>
        </div>

        {entry.content && (
          <p className="mt-2 leading-loose whitespace-pre-wrap text-pretty text-foreground/75">
            {entry.content}
          </p>
        )}

        {entry.summary && entry.summary.length > 0 && (
          <div className="mt-3 rounded-xl border border-accent bg-accent/40 p-3">
            <span className="flex items-center gap-1.5 text-sm font-medium text-accent-foreground">
              <ListChecks className="size-4" />
              今日总结
            </span>
            <ul className="mt-1.5 flex flex-col gap-1">
              {entry.summary.map((point, i) => (
                <li key={i} className="flex gap-1.5 text-sm leading-relaxed text-foreground/75">
                  <span aria-hidden="true" className="text-primary">
                    ·
                  </span>
                  <span className="flex-1">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-dashed border-border/70 pt-3">
          <span className="text-xs text-muted-foreground">{d.year} 年 · {mood.label}</span>

          {confirming ? (
            <span className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">确定删除？</span>
              <Button variant="destructive" size="sm" onClick={() => onDelete(entry.id)}>
                删除
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                取消
              </Button>
            </span>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setConfirming(true)}
              aria-label="删除这条手账"
              className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
