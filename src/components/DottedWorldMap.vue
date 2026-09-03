<script setup>
// The partner map beside the region question.
//
// The dotted landmass is Frappe Cloud's own `world-map.svg` asset, embedded as
// an <image> and shared coordinate space with the pins — same approach, same
// projection constants, and the same `preserveAspectRatio="none"` stretch as
// `WorldMap.vue` in frappe-cloud-v2, so pin placement calibrated there carries
// over here unchanged.
//
// Pins are partner hubs, not servers: they light up for whichever region the
// visitor has currently answered, so the map reacts to the question beside it
// rather than sitting there as decoration.
import { computed } from 'vue'
import mapUrl from '../assets/world-map.svg'
import { HUB_CITIES } from '../data/quiz'

const props = defineProps({
  // Region keys from `data/quiz.js`. An array because the region question takes
  // more than one answer — every hub in any answered region lights up. Empty
  // before the question is reached, which leaves the whole map at rest.
  highlight: { type: Array, default: () => [] },
})

// Frappe Cloud's canvas and Mercator crop. The asset's own viewBox is 119×60;
// these are the dimensions WorldMap.vue stretches it to, kept identical so the
// lat/lng maths is the same maths.
const W = 879
const H = 443
const LAT_TOP = 83
const LAT_BOTTOM = -56

const project = (lat, lng) => ({
  x: ((lng + 180) / 360) * W,
  y: ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * H,
})

const pins = computed(() =>
  HUB_CITIES.map((hub) => {
    const { x, y } = project(hub.lat, hub.lng)
    const on = props.highlight.includes(hub.region)
    return {
      ...hub,
      x,
      y,
      on,
      // Before any answer every hub reads at the middle tier, so the map still
      // shows where partners are while the question is still open.
      r: on ? 6 : 4.5,
      fill: on ? 'var(--ink-gray-9)' : 'var(--ink-gray-5)',
    }
  }),
)
</script>

<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    class="h-auto w-full"
    role="img"
    aria-label="World map showing where Frappe partners are located"
  >
    <image :href="mapUrl" x="0" y="0" :width="W" :height="H" preserveAspectRatio="none" />

    <circle
      v-for="p in pins"
      :key="p.id"
      :cx="p.x"
      :cy="p.y"
      :r="p.r"
      :fill="p.fill"
      class="fc-map-pin"
    />
  </svg>
</template>

<style scoped>
.fc-map-pin {
  transition:
    r 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    fill 0.35s ease;
}

@media (prefers-reduced-motion: reduce) {
  .fc-map-pin {
    transition: none;
  }
}
</style>
