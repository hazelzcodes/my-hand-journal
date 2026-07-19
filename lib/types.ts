export interface JournalEntry {
  id: string
  date: string // YYYY-MM-DD
  title: string
  content: string
  mood: string // emoji
  summary?: string[] // AI 整理生成的「今日总结 / 关键点」
  createdAt: number
}

export interface Mood {
  emoji: string
  label: string
  /** 淡淡的背景色块 */
  tint: string
  /** 与背景搭配的文字色 */
  ink: string
}

export const MOODS: Mood[] = [
  { emoji: "😊", label: "开心", tint: "oklch(0.94 0.06 95)", ink: "oklch(0.48 0.09 80)" },
  { emoji: "🥰", label: "幸福", tint: "oklch(0.93 0.05 20)", ink: "oklch(0.5 0.12 20)" },
  { emoji: "😌", label: "平静", tint: "oklch(0.93 0.045 150)", ink: "oklch(0.46 0.08 150)" },
  { emoji: "🤔", label: "思考", tint: "oklch(0.93 0.04 300)", ink: "oklch(0.48 0.08 300)" },
  { emoji: "😴", label: "疲惫", tint: "oklch(0.92 0.03 270)", ink: "oklch(0.48 0.06 270)" },
  { emoji: "😢", label: "难过", tint: "oklch(0.92 0.045 240)", ink: "oklch(0.48 0.1 245)" },
  { emoji: "😡", label: "生气", tint: "oklch(0.92 0.06 30)", ink: "oklch(0.52 0.15 28)" },
  { emoji: "🥳", label: "庆祝", tint: "oklch(0.93 0.06 60)", ink: "oklch(0.52 0.13 55)" },
  { emoji: "🌧️", label: "低落", tint: "oklch(0.91 0.025 230)", ink: "oklch(0.46 0.05 235)" },
  { emoji: "✨", label: "灵感", tint: "oklch(0.94 0.06 110)", ink: "oklch(0.48 0.1 110)" },
]

export function moodOf(emoji: string): Mood {
  return MOODS.find((m) => m.emoji === emoji) ?? MOODS[0]
}

export const STORAGE_KEY = "my-journal-entries"
