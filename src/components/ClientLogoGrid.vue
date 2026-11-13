<script setup>
import { computed, ref } from 'vue'
import { Badge, Button, Dropdown } from 'frappe-ui'
import EmptyState from './EmptyState.vue'
import { tileMotion } from '../lib/gridMotion'
import { MIN_LOGOS, shownLogos } from '../data/media'

// The partner's client logos in edit mode: every logo in a grid, edited where
// it sits. The public strip rotates five at a time, which is the wrong view for
// editing: a logo you want to hide may have rotated out. So edit mode shows
// them all, still, in the strip's order.
//
// Logos come from the partner's success stories, never an upload: the title
// says so, the header's one action is submitting a story, and each logo's menu
// opens the story it came from. The partner reorders (drag, or the ⋯ menu,
// which also works on touch screens) and hides a logo they'd rather not lead
// with. Hiding keeps the story; the logo stays here, dimmed, so it can be shown
// again. Every change is part of the page's draft and goes live with Publish.
const props = defineProps({
  // `{ slug, name, src, href, hidden? }`, in the profile's order.
  logos: { type: Array, required: true },
})
const emit = defineEmits(['change'])

const SUBMIT_URL = 'https://frappe.io/partners'
// Below `MIN_LOGOS` shown, the profile has no strip; the title's badge says
// so, and "Submit a story" beside it is the way to more.
const short = computed(() => props.logos.length > 0 && shownLogos(props.logos).length < MIN_LOGOS)

const setHidden = (slug, hidden) => emit('change', props.logos.map((l) => (l.slug === slug ? { ...l, hidden } : l)))
function move(from, to) {
  if (to < 0 || to >= props.logos.length || from === to) return
  const next = [...props.logos]
  next.splice(to, 0, next.splice(from, 1)[0])
  emit('change', next)
}
const menu = (i, l) =>
  [
    l.href && { label: 'View story', icon: 'lucide-external-link', onClick: () => window.open(l.href, '_blank', 'noopener') },
    i > 0 && { label: 'Move earlier', icon: 'lucide-chevron-left', onClick: () => move(i, i - 1) },
    i < props.logos.length - 1 && { label: 'Move later', icon: 'lucide-chevron-right', onClick: () => move(i, i + 1) },
    l.hidden
      ? { label: 'Show', icon: 'lucide-eye', onClick: () => setHidden(l.slug, false) }
      : { label: 'Hide', icon: 'lucide-eye-off', onClick: () => setHidden(l.slug, true) },
  ].filter(Boolean)
const dragging = ref(null)
const over = ref(null)
function drop(i) {
  const from = dragging.value
  dragging.value = null
  over.value = null
  if (from !== null) move(from, i)
}
</script>

<template>
  <div class="mb-4 flex items-center justify-between gap-3">
    <h2 class="flex items-center gap-2 text-base font-semibold text-ink-gray-8">
      Clients from your success stories
      <Badge v-if="short" theme="amber" variant="subtle" :label="`Shows from ${MIN_LOGOS}`" />
    </h2>
    <!-- Just the verb on a phone, so the title keeps its line. -->
    <Button icon-right="lucide-external-link" :href="SUBMIT_URL">Submit<span class="max-sm:sr-only"> a story</span></Button>
  </div>

  <EmptyState v-if="!logos.length" icon="lucide-building-2" title="No client logos yet" />
  <!-- Tiles slide when reordered and fade when shown or hidden
       (`lib/gridMotion.js`). -->
  <TransitionGroup v-else v-bind="tileMotion" class="relative grid grid-cols-2 gap-3 sm:grid-cols-4">
    <li
      v-for="(l, i) in logos"
      :key="l.slug"
      class="group relative flex h-16 cursor-grab flex-col items-center justify-center gap-1 rounded-6 bg-surface-gray-2 px-3 active:cursor-grabbing"
      :class="over === i && dragging !== i && 'ring-2 ring-outline-gray-4'"
      draggable="true"
      @dragstart="dragging = i"
      @dragover.prevent="over = i"
      @dragleave="over === i && (over = null)"
      @drop.prevent="drop(i)"
      @dragend="dragging = null; over = null"
    >
      <!-- One height and one tone, as the strip shows them. `mix-blend-multiply`
           drops a JPG's white background into the fill. -->
      <img
        :src="l.src"
        :alt="l.name"
        class="max-h-7 min-h-0 max-w-full object-contain mix-blend-multiply grayscale transition-opacity"
        :class="l.hidden ? 'opacity-25' : 'opacity-70'"
        draggable="false"
      />
      <!-- Under the logo, in flow, so it never covers a wide mark. -->
      <Badge v-if="l.hidden" variant="outline" label="Hidden" />
      <!-- Positioned by a wrapper: Dropdown doesn't pass a class to its
           trigger. -->
      <div class="absolute right-1.5 top-1.5">
        <Dropdown :options="menu(i, l)">
          <Button class="data-[state=open]:bg-surface-gray-3" icon="lucide-ellipsis" :aria-label="`Actions for ${l.name}`" />
        </Dropdown>
      </div>
    </li>
  </TransitionGroup>
</template>
