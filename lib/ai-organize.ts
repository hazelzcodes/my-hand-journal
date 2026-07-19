export interface OrganizeResult {
  /** 自动生成的简短标题 */
  title: string
  /** 分好段、润色后的正文（段落间用空行分隔） */
  content: string
  /** 今日总结 / 关键点，内容较短时为空数组 */
  summary: string[]
}

/**
 * 把一段杂乱的碎碎念整理成结构清晰的手账。
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  对接真实 AI 接口的位置                                        │
 * │                                                               │
 * │  目前用本地逻辑 + 2 秒延迟「模拟」AI 效果。接入真实模型时，     │
 * │  只需把下面 mock 部分替换成一次请求即可，例如：                │
 * │                                                               │
 * │    const res = await fetch("/api/organize", {                 │
 * │      method: "POST",                                          │
 * │      headers: { "Content-Type": "application/json" },         │
 * │      body: JSON.stringify({ text: rawText }),                 │
 * │    })                                                         │
 * │    return (await res.json()) as OrganizeResult                │
 * │                                                               │
 * │  服务端（app/api/organize/route.ts）推荐用 Vercel AI SDK 的    │
 * │  generateObject，配合下面的 JSON schema 让模型直接产出         │
 * │  { title, content, summary } 结构化结果。                     │
 * └─────────────────────────────────────────────────────────────┘
 */
export async function organizeJournal(rawText: string): Promise<OrganizeResult> {
  // ===== 模拟 AI 推理耗时（真实接入时删除这一行）=====
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // ===== 以下为本地演示逻辑，真实接入时整体替换为 API 请求 =====
  return mockOrganize(rawText)
}

/**
 * 建议给真实模型的系统提示词（接入时可直接复用）：
 *
 *   你是一个贴心的手账整理助手。请把用户这段杂乱、可能没有标点、
 *   逻辑跳跃的碎碎念，整理成一篇排版清晰的手账。要求：
 *   1. 自动分段，每段聚焦一件事；
 *   2. 生成一个 12 字以内的简短标题；
 *   3. 若内容较长，提炼 2-4 条「今日总结 / 关键点」；
 *   4. 保持用户原本的语气和第一人称，只让语句更通顺，不要编造事实。
 *   以 JSON 返回 { title, content, summary }。
 */
export const ORGANIZE_SYSTEM_PROMPT = `你是一个贴心的手账整理助手。请把用户这段杂乱、可能没有标点、逻辑跳跃的碎碎念，整理成一篇排版清晰的手账：自动分段，生成 12 字以内标题，内容较长时提炼 2-4 条关键点，保持原本语气只让语句更通顺，不要编造事实。以 JSON 返回 { title, content, summary }。`

/**
 * 根据文字里的情绪关键词，自动匹配一个心情 emoji。
 * 真实接入时也可以让 AI 在整理时一并返回 mood 字段，这里用本地关键词演示。
 * 返回 null 表示没检测到明显情绪，调用方可保持默认心情。
 */
export function detectMood(text: string): string | null {
  const rules: { emoji: string; words: RegExp }[] = [
    { emoji: "🥳", words: /(庆祝|生日|升职|中奖|好久没这么开心|太棒了|成功)/ },
    { emoji: "🥰", words: /(幸福|温暖|喜欢|爱你|感动|甜|被治愈)/ },
    { emoji: "😊", words: /(开心|开薪|快乐|愉快|美丽的一天|舒畅|放松|不错|满足)/ },
    { emoji: "✨", words: /(灵感|想到|点子|突然明白|顿悟|收获)/ },
    { emoji: "😴", words: /(累|疲惫|困|想睡|好困|精疲力竭)/ },
    { emoji: "🤔", words: /(思考|纠结|犹豫|不知道|考虑|想不通)/ },
    { emoji: "😢", words: /(难过|伤心|哭|失落|遗憾|想哭)/ },
    { emoji: "🌧️", words: /(低落|沮丧|郁闷|压抑|不容易|烦)/ },
    { emoji: "😡", words: /(生气|愤怒|气死|讨厌|烦死)/ },
  ]
  for (const r of rules) {
    if (r.words.test(text)) return r.emoji
  }
  return null
}

