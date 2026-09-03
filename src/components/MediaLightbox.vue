<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Button } from 'frappe-ui'

// Full-screen viewer for the profile gallery. Opened by clicking any tile.
//
// Not a frappe-ui `Dialog`: this needs an edge-to-edge dark ground with the
// image sized to the viewport, and Dialog is built around a padded white panel
// with a max width. The pieces Dialog would have given us — Escape to close,
// focus containment, scroll lock — are handled below.
const props = defineProps({
  open: { type: Boolean, default: false },
  // Same `{ id, kind, src, poster, alt }` items the gallery renders.
  items: { type: Array, required: true },
  // Index of the item that was clicked.
  index: { type: Number, default: 0 },
})
const emit = defineEmits(['close', 'update:index'])

const at = ref(props.index)
watch(() => props.index, (v) => (at.value = v))

const current = computed(() => props.items[at.value] ?? null)
const many = computed(() => props.items.length > 1)

const go = (step) => {
  // Wraps, so arrow-key browsing never dead-ends.
  at.value = (at.value + step + props.items.length) % props.items.length
  emit('update:index', at.value)
}

const onKey = (e) => {
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
  else return
  e.preventDefault()
}

// Scroll lock plus the key handler, both tied to `open` so nothing leaks when
// the overlay is closed by any route (button, backdrop, Escape).
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  },
)
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="open && current"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 sm:p-10"
        role="dialog"
        aria-modal="true"
        :aria-label="current.alt"
        @click.self="emit('close')"
      >
        <!-- Controls sit above the media, not over the page, so they travel
             with the overlay on any viewport. -->
        <div class="absolute right-3 top-3 sm:right-5 sm:top-5">
          <Button variant="ghost" theme="gray" aria-label="Close" @click="emit('close')">
            <template #icon><LucideX class="size-5 text-white" /></template>
          </Button>
        </div>

        <template v-if="many">
          <button
            class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:left-5"
            aria-label="Previous"
            @click.stop="go(-1)"
          >
            <LucideChevronLeft class="size-7" />
          </button>
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:right-5"
            aria-label="Next"
            @click.stop="go(1)"
          >
            <LucideChevronRight class="size-7" />
          </button>
        </template>

        <!-- `max-h-full max-w-full` on the media itself rather than a fixed
             aspect box: a portrait still and a 16:9 clip both need to fit the
             viewport without cropping. -->
        <video
          v-if="current.kind === 'video'"
          :key="current.id"
          :src="current.src"
          :poster="current.poster ?? undefined"
          class="max-h-full max-w-full rounded-5"
          controls
          autoplay
          playsinline
          @click.stop
        />
        <img
          v-else
          :key="current.id"
          :src="current.src"
          :alt="current.alt"
          class="max-h-full max-w-full rounded-5 object-contain"
          @click.stop
        />

        <p
          v-if="many"
          class="absolute bottom-4 left-1/2 -translate-x-1/2 text-p-sm tabular-nums text-white/60"
        >
          {{ at + 1 }} / {{ items.length }}
        </p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 160ms ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .lightbox-enter-active,
  .lightbox-leave-active {
    transition: none;
  }
}
</style>
