<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import FilePreviewDialog from '../components/FilePreviewDialog.vue'
import { FILE_TYPES, fileMeta, folderBySlug } from '../data/collateral'

// SCREEN — one collateral folder: its files as a grid, each opening an in-app
// preview. The open file lives in the URL (`?file=`), so Back closes the
// preview and a link to one file can be shared.
const route = useRoute()
const router = useRouter()

const folder = computed(() => folderBySlug(route.params.folder))
const files = computed(() => folder.value?.files ?? [])

const openFile = computed(() => files.value.find((f) => f.slug === route.query.file) ?? null)

// Opening pushes, so Back closes it. Moving between files inside the preview
// replaces, so Back doesn't step through every file seen.
function open(file) {
  router.push({ query: { file: file.slug } })
}
function show(file) {
  router.replace({ query: { file: file.slug } })
}
function close() {
  router.replace({ query: {} })
}
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
          <button
            type="button"
            class="group block h-full w-full overflow-hidden rounded-5 border border-outline-gray-1 text-left transition-colors hover:bg-surface-gray-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
            @click="open(f)"
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
          </button>
        </li>
      </ul>
    </div>
    <FilePreviewDialog
      v-if="folder"
      :file="openFile"
      :files="files"
      @show="show"
      @close="close"
    />
  </ConnectShell>
</template>
