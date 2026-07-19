"use client"

import { useState } from "react"
import { NotebookPen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EntryCard } from "@/components/entry-card"
import { EntryForm } from "@/components/entry-form"
import { useEntries } from "@/lib/use-entries"

export function JournalApp() {
  const { entries, addEntry, deleteEntry, loaded } = useEntries()
  const [formOpen, setFormOpen] = useState(false)

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-32 pt-10 sm:pt-14">
      {/* 页头 */}
      <header className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <NotebookPen className="size-7" />
        </div>
        <h1 className="font-display text-4xl text-foreground sm:text-5xl">我的手账</h1>
        <p className="mt-2 text-sm text-muted-foreground">记录每一天的心情与故事</p>
      </header>

      {/* 记录列表 */}
      {loaded && entries.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <p className="font-display text-2xl text-foreground/70">还没有任何手账</p>
          <p className="mt-2 text-sm text-muted-foreground">
            点击下方按钮，写下今天的第一篇吧
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} onDelete={deleteEntry} />
        ))}
      </div>

      {/* 桌面端：悬浮新增按钮 */}
      <div className="fixed inset-x-0 bottom-6 hidden justify-center px-4 sm:flex">
        <Button
          size="lg"
          onClick={() => setFormOpen(true)}
          className="h-12 gap-2 rounded-full px-6 text-base shadow-lg"
        >
          <Plus className="size-5" />
          写一篇
        </Button>
      </div>

      {/* 移动端：固定在底部的输入栏，像聊天一样 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:hidden">
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex w-full items-center gap-3 rounded-full border border-input bg-background px-4 py-3 text-left text-muted-foreground shadow-sm transition-colors active:bg-secondary"
        >
          <NotebookPen className="size-5 shrink-0 text-primary" />
          <span className="flex-1 text-sm">今天想记点什么？</span>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Plus className="size-4" />
          </span>
        </button>
      </div>

      <EntryForm open={formOpen} onClose={() => setFormOpen(false)} onSave={addEntry} />
    </main>
  )
}
