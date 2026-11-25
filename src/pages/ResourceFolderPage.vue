<script>
// Where each folder was scrolled to, kept for the app's life so coming back
// from the file viewer lands where the partner left off. Module scope, like
// ConnectShell's `collapsed`: the page unmounts while the viewer is open.
const scrollTops = new Map()
</script>

<script setup>
import { computed, nextTick, onMounted } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { Button } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import { FILE_TYPES, fileMeta, folderBySlug } from '../data/collateral'

// SCREEN — one collateral folder: its files as a grid. Each card opens the
// full-screen file viewer at its own address.
const route = useRoute()

const folder = computed(() => folderBySlug(route.params.folder))
const files = computed(() => folder.value?.files ?? [])

// The shell's content scroll region (frappe-ui ScrollArea's viewport).
const scroller = () => document.querySelector('.fc-content [data-reka-scroll-area-viewport]')

onBeforeRouteLeave(() => {
  const el = scroller()
  if (el && folder.value) scrollTops.set(folder.value.slug, el.scrollTop)
})
onMounted(async () => {
  const top = folder.value && scrollTops.get(folder.value.slug)
  if (!top) return
  await nextTick()
  const el = scroller()
  if (el) el.scrollTop = top
})
</script>

<template>
  <ConnectShell root-label="Resources" root-to="/connect/resources" :crumb="folder?.name ?? 'Not found'">
    <div class="fc-page-list pb-10 pt-8">
      <EmptyState v-if="!folder" icon="lucide-folder-x" title="This folder doesn't exist">
        <Button label="Back to Resources" route="/connect/resources" />
      </EmptyState>
      <EmptyState v-else-if="!files.length" icon="lucide-folder" title="No files in this folder yet" />
      <ul v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <li v-for="f in files" :key="f.slug">
          <RouterLink
            :to="{ name: 'resource-file', params: { folder: folder.slug, file: f.slug } }"
            class="group block h-full w-full overflow-hidden rounded-5 border border-outline-gray-1 transition-colors hover:bg-surface-gray-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
          >
            <!-- Stand-in thumbnail: the type's Drive icon on a page-shaped surface,
                 until Drive's thumbnails are wired in. -->
            <span class="flex aspect-video items-center justify-center bg-surface-gray-2">
              <span :class="[FILE_TYPES[f.type].icon, FILE_TYPES[f.type].tint]" class="size-4" aria-hidden="true" />
            </span>
            <!-- Title and subtext per frappe-patterns list.md, as on the
                 folder cards. -->
            <span class="flex flex-col gap-1 px-3 py-2.5">
              <span class="text-base font-medium text-ink-gray-8">{{ f.name }}</span>
              <span class="text-p-sm text-ink-gray-6">{{ fileMeta(f) }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </ConnectShell>
</template>
