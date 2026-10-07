<script setup>
import { computed } from 'vue'

// A pack's modules as a stack of floating squares seen from an angle — one
// square per module, top to bottom in the pack's own order, each labelled
// beside it with its icon and name, alternating left and right. Drawn for the
// pack dialog only: the dialog is the at-a-glance view, and "which parts, how
// many" is the glance.
//
// Every square is a diamond — a square turned 45° and squashed to half its
// height, which is the angled view.
//
// ⚠️ DRAWN AS A PATH IN SCREEN SPACE, not a rounded `<rect>` under a squash
// transform. Squashed, one `rx` came out uneven: the top and bottom corners
// were stretched into wide, soft curves and the side corners pinched to
// points, so the squares looked rounder at the top. One on-screen radius for
// all four overshot the other way — on the wide top and bottom corners a 6px
// arc is a short one and read as sharp. So the wide corners take twice the
// radius of the narrow ones, which is what makes the four look alike. Flat, and filled with the panel's own
// gray, so each square hides the outlines beneath it and the stack reads as
// layers rather than a tangle of crossing lines. Drawn bottom-up for that.
//
// ⚠️ Colours are frappe-ui's CSS variables in `style`, not classes: its
// Tailwind preset generates `fill-ink-*` but no surface or outline fill and
// stroke utilities, and those classes silently fell back to black.
const props = defineProps({
  // [{ label, icon }] — the icon is the module's mark from `SCOPE_ICONS`.
  modules: { type: Array, required: true },
})

const W = 480
const CX = W / 2
const SIDE = 120 // the square, before the view is applied
const HW = (SIDE * Math.SQRT2) / 2 // half the diamond's width
const HH = HW / 2 // half its height: the 2:1 squash
// From one square's centre to the next — tuned by eye: at 38 the thin V of
// each lower square read as the sides of one solid block, at 58 the sheets
// drifted apart.
const GAP = 42
const PAD = 16

const squares = computed(() =>
  props.modules.map((m, i) => ({ ...m, cy: PAD + HH + i * GAP, left: i % 2 === 0 })),
)
// Bottom-up, so each square covers the one beneath it.
const drawOrder = computed(() => [...squares.value].reverse())
const height = computed(() => PAD + HH + (props.modules.length - 1) * GAP + HH + PAD)

// The diamond's outline with every corner filleted: along each edge, cut back
// from the corner by r / tan(half its angle), and join the cuts with an arc of
// radius r. Corners run clockwise from the top: wide, narrow, wide, narrow.
const R_WIDE = 6
const R_NARROW = 3
const diamond = (cy) => {
  const pts = [
    [CX, cy - HH],
    [CX + HW, cy],
    [CX, cy + HH],
    [CX - HW, cy],
  ]
  const unit = ([x, y]) => {
    const l = Math.hypot(x, y)
    return [x / l, y / l]
  }
  return (
    pts
      .map((p, i) => {
        const prev = pts[(i + 3) % 4]
        const next = pts[(i + 1) % 4]
        const u = unit([prev[0] - p[0], prev[1] - p[1]])
        const v = unit([next[0] - p[0], next[1] - p[1]])
        const r = i % 2 ? R_NARROW : R_WIDE
        const t = r / Math.tan(Math.acos(u[0] * v[0] + u[1] * v[1]) / 2)
        const a = [p[0] + u[0] * t, p[1] + u[1] * t]
        const b = [p[0] + v[0] * t, p[1] + v[1] * t]
        return `${i ? 'L' : 'M'}${a[0]} ${a[1]} A${r} ${r} 0 0 1 ${b[0]} ${b[1]}`
      })
      .join(' ') + ' Z'
  )
}

// Along each label's row, outward from the square: a short rule, then the
// label — icon BEFORE name on both sides, so it reads the same way left and
// right. The label is HTML in a `foreignObject`: on the left it is
// right-aligned against the rule, and SVG text cannot put an icon before a
// right-aligned run without measuring it.
const LABEL_W = 150
const row = (s) => {
  const dir = s.left ? -1 : 1
  const edge = CX + dir * (HW + 10)
  const ruleEnd = edge + dir * 28
  const near = ruleEnd + dir * 8
  return { edge, ruleEnd, labelX: s.left ? near - LABEL_W : near }
}
</script>

<template>
  <svg
    :viewBox="`0 0 ${W} ${height}`"
    class="mx-auto block w-full max-w-[480px]"
    role="img"
    :aria-label="`Modules in this pack: ${modules.map((m) => m.label).join(', ')}`"
  >
    <path
      v-for="s in drawOrder"
      :key="`square-${s.label}`"
      :d="diamond(s.cy)"
      style="fill: var(--surface-gray-2); stroke: var(--outline-gray-4)"
    />
    <g v-for="s in squares" :key="`label-${s.label}`">
      <line
        :x1="row(s).edge"
        :x2="row(s).ruleEnd"
        :y1="s.cy"
        :y2="s.cy"
        style="stroke: var(--outline-gray-3)"
      />
      <foreignObject :x="row(s).labelX" :y="s.cy - 10" :width="LABEL_W" height="20">
        <div
          class="flex h-full items-center gap-1.5"
          :class="s.left ? 'justify-end' : 'justify-start'"
        >
          <component :is="s.icon" class="size-3.5 shrink-0 text-ink-gray-5" aria-hidden="true" />
          <span class="whitespace-nowrap text-[13px] leading-none text-ink-gray-6">
            {{ s.label }}
          </span>
        </div>
      </foreignObject>
    </g>
  </svg>
</template>
