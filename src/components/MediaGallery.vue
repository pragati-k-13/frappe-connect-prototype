<script setup>
import { computed, ref } from 'vue'
import MediaLightbox from './MediaLightbox.vue'

// The profile's media block: one large tile beside a stacked pair, matching the
// design. Every tile does one thing on click — opens full-screen. See
// `MediaLightbox`.
//
// The clip is no exception: there is no inline player. Its tile shows the
// poster with a play glyph and opens in the lightbox, where the video is the
// same size as an image would be. One target per tile, one behaviour for the
// whole gallery.
const props = defineProps({
  // `{ id, kind, src, poster, alt }` items — see `data/media.js`.
  items: { type: Array, required: true },
})

// First video wins the large slot; failing that, the first item.
const lead = computed(() => props.items.find((m) => m.kind === 'video') ?? props.items[0] ?? null)
const rest = computed(() => props.items.filter((m) => m !== lead.value))
// Two tiles beside the lead, as designed. Anything beyond that is reachable
// through the lightbox, and the last visible tile says how many more there are.
const side = computed(() => rest.value.slice(0, 2))
const overflow = computed(() => Math.max(rest.value.length - 2, 0))

const lightboxOpen = ref(false)
const lightboxAt = ref(0)
const openAt = (item) => {
  lightboxAt.value = props.items.indexOf(item)
  lightboxOpen.value = true
}
</script>

<template>
  <div v-if="items.length" class="grid gap-3 sm:grid-cols-[1.9fr_1fr]">
    <!-- ── Lead tile ───────────────────────────────────────────────────── -->
    <!-- The aspect box IS the tile, and every layer inside is absolute. This
         tile alone decides the grid row's height: give the side tiles below any
         intrinsic height and they drive the row instead, stretching this one
         and leaving an empty band under a 16:9 poster. -->
    <div class="relative aspect-[16/9] overflow-hidden rounded-6 bg-surface-gray-2">
      <button
        v-if="lead"
        class="group absolute inset-0 cursor-zoom-in"
        :aria-label="
          lead.kind === 'video' ? `Play ${lead.alt}` : `Open ${lead.alt} full screen`
        "
        @click="openAt(lead)"
      >
        <img
          :src="lead.kind === 'video' ? (lead.poster ?? lead.src) : lead.src"
          :alt="lead.alt"
          class="absolute inset-0 size-full object-cover"
        />
        <!-- Decorative, inside the one button: a nested <button> here would be
             invalid HTML, and a sibling overlay would make the tile two targets
             for the same outcome. -->
        <span
          v-if="lead.kind === 'video'"
          class="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all group-hover:scale-105 group-hover:bg-black/60"
          aria-hidden="true"
        >
          <!-- Nudged right by a hair: a triangle's optical centre sits left of
               its bounding box, so a centred glyph looks off-centre. -->
          <LucidePlay class="size-6 translate-x-[2px] fill-current" />
        </span>
      </button>
    </div>

    <!-- ── Side tiles ──────────────────────────────────────────────────── -->
    <!-- From `sm` up: one column beside the lead, two rows. `min-h-0` plus
         absolute images gives these no intrinsic height, so they take the lead
         tile's height and split it with the same gap — that's what lines all
         three up top and bottom.
         Below `sm` the gallery stacks to one column, and there is no lead tile
         alongside to supply that height. So these become a 2-up row with an
         aspect ratio of their own; without it they collapsed to zero and
         disappeared entirely. -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:grid-rows-2">
      <button
        v-for="(m, i) in side"
        :key="m.id"
        class="group relative aspect-[16/10] min-h-0 cursor-zoom-in overflow-hidden rounded-6 bg-surface-gray-2 sm:aspect-auto"
        :aria-label="`Open ${m.alt} full screen`"
        @click="openAt(m)"
      >
        <img
          :src="m.kind === 'video' ? (m.poster ?? m.src) : m.src"
          :alt="m.alt"
          class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <!-- "+N more" rides the last tile rather than taking a tile of its own,
             which would cost a slot to say nothing. -->
        <span
          v-if="overflow && i === side.length - 1"
          class="absolute inset-0 grid place-items-center bg-black/45 text-p-lg font-medium text-white"
        >
          +{{ overflow }}
        </span>
      </button>
    </div>

    <MediaLightbox
      :open="lightboxOpen"
      :items="items"
      :index="lightboxAt"
      @close="lightboxOpen = false"
      @update:index="lightboxAt = $event"
    />
  </div>
</template>
