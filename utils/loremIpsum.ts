// ── Types ─────────────────────────────────────────────────────────────────────

export type LoremUnit   = "words" | "sentences" | "paragraphs"
export type LoremFormat = "plain" | "html" | "markdown"

export type LoremOptions = {
  unit:       LoremUnit
  count:      number
  format:     LoremFormat
  startWithLorem: boolean   // always start with "Lorem ipsum dolor sit amet"
  minWords:   number        // min words per sentence
  maxWords:   number        // max words per sentence
  minSents:   number        // min sentences per paragraph
  maxSents:   number        // max sentences per paragraph
}

export type LoremResult = {
  output: string
  stats:  LoremStats
}

export type LoremStats = {
  words:      number
  sentences:  number
  paragraphs: number
  characters: number
}

export const DEFAULT_OPTIONS: LoremOptions = {
  unit:           "paragraphs",
  count:          3,
  format:         "plain",
  startWithLorem: true,
  minWords:       6,
  maxWords:       14,
  minSents:       4,
  maxSents:       8,
}

// ── Word bank ─────────────────────────────────────────────────────────────────

const WORDS = [
  "lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit",
  "sed","do","eiusmod","tempor","incididunt","ut","labore","et","dolore",
  "magna","aliqua","enim","ad","minim","veniam","quis","nostrud","exercitation",
  "ullamco","laboris","nisi","aliquip","ex","ea","commodo","consequat","duis",
  "aute","irure","in","reprehenderit","voluptate","velit","esse","cillum",
  "fugiat","nulla","pariatur","excepteur","sint","occaecat","cupidatat","non",
  "proident","sunt","culpa","qui","officia","deserunt","mollit","anim","id","est",
  "laborum","perspiciatis","unde","omnis","iste","natus","error","accusantium",
  "doloremque","laudantium","totam","rem","aperiam","eaque","ipsa","quae","ab",
  "illo","inventore","veritatis","architecto","beatae","vitae","dicta","explicabo",
  "nemo","ipsam","voluptatem","quia","voluptas","aspernatur","odit","fugit",
  "consequuntur","magni","dolores","eos","ratione","sequi","nesciunt","neque",
  "porro","quisquam","dolorem","adipisci","numquam","eius","modi","tempora",
  "incidunt","magnam","quaerat","voluptatibus","maiores","alias","perferendis",
  "doloribus","asperiores","repellat","facilis","expedita","distinctio","libero",
  "temporibus","cumque","soluta","nobis","eligendi","optio","cumque","nihil",
  "impedit","quo","minus","maxime","placeat","facere","possimus","omnis",
  "assumenda","repellendus","dignissimos","ducimus","blanditiis","praesentium",
]

const LOREM_START = "Lorem ipsum dolor sit amet, consectetur adipiscing elit"

// ── Main generator ────────────────────────────────────────────────────────────

export function generateLorem(
  options: Partial<LoremOptions> = {}
): LoremResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  opts.count = Math.max(1, Math.min(opts.count, 200))

  let paragraphs: string[]

  switch (opts.unit) {
    case "words": {
      const words = generateWords(opts.count, opts.startWithLorem)
      paragraphs  = [words.join(" ")]
      break
    }
    case "sentences": {
      const sents = generateSentences(opts.count, opts.startWithLorem, opts)
      paragraphs  = [sents.join(" ")]
      break
    }
    case "paragraphs":
    default: {
      paragraphs = generateParagraphs(opts.count, opts.startWithLorem, opts)
      break
    }
  }

  const output = formatOutput(paragraphs, opts.format)
  const stats  = calcStats(paragraphs)

  return { output, stats }
}

// ── Paragraph / sentence / word builders ──────────────────────────────────────

function generateParagraphs(
  count: number,
  startWithLorem: boolean,
  opts: LoremOptions
): string[] {
  return Array.from({ length: count }, (_, i) => {
    const sentCount = randInt(opts.minSents, opts.maxSents)
    const sents     = generateSentences(sentCount, i === 0 && startWithLorem, opts)
    return sents.join(" ")
  })
}

function generateSentences(
  count: number,
  startWithLorem: boolean,
  opts: Pick<LoremOptions, "minWords" | "maxWords">
): string[] {
  return Array.from({ length: count }, (_, i) => {
    if (i === 0 && startWithLorem) return LOREM_START + "."
    const wordCount = randInt(opts.minWords, opts.maxWords)
    const words     = generateWords(wordCount, false)
    return capitalize(words.join(" ")) + "."
  })
}

function generateWords(count: number, startWithLorem: boolean): string[] {
  if (startWithLorem) {
    const start = LOREM_START.replace(",", "").split(" ")
    const extra = Array.from(
      { length: Math.max(0, count - start.length) },
      () => randomWord()
    )
    return [...start, ...extra].slice(0, count)
  }
  return Array.from({ length: count }, () => randomWord())
}

// ── Formatters ────────────────────────────────────────────────────────────────

function formatOutput(paragraphs: string[], format: LoremFormat): string {
  switch (format) {
    case "html":
      return paragraphs.map((p) => `<p>${p}</p>`).join("\n")

    case "markdown":
      return paragraphs.join("\n\n")

    case "plain":
    default:
      return paragraphs.join("\n\n")
  }
}

// ── Stat calculator ───────────────────────────────────────────────────────────

function calcStats(paragraphs: string[]): LoremStats {
  const full      = paragraphs.join(" ")
  const words     = full.split(/\s+/).filter(Boolean).length
  const sentences = (full.match(/[.!?]+/g) ?? []).length
  const chars     = full.length

  return {
    words,
    sentences,
    paragraphs: paragraphs.length,
    characters: chars,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── Presets ───────────────────────────────────────────────────────────────────

export type LoremPreset = {
  label:   string
  options: Partial<LoremOptions>
}

export const PRESETS: LoremPreset[] = [
  {
    label:   "Short paragraph",
    options: { unit: "paragraphs", count: 1, minSents: 3, maxSents: 4 },
  },
  {
    label:   "Blog post",
    options: { unit: "paragraphs", count: 5, minSents: 5, maxSents: 9 },
  },
  {
    label:   "Heading",
    options: { unit: "words", count: 6, startWithLorem: true },
  },
  {
    label:   "Subheading",
    options: { unit: "words", count: 10, startWithLorem: false },
  },
  {
    label:   "Button label",
    options: { unit: "words", count: 3, startWithLorem: false },
  },
  {
    label:   "Tweet-length",
    options: { unit: "words", count: 30, startWithLorem: true },
  },
  {
    label:   "Card description",
    options: { unit: "sentences", count: 2, minWords: 10, maxWords: 16 },
  },
  {
    label:   "Article intro",
    options: { unit: "sentences", count: 4, minWords: 12, maxWords: 20 },
  },
]