export interface OcrResult {
  /** 从图片中识别出的原始文字（可能含错别字 / 潦草误识） */
  text: string
  /** 识别置信度 0-1，真实 OCR 会返回；模拟时给个示意值 */
  confidence: number
}

/**
 * 识别图片中的文字（OCR）。
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  对接真实 OCR 接口的位置                                       │
 * │                                                               │
 * │  目前用 mock 数据 + 1.5 秒延迟「模拟」识别效果。               │
 * │  接入真实 OCR 时，替换下面 mock 部分即可，两种常见方案：       │
 * │                                                               │
 * │  ① 纯前端 Tesseract.js（无需后端，适合中英文便签）：           │
 * │     import Tesseract from "tesseract.js"                      │
 * │     const { data } = await Tesseract.recognize(file, "chi_sim+eng") │
 * │     return { text: data.text, confidence: data.confidence/100 } │
 * │                                                               │
 * │  ② 云 OCR（识别更准，尤其潦草字迹）：把图片传到服务端路由      │
 * │     app/api/ocr/route.ts，再调用百度/腾讯/Google Vision 等：  │
 * │     const form = new FormData()                               │
 * │     form.append("image", file)                                │
 * │     const res = await fetch("/api/ocr", { method: "POST", body: form }) │
 * │     return (await res.json()) as OcrResult                    │
 * └─────────────────────────────────────────────────────────────┘
 */
export async function recognizeImage(_file: File): Promise<OcrResult> {
  // ===== 模拟 OCR 识别耗时（真实接入时删除这一行）=====
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // ===== 以下为演示用的 mock 结果，真实接入时整体替换为上面的 OCR 调用 =====
  // 故意保留一些「潦草误识」的错字（今天->令天、开心->开薪、咖啡->加非 等），
  // 好让后续的「AI 润色/纠错」有东西可以修正，直观展示完整流程。
  return {
    text: MOCK_MESSY_TEXTS[Math.floor(Math.random() * MOCK_MESSY_TEXTS.length)],
    confidence: 0.82,
  }
}

/** 模拟从潦草便签里识别出来、带错别字的文字 */
const MOCK_MESSY_TEXTS = [
  "令天下午去了一家新开的加非馆点了一杯拿铁味道很不错坐在窗边看书度过了一个很放松的下五感觉特别开薪",
  "早上跑步五公里虽然有点累但是跑完之后浑身舒畅然后回家做了顿丰盛的枣餐心情美丽的一天开始了",
  "晚上和朋友一起吃饭聊了很久好久没这么开心过了原来大家都过得挺不容易的但还是要加由呀",
]
