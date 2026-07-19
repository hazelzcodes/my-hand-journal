"use client"

import { useEffect, useRef, useState } from "react"
import { X, Sparkles, Loader2, ListChecks, Camera, ScanText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MOODS, type JournalEntry } from "@/lib/types"
import { organizeJournal, detectMood } from "@/lib/ai-organize"
import { recognizeImage } from "@/lib/ocr"

function todayStr() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10)
}

interface EntryFormProps {
  open: boolean
  onClose: () => void
  onSave: (entry: Omit<JournalEntry, "id" | "createdAt">) => void
}

export function EntryForm({ open, onClose, onSave }: EntryFormProps) {
  const [date, setDate] = useState(todayStr())
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [mood, setMood] = useState<string>(MOODS[0].emoji)
  const [summary, setSummary] = useState<string[]>([])
  const [organizing, setOrganizing] = useState(false)
  const [organizeError, setOrganizeError] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  // 拍照识图的分阶段状态：识别中 → 润色中 → 完成
  const [scanStage, setScanStage] = useState<"idle" | "ocr" | "polish">("idle")

  // 每次打开时重置表单
  useEffect(() => {
    if (open) {
      setDate(todayStr())
      setTitle("")
      setContent("")
      setMood(MOODS[0].emoji)
      setSummary([])
      setOrganizing(false)
      setOrganizeError("")
      setImagePreview("")
      setScanStage("idle")
    }
  }, [open])

  // 组件卸载时释放预览图的 object URL
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  // Esc 关闭
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  async function handleOrganize() {
    if (organizing || content.trim().length < 4) return
    setOrganizing(true)
    setOrganizeError("")
    try {
      const result = await organizeJournal(content)
      // 只有标题为空时才用 AI 生成的标题，避免覆盖用户已填的标题
      if (!title.trim()) setTitle(result.title)
      setContent(result.content)
      setSummary(result.summary)
    } catch (err) {
      console.log("[v0] AI 整理失败:", err)
      setOrganizeError("整理失败了，请稍后再试")
    } finally {
      setOrganizing(false)
    }
  }

  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // 允许重复选择同一张图
    e.target.value = ""
    if (!file) return

    setOrganizeError("")
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(URL.createObjectURL(file))

    try {
      // 1) OCR 识别图中文字
      setScanStage("ocr")
      const { text } = await recognizeImage(file)
      setContent(text)

      // 2) 自动触发 AI 润色/纠错 + 整理
      setScanStage("polish")
      const result = await organizeJournal(text)
      if (!title.trim()) setTitle(result.title)
      setContent(result.content)
      setSummary(result.summary)

      // 3) 自动分类：日期用今天，心情按内容里的情绪关键词匹配
      setDate(todayStr())
      const detected = detectMood(result.content)
      if (detected) setMood(detected)
    } catch (err) {
      console.log("[v0] 拍照识图失败:", err)
      setOrganizeError("识别失败了，请换一张更清晰的图片试试")
    } finally {
      setScanStage("idle")
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      date,
      title: title.trim(),
      content: content.trim(),
      mood,
      summary: summary.length > 0 ? summary : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* 遮罩 */}
      <button
        aria-label="关闭"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />

      {/* 表单卡片 */}
      <div className="relative w-full max-w-lg rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl text-foreground">写一篇手账</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭">
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="date" className="text-sm font-medium text-muted-foreground">
              日期
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="text-sm font-medium text-muted-foreground">
              标题
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="今天想记点什么？"
              maxLength={60}
              autoFocus
              className="rounded-xl border border-input bg-background px-3 py-2 text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">今日心情</label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.emoji}
                  type="button"
                  onClick={() => setMood(m.emoji)}
                  title={m.label}
                  aria-pressed={mood === m.emoji}
                  style={{ backgroundColor: m.tint }}
                  className={`flex size-11 items-center justify-center rounded-full text-2xl transition-all ${
                    mood === m.emoji
                      ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-card"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <span aria-hidden="true">{m.emoji}</span>
                  <span className="sr-only">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="content" className="text-sm font-medium text-muted-foreground">
                内容
              </label>
              {/* 拍照 / 上传图片入口 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelected}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanStage !== "idle"}
                className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera className="size-4 text-primary" />
                拍照/上传图片
              </button>
            </div>

            {/* 识别中的图片预览与进度提示 */}
            {imagePreview && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="待识别的便签图片"
                  className="size-14 shrink-0 rounded-lg border border-border object-cover"
                />
                <div className="flex flex-1 flex-col gap-0.5">
                  {scanStage === "ocr" && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                      <ScanText className="size-4 animate-pulse" />
                      正在识别图片文字……
                    </span>
                  )}
                  {scanStage === "polish" && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                      <Loader2 className="size-4 animate-spin" />
                      正在 AI 润色纠错……
                    </span>
                  )}
                  {scanStage === "idle" && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-accent-foreground">
                      <Sparkles className="size-4" />
                      识别完成，已自动填好内容与心情
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    识别结果可能有误，请核对后再保存
                  </span>
                </div>
              </div>
            )}

            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下今天的故事……也可以拍张便签上传，或把碎碎念粘进来点「帮我整理」"
              rows={5}
              className="resize-none rounded-xl border border-input bg-background px-3 py-2 leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
            />

            {/* AI 智能整理 */}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleOrganize}
                disabled={organizing || content.trim().length < 4}
                className="inline-flex items-center gap-2 self-start rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {organizing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    正在整理……
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    帮我整理
                  </>
                )}
              </button>
              <p className="text-xs text-muted-foreground">
                {organizeError ? (
                  <span className="text-destructive">{organizeError}</span>
                ) : (
                  "把杂乱的碎碎念自动分段、生成标题和今日总结，并保留你的语气"
                )}
              </p>
            </div>
          </div>

          {/* AI 生成的今日总结预览 */}
          {summary.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-accent bg-accent/40 p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-accent-foreground">
                <ListChecks className="size-4" />
                今日总结
              </span>
              <ul className="flex flex-col gap-1.5">
                {summary.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/80">
                    <span aria-hidden="true" className="text-primary">
                      ·
                    </span>
                    <span className="flex-1">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-1 flex justify-end gap-3">
            <Button type="button" variant="ghost" size="lg" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" size="lg" disabled={!title.trim()}>
              保存手账
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
