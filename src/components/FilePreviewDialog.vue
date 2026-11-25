<script setup>
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Button, Dialog, ScrollArea } from 'frappe-ui'
import EmptyState from './EmptyState.vue'
import { DRIVE_URL, FILE_TYPES, fileMeta } from '../data/collateral'

// The in-app preview of one collateral file. Large, not a side panel: a deck
// needs the width. Previous / next step through the folder without closing.
// The parent owns which file is open (it's in the URL); this only asks.
const props = defineProps({
  file: { type: Object, default: null },
  files: { type: Array, default: () => [] },
})
const emit = defineEmits(['show', 'close'])

const open = computed({
  get: () => !!props.file,
  set: (v) => {
    if (!v) emit('close')
  },
})

const index = computed(() => props.files.findIndex((f) => f.slug === props.file?.slug))
const prev = computed(() => (index.value > 0 ? props.files[index.value - 1] : null))
const next = computed(() => (index.value >= 0 && index.value < props.files.length - 1 ? props.files[index.value + 1] : null))

// Icon-only Download on a phone, so the file name keeps the header's width.
const wide = useMediaQuery('(min-width: 640px)')

const type = computed(() => (props.file ? FILE_TYPES[props.file.type] : null))
// Decks are landscape, documents portrait.
const pageShape = computed(() => (props.file?.type === 'slides' ? 'aspect-video' : 'aspect-[1/1.414]'))

function onKey(e) {
  if (e.key === 'ArrowLeft' && prev.value) emit('show', prev.value)
  if (e.key === 'ArrowRight' && next.value) emit('show', next.value)
}
</script>

<template>
  <Dialog v-model:open="open" size="4xl" bare>
    <div v-if="file" class="flex h-[85vh] flex-col" @keydown="onKey">
      <div class="flex items-center gap-2 border-b border-outline-gray-1 px-4 py-3">
        <!-- The dialog's title keeps its own size; the subtext follows
             frappe-patterns list.md: `text-p-sm` gray-6, 4px below. -->
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <h3 class="truncate text-lg-semibold text-ink-gray-9">{{ file.name }}</h3>
          <p class="truncate text-p-sm text-ink-gray-6">{{ fileMeta(file) }} · {{ index + 1 }} of {{ files.length }}</p>
        </div>
        <Button
          variant="ghost"
          icon="lucide-chevron-left"
          tooltip="Previous file"
          :disabled="!prev"
          @click="emit('show', prev)"
        />
        <Button
          variant="ghost"
          icon="lucide-chevron-right"
          tooltip="Next file"
          :disabled="!next"
          @click="emit('show', next)"
        />
        <Button
          v-if="wide"
          label="Download"
          icon-left="lucide-download"
          :href="DRIVE_URL"
          target="_blank"
        />
        <Button v-else icon="lucide-download" tooltip="Download" :href="DRIVE_URL" target="_blank" />
        <Button variant="ghost" icon="lucide-x" tooltip="Close" @click="emit('close')" />
      </div>

      <ScrollArea class="min-h-0 flex-1 bg-surface-gray-1" viewport-class="p-6">
        <!-- Pages one under another, as Drive and Docs read a PDF. Stand-in
             pages until the files come from Drive. -->
        <div v-if="type.preview === 'pages'" class="mx-auto max-w-2xl space-y-4">
          <div
            v-for="n in file.pages"
            :key="n"
            :class="pageShape"
            class="flex items-end justify-end rounded-4 border border-outline-gray-1 bg-surface-base p-3"
          >
            <span class="text-sm text-ink-gray-4">{{ n }}</span>
          </div>
        </div>
        <div v-else-if="type.preview === 'image'" class="mx-auto flex aspect-square max-w-sm items-center justify-center rounded-4 border border-outline-gray-1 bg-surface-base">
          <span :class="[type.icon, type.tint]" class="size-4" aria-hidden="true" />
        </div>
        <EmptyState v-else :icon="type.icon" :title="`No preview for ${type.label} files`" />
      </ScrollArea>
    </div>
  </Dialog>
</template>
