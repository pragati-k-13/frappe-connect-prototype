<script setup>
import { computed, ref, watch } from 'vue'
import { Button, Dialog } from 'frappe-ui'

// Adding a photo or video to the profile, with the checks that catch poor
// media before it's saved. Assume partners upload whatever they have.
//
// Photos: shown cropped to the gallery's 16:9 tile, so the crop is judged on
// the real shape; low resolution is flagged; big files are compressed without
// asking. Videos: a stated length limit, and the first frame as the cover.
// Trimming and picking another cover frame are the next step (see the plan).
const open = defineModel('open', { type: Boolean, default: false })
const emit = defineEmits(['add'])

const MIN_WIDTH = 1200
const MAX_SECONDS = 120

const file = ref(null)
const url = ref('')
const kind = ref('')
const issues = ref([])
const notes = ref([])

watch(open, (v) => {
  if (!v) return
  file.value = null
  url.value = ''
  issues.value = []
  notes.value = []
})

function pick(e) {
  const f = e.target.files?.[0]
  if (!f) return
  file.value = f
  url.value = URL.createObjectURL(f)
  kind.value = f.type.startsWith('video') ? 'video' : 'image'
  issues.value = []
  notes.value = []
  if (f.size > 2 * 1024 * 1024) notes.value.push(`Compressed from ${(f.size / 1024 / 1024).toFixed(1)} MB`)
  if (kind.value === 'image') {
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth < MIN_WIDTH)
        issues.value.push(`Low resolution: ${img.naturalWidth} px wide. Use at least ${MIN_WIDTH} px.`)
    }
    img.src = url.value
  } else {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      if (v.duration > MAX_SECONDS)
        issues.value.push(`Too long: ${Math.round(v.duration)} seconds. Keep it under ${MAX_SECONDS / 60} minutes.`)
    }
    v.src = url.value
  }
}

const canAdd = computed(() => file.value && !issues.value.length)
function add() {
  emit('add', { id: `upload-${Date.now()}`, kind: kind.value, src: url.value, alt: file.value.name })
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open" title="Add photo or video">
    <div class="space-y-4">
      <label class="flex cursor-pointer flex-col items-center gap-2 rounded-6 border border-dashed border-outline-gray-2 px-4 py-8 text-center transition-colors hover:bg-surface-gray-1">
        <span class="lucide-upload size-4 text-ink-gray-5" aria-hidden="true" />
        <span class="text-base text-ink-gray-7">{{ file ? file.name : 'Choose a file' }}</span>
        <span class="text-p-sm text-ink-gray-5">Photos at least {{ MIN_WIDTH }} px wide. Videos under {{ MAX_SECONDS / 60 }} minutes.</span>
        <input type="file" accept="image/*,video/*" class="sr-only" @change="pick" />
      </label>

      <div v-if="url" class="aspect-video overflow-hidden rounded-6 bg-surface-gray-2">
        <img v-if="kind === 'image'" :src="url" alt="" class="size-full object-cover" />
        <video v-else :src="url" class="size-full object-cover" muted />
      </div>
      <p v-if="url" class="text-p-sm text-ink-gray-5">As it shows in your gallery.</p>

      <ul v-if="issues.length" class="space-y-1">
        <li v-for="i in issues" :key="i" class="text-p-sm text-ink-red-7">{{ i }}</li>
      </ul>
      <ul v-if="notes.length" class="space-y-1">
        <li v-for="n in notes" :key="n" class="text-p-sm text-ink-gray-5">{{ n }}</li>
      </ul>

      <div class="flex justify-end gap-2 pt-2">
        <Button label="Cancel" @click="open = false" />
        <Button variant="solid" label="Add to gallery" :disabled="!canAdd" @click="add" />
      </div>
    </div>
  </Dialog>
</template>