/* -------------------------------------------------------------------------- */
/*                          本地演示用的轻量整理逻辑                            */
/* -------------------------------------------------------------------------- */

const CONNECTORS =
  /(然后|接着|后来|于是|结果|不过|但是|而且|另外|最后|之后|一开始|早上|中午|下午|傍晚|晚上|今天|昨天)/g

const TIME_PREFIX = /^(今天|昨天|早上|中午|下午|傍晚|晚上|一开始|然后|后来|于是|接着)/

// 单独出现时应并入后一句的引导词，避免出现「今天。」这样的单字碎片
const LEAD_ONLY = new Set([
  "今天", "昨天", "早上", "中午", "下午", "傍晚", "晚上",
  "一开始", "然后", "后来", "于是", "接着", "结果", "之后",
])

/** 把纯引导词的短碎片并入后一句 */
function mergeLeads(parts: string[]): string[] {
  const out: string[] = []
  for (const p of parts) {
    if (out.length > 0 && LEAD_ONLY.has(out[out.length - 1])) {
      out[out.length - 1] += p
    } else {
      out.push(p)
    }
  }
  return out
}

/** 把长文切成一句一句 */
function splitSentences(raw: string): string[] {
  let t = raw.replace(/\r/g, "").trim()

  // 在句末标点后插入切分标记
  t = t.replace(/([。！？!?；;])/g, "$1\u0001")

  // 如果几乎没有句末标点（典型的语音转文字），就在口语连接词前切分
  if (!/[。！？!?]/.test(raw)) {
    t = t.replace(CONNECTORS, "\u0001$1")
  }

  const parts = t
    .split("\u0001")
    .map((s) => s.replace(/^[，,、\s]+|[，,、\s]+$/g, "").trim())
    .filter((s) => s.length > 0)

  return mergeLeads(parts)
}

/** 补齐句末标点，做基础润色 */
function polish(sentence: string): string {
  const clean = sentence.replace(/[ \t]+/g, "").trim()
  if (!clean) return ""
  if (/[。！？!?…、，,]$/.test(clean)) {
    return clean.replace(/[、，,]$/, "。")
  }
  return clean + "。"
}

/** 每 2-3 句归为一段 */
function groupParagraphs(sentences: string[], perPara = 3): string {
  const paragraphs: string[] = []
  for (let i = 0; i < sentences.length; i += perPara) {
    const para = sentences
      .slice(i, i + perPara)
      .map(polish)
      .join("")
    if (para) paragraphs.push(para)
  }
  return paragraphs.join("\n\n")
}

/** 反复剥掉开头的时间 / 连接词 */
function stripLead(s: string): string {
  let t = s
  let prev = ""
  while (t !== prev) {
    prev = t
    t = t.replace(TIME_PREFIX, "")
  }
  return t
}

/** 根据内容生成一个简短标题：挑第一句足够有信息量的短句 */
function makeTitle(sentences: string[]): string {
  for (const s of sentences) {
    const stripped = stripLead(s).replace(/[，,。！？!?、].*$/, "")
    if (stripped.length >= 4) return stripped.slice(0, 12)
  }
  const fallback = stripLead(sentences[0] ?? "").slice(0, 12).trim()
  return fallback || "今天的碎碎念"
}

/** 内容较长时，从每段挑一句作为关键点 */
function makeSummary(sentences: string[]): string[] {
  if (sentences.length < 4) return []
  const picks: string[] = []
  for (let i = 0; i < sentences.length && picks.length < 4; i += 3) {
    const s = polish(sentences[i])
    if (s) picks.push(s)
  }
  return picks
}

function mockOrganize(raw: string): OrganizeResult {
  const sentences = splitSentences(raw)

  // 输入过短，几乎无法整理时，原样润色返回
  if (sentences.length === 0) {
    return { title: "今天的碎碎念", content: raw.trim(), summary: [] }
  }

  return {
    title: makeTitle(sentences),
    content: groupParagraphs(sentences),
    summary: makeSummary(sentences),
  }
}
