<script setup>
import { computed, ref } from 'vue'
import { Button, Dropdown, Tooltip } from 'frappe-ui'
import EmptyState from './EmptyState.vue'
import MediaUploadDialog from './MediaUploadDialog.vue'

// The profile's photos and video in edit mode: every item in a grid, edited
// where it sits, the same shape as the client logos below it. The public
// gallery shows three tiles and hides the rest behind "+N", which is the wrong
// view for managing them; Preview shows that layout.
//
// From the comp (Airbnb, Etsy, Mindtrip): the first item is the cover and says
// so; tiles drag to reorder; each tile's menu makes it the cover, moves it,
// replaces it or removes it (the menu is also the way to reorder without
// dragging). Adding is a button in the section header, as "Link certificate"
// is on Partnership: it stays put however many items there are, and the grid
// holds only media. Only adding and replacing open a dialog, for the upload
// checks.
//
// Capped at ten items, two of them videos: the gallery shows three and the
// rest live behind "+N", where past ten nobody looks. At the cap the add
// button is disabled and says why, rather than an upload failing after the
// fact.
const props = defineProps({
  // `{ id, kind, src, poster, alt }` items — see `data/media.js`.
  items: { type: Array, required: true },
})
const emit = defineEmits(['change'])

const MAX = 10
const MAX_VIDEOS = 2
const videos = computed(() => props.items.filter((m) => m.kind === 'video').length)
const full = computed(() => props.items.length >= MAX)

function move(from, to) {
  if (to < 0 || to >= props.items.length || from === to) return
  const next = [...props.items]
  next.splice(to, 0, next.splice(from, 1)[0])
  emit('change', next)
}
const remove = (i) => emit('change', props.items.filter((_, j) => j !== i))
const menu = (i) =>
  [
    i > 0 && { label: 'Make cover', icon: 'lucide-image', onClick: () => move(i, 0) },
    i > 0 && { label: 'Move earlier', icon: 'lucide-chevron-left', onClick: () => move(i, i - 1) },
    i < props.items.length - 1 && { label: 'Move later', icon: 'lucide-chevron-right', onClick: () => move(i, i + 1) },
    { label: 'Replace', icon: 'lucide-replace', onClick: () => startUpload(i) },
    { label: 'Remove', icon: 'lucide-trash-2', theme: 'red', onClick: () => remove(i) },
  ].filter(Boolean)

const dragging = ref(null)
const over = ref(null)
function drop(i) {
  const from = dragging.value
  dragging.value = null
  over.value = null
  if (from !== null) move(from, i)
}

// ── Adding and replacing ────────────────────────────────────────────────────
const uploading = ref(false)
const replacing = ref(null)
function startUpload(i = null) {
  replacing.value = i
  uploading.value = true
}
// Replacing a video with a video keeps the count, so it's always allowed.
const allowVideo = computed(() => videos.value < MAX_VIDEOS || props.items[replacing.value]?.kind === 'video')
function add(item) {
  const r = replacing.value
  emit('change', r === null ? [...props.items, item] : props.items.map((m, i) => (i === r ? item : m)))
}
const thumb = (m) => (m.kind === 'video' ? (m.poster ?? m.src) : m.src)

</script>

<template>
  <div class="mb-4 flex items-center justify-between gap-3">
    <h2 class="text-base font-semibold text-ink-gray-8">Photos and video</h2>
    <div class="flex items-center gap-3">
      <span class="whitespace-nowrap text-sm text-ink-gray-5">{{ items.length }} of {{ MAX }}</span>
      <!-- A disabled button gets no pointer events, so the tooltip sits on a
           wrapper. -->
      <Tooltip v-if="full" text="Remove one to add another">
        <span tabindex="0" class="rounded-6 focus-visible:focus-ring"><Button label="Add" icon-left="lucide-plus" disabled /></span>
      </Tooltip>
      <!-- Just "Add" on a phone, where the full label squeezes the title. -->
      <Button v-else icon-left="lucide-plus" @click="startUpload()">
        Add<span class="max-sm:sr-only">{{ videos < MAX_VIDEOS ? ' photo or video' : ' photo' }}</span>
      </Button>
    </div>
  </div>

  <EmptyState v-if="!items.length" icon="lucide-image" title="No photos or videos yet" />
  <ul v-else class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <li
      v-for="(m, i) in items"
      :key="m.id"
      class="group relative aspect-[16/10] cursor-grab overflow-hidden rounded-6 bg-surface-gray-2 active:cursor-grabbing"
      :class="over === i && dragging !== i && 'ring-2 ring-outline-gray-4'"
      draggable="true"
      @dragstart="dragging = i"
      @dragover.prevent="over = i"
      @dragleave="over === i && (over = null)"
      @drop.prevent="drop(i)"
      @dragend="dragging = null; over = null"
    >
      <img :src="thumb(m)" :alt="m.alt" class="size-full object-cover" draggable="false" />
      <span v-if="m.kind === 'video'" class="lucide-play absolute bottom-2 left-2 size-4 text-white drop-shadow" aria-label="Video" />
      <span v-if="i === 0" class="absolute left-2 top-2 rounded-4 bg-surface-base px-1.5 py-0.5 text-xs text-ink-gray-8">Cover</span>
      <!-- Positioned by a wrapper: Dropdown doesn't pass a class to its
           trigger. -->
      <div class="absolute right-1.5 top-1.5">
        <Dropdown :options="menu(i)">
          <Button class="data-[state=open]:bg-surface-gray-3" icon="lucide-ellipsis" :aria-label="`Actions for ${m.alt}`" />
        </Dropdown>
      </div>
    </li>
  </ul>

  <MediaUploadDialog v-model:open="uploading" :replacing="replacing !== null" :allow-video="allowVideo" @add="add" />
</template>
