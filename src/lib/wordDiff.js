// Word-level diff of two paragraphs, for the description markers on a
// requirements update (docs/edit-requirements.md, "In the thread").
//
// Returns runs of `{ type: 'same' | 'add' | 'del', text }`, in reading order,
// with removed words placed before the words that replaced them. Whitespace
// travels with the word before it, so joining every run's text in order gives
// back the old paragraph (same + del) or the new one (same + add).
//
// A plain longest-common-subsequence over words: briefs are a few hundred words
// at most, so the quadratic table is fine and nothing cleverer is needed.

const words = (text) => (text ?? '').match(/\S+\s*/g) ?? []
const key = (w) => w.trim()

export function wordDiff(before, after) {
  const a = words(before)
  const b = words(after)
  const n = a.length
  const m = b.length
  const lcs = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = key(a[i]) === key(b[j]) ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const runs = []
  const push = (type, text) => {
    const last = runs.at(-1)
    if (last?.type === type) last.text += text
    else runs.push({ type, text })
  }
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (key(a[i]) === key(b[j])) {
      push('same', b[j])
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push('del', a[i++])
    } else {
      push('add', b[j++])
    }
  }
  while (i < n) push('del', a[i++])
  while (j < m) push('add', b[j++])
  return runs
}

// More than half the new paragraph is new or the old one is mostly gone: the
// markers would interleave two versions, so the card shows the new text clean
// and the event line says "Description rewritten" instead.
export function isRewrite(before, after) {
  const runs = wordDiff(before, after)
  const count = (type) => runs.filter((r) => r.type === type).reduce((s, r) => s + words(r.text).length, 0)
  const total = Math.max(words(after).length, 1)
  return count('add') / total > 0.5 || count('del') / Math.max(words(before).length, 1) > 0.5
}
