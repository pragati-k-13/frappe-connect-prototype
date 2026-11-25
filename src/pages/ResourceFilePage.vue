<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { Button, ScrollArea } from 'frappe-ui'
import EmptyState from '../components/EmptyState.vue'
import { DRIVE_URL, FILE_TYPES, fileMeta, folderBySlug } from '../data/collateral'

// SCREEN — one collateral file, full screen, the way Drive opens a file: no
// sidebar, a slim top bar, the pages as wide as reading allows. Outside the
// app shell on purpose; the top bar's "← <folder>" is the way back, and Esc
// and browser Back do the same.
const route = useRoute()
const router = useRouter()

const folder = computed(() => folderBySlug(route.params.folder))
const files = computed(() => folder.value?.files ?? [])
const index = computed(() => files.value.findIndex((f) => f.slug === route.params.file))
const file = computed(() => files.value[index.value] ?? null)
const prev = computed(() => (index.value > 0 ? files.value[index.value - 1] : null))
const next = computed(() => (index.value >= 0 ? files.value[index.value + 1] ?? null : null))
const type = computed(() => (file.value ? FILE_TYPES[file.value.type] : null))
// Decks are landscape, documents portrait.
const pageShape = computed(() => (file.value?.type === 'slides' ? 'aspect-video' : 'aspect-[1/1.414]'))

const wide = useMediaQuery('(min-width: 640px)')

const folderRoute = computed(() =>
  folder.value ? { name: 'resource-folder', params: { folder: folder.value.slug } } : '/connect/resources',
)

// Back to the folder. When the folder is the page we came from, step back in
// history so browser Back doesn't reopen the viewer; from a shared link,
// there's nothing to step back to, so go to the folder.
function leave() {
  const back = router.options.history.state.back
  if (back && back === router.resolve(folderRoute.value).fullPath) router.back()
  else router.push(folderRoute.value)
}

// Prev / next swap the file in place, so Back still returns to the folder in
// one step rather than through every file seen.
function show(f) {
  if (f) router.replace({ name: 'resource-file', params: { folder: folder.value.slug, file: f.slug } })
}

function onKey(e) {
  if (e.defaultPrevented || e.target.closest?.('input, textarea, [contenteditable]')) return
  if (e.key === 'Escape') leave()
  else if (e.key === 'ArrowLeft') show(prev.value)
  else if (e.key === 'ArrowRight') show(next.value)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="flex h-screen flex-col bg-surface-base text-base text-ink-gray-8">
    <header class="flex min-h-12 shrink-0 items-center gap-3 border-b border-outline-gray-1 px-3 sm:px-5">
      <!-- Named for where it goes: with no sidebar, this is the partner's
           answer to "where am I, and how do I get back". -->
      <a
        :href="router.resolve(folderRoute).href"
        class="-ml-2 flex h-7 shrink-0 items-center gap-1.5 rounded-4 px-2 text-ink-gray-6 transition-colors hover:bg-surface-gray-2 hover:text-ink-gray-8"
        @click.prevent="leave"
      >
        <span class="lucide-arrow-left size-4" aria-hidden="true" />
        <span>{{ folder?.name ?? 'Resources' }}</span>
      </a>
      <template v-if="file">
        <span class="h-4 w-px shrink-0 bg-outline-gray-2" aria-hidden="true" />
        <div class="flex min-w-0 flex-1 items-baseline gap-2">
          <h1 class="truncate text-base font-medium text-ink-gray-9">{{ file.name }}</h1>
          <span class="hidden shrink-0 text-p-sm text-ink-gray-6 sm:inline">{{ fileMeta(file) }}</span>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <span class="mr-1 hidden text-p-sm text-ink-gray-6 sm:inline">File {{ index + 1 }} of {{ files.length }}</span>
          <Button variant="ghost" icon="lucide-chevron-left" tooltip="Previous file" :disabled="!prev" @click="show(prev)" />
          <Button variant="ghost" icon="lucide-chevron-right" tooltip="Next file" :disabled="!next" @click="show(next)" />
          <!-- One button: labeled from `sm`, icon-only on a phone. -->
          <Button
            class="ml-1"
            :label="wide ? 'Download' : undefined"
            :icon-left="wide ? 'lucide-download' : undefined"
            :icon="wide ? undefined : 'lucide-download'"
            :tooltip="wide ? undefined : 'Download'"
            :href="DRIVE_URL"
            target="_blank"
          />
        </div>
      </template>
    </header>

    <ScrollArea class="min-h-0 flex-1 bg-surface-gray-1" viewport-class="px-3 py-6 sm:px-5 pb-10">
      <EmptyState v-if="!file" icon="lucide-file-x" :title="folder ? 'This file doesn\'t exist' : 'This folder doesn\'t exist'">
        <Button :label="folder ? `Back to ${folder.name}` : 'Back to Resources'" @click="leave" />
      </EmptyState>
      <!-- Pages one under another, as Drive reads a PDF. Stand-in pages until
           the files come from Drive. -->
      <div v-else-if="type.preview === 'pages'" class="mx-auto max-w-5xl space-y-4">
        <div
          v-for="n in file.pages"
          :key="n"
          :class="pageShape"
          class="flex items-end justify-end rounded-4 border border-outline-gray-1 bg-surface-base p-3"
        >
          <span class="text-sm text-ink-gray-4">{{ n }}</span>
        </div>
      </div>
      <div
        v-else-if="type.preview === 'image'"
        class="mx-auto flex aspect-square max-w-xl items-center justify-center rounded-4 border border-outline-gray-1 bg-surface-base"
      >
        <span :class="[type.icon, type.tint]" class="size-4" aria-hidden="true" />
      </div>
      <EmptyState v-else :icon="type.icon" :title="`No preview for ${type.label} files`" description="Download to open it." />
    </ScrollArea>
  </div>
</template>
