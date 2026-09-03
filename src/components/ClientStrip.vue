<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// The "worked with" logo strip, showing more logos than fit — by rotating,
// not by scrolling.
//
// Five fixed slots, ten logos. Every SWAP_MS one slot cross-fades to the next
// logo in the list, round-robin. Nothing ever changes position, which is what
// keeps it quiet: a marquee moves every logo continuously and pulls the eye
// down the page, whereas here the row is still and one cell dissolves. You
// register that the set is larger than five without being asked to watch.
//
// The sequence advances a shared cursor rather than picking at random, so a
// logo can never appear in two slots at once: slots start on 0–4, the next five
// swaps fill them with 5–9, and only then does it wrap back to 0.
const props = defineProps({
  // `{ slug, name, src }` — see `data/media.js`.
  clients: { type: Array, required: true },
  // How many are on screen at once on a wide viewport. Fewer than
  // `clients.length`, or there is nothing to rotate to and the strip is just a
  // static row.
  visible: { type: Number, default: 5 },
  // Narrow viewports show fewer. Five 132px slots need ~820px with the gaps,
  // so below that the row wrapped to 4 + 1 — an orphan that reads as a mistake
  // rather than a second line. Dropping to three keeps it one row, and the
  // rotation covers the rest.
  visibleNarrow: { type: Number, default: 3 },
})

// The dwell. The fade itself is 900ms, set on `.client-*-active` below — long
// relative to this interval, so the strip is static ~85% of the time and the
// change is too slow to register as movement. Shortening the fade is what would
// make it flicker.
const SWAP_MS = 6000

// Tailwind's `sm`. Tracked in JS rather than done with CSS because the slot
// COUNT changes, not just the layout — five slots hidden by CSS below `sm`
// would still be rotating, so the row you see would skip logos.
const wide = ref(true)
let mq = null

const count = computed(() =>
  Math.min(wide.value ? props.visible : props.visibleNarrow, props.clients.length),
)
const rotates = computed(() => props.clients.length > count.value)

// Which client index each slot currently shows.
const slots = ref([])
let cursor = 0
let slotIndex = 0
let timer = null

const reduceMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const tick = () => {
  // Skip while the tab is hidden. Without this, a backgrounded tab wakes up
  // with a queue of elapsed intervals and the whole row churns at once.
  if (document.hidden) return
  slots.value[slotIndex] = cursor
  slotIndex = (slotIndex + 1) % count.value
  cursor = (cursor + 1) % props.clients.length
}

const start = () => {
  if (timer || !rotates.value || reduceMotion()) return
  timer = setInterval(tick, SWAP_MS)
}
const stop = () => {
  clearInterval(timer)
  timer = null
}

const onBreakpoint = (e) => {
  wide.value = e.matches
  stop()
  reseat()
  start()
}

// Rebuild from the start whenever the slot count changes. Resizing across the
// breakpoint mid-rotation would otherwise leave a stale index in a dropped slot
// and let the same logo appear twice when it came back.
const reseat = () => {
  slots.value = Array.from({ length: count.value }, (_, i) => i)
  cursor = count.value % props.clients.length
  slotIndex = 0
}

onMounted(() => {
  mq = window.matchMedia('(min-width: 640px)')
  wide.value = mq.matches
  mq.addEventListener('change', onBreakpoint)
  reseat()
  start()
})
onBeforeUnmount(() => {
  stop()
  mq?.removeEventListener('change', onBreakpoint)
})

const clientAt = (i) => props.clients[slots.value[i]]
</script>

<template>
  <!-- Hovering pauses the rotation: a logo dissolving under the cursor while
       someone is reading it is the one way this motion becomes annoying. -->
  <div
    class="flex items-center justify-center gap-x-8 sm:gap-x-12"
    @mouseenter="stop"
    @mouseleave="start"
  >
    <!-- Each slot is a fixed-height, capped-width box so the row's rhythm never
         shifts as logos of different widths swap through it. `min-w-0` plus
         `flex-1` lets a slot shrink below 132px on a narrow screen instead of
         forcing a wrap, and `object-contain` letterboxes the logo inside
         whatever the slot ends up being. -->
    <div
      v-for="(_, i) in slots"
      :key="i"
      class="relative h-8 min-w-0 max-w-[132px] flex-1"
      :aria-live="rotates ? 'off' : undefined"
    >
      <Transition name="client">
        <img
          v-if="clientAt(i)"
          :key="clientAt(i).slug"
          :src="clientAt(i).src"
          :alt="clientAt(i).name"
          class="absolute inset-0 size-full object-contain opacity-70"
          loading="lazy"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Both halves absolute and overlapping, so the outgoing logo dissolves into
   the incoming one in place rather than one collapsing before the other
   arrives (which would read as a flicker). */
.client-enter-active,
.client-leave-active {
  transition: opacity 900ms ease;
}
.client-enter-from,
.client-leave-to {
  opacity: 0 !important;
}

@media (prefers-reduced-motion: reduce) {
  .client-enter-active,
  .client-leave-active {
    transition: none;
  }
}
</style>
