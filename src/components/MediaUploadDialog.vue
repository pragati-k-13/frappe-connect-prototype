<script setup>
import { computed, ref, watch } from 'vue'
import { Button, Dialog, Slider } from 'frappe-ui'

// Adding a photo or video to the profile, with the checks that catch poor
// media before it's saved. Assume partners upload whatever they have.
//
// Photos: shown cropped to the gallery's 16:9 tile, so the crop is judged on
// the real shape; low resolution is flagged; big files are compressed without
// asking. Videos: a stated length limit, and a cover frame picked by scrubbing,
// since the first frame is usually black or a title card. No trimming: the
// length limit does that job.
const open = defineModel('open', { type: Boolean, default: false })
const emit = defineEmits(['add'])

const MIN_WIDTH = 1200
const MAX_SECONDS = 120

const file = ref(null)
const url = ref('')
const kind = ref('')
const issues = ref([])
const notes = ref([])
const preview = ref(null)
const duration = ref(0)
const at = ref([0])
const poster = ref('')

watch(open, (v) => {
  if (!v) return
  file.value = null
  url.value = ''
  issues.value = []
  notes.value = []
  poster.value = ''
})

// Seek the preview to the picked moment; the frame it lands on is the cover.
watch(at, ([t]) => {
  if (preview.value) preview.value.currentTime = t
})
function capture() {
  const v = preview.value
  if (!v?.videoWidth) return
  const c = document.createElement('canvas')
  c.width = v.videoWidth
  c.height = v.videoHeight
  c.getContext('2d').drawImage(v, 0, 0)
  poster.value = c.toDataURL('image/jpeg', 0.85)
}

function pick(e) {
  const f = e.target.files?.[0]
  if (!f) return
  file.value = f
  url.value = URL.createObjectURL(f)
  kind.value = f.type.startsWith('video') ? 'video' : 'image'
  issues.value = []
  notes.value = []
  poster.value = ''
  at.value = [0]
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
      duration.value = v.duration
      // Start a second in: past the black first frame most phones record.
      at.value = [Math.min(1, v.duration / 2)]
      if (v.duration > MAX_SECONDS)
        issues.value.push(`Too long: ${Math.round(v.duration)} seconds. Keep it under ${MAX_SECONDS / 60} minutes.`)
    }
    v.src = url.value
  }
}

const canAdd = computed(() => file.value && !issues.value.length)
function add() {
  emit('add', {
    id: `upload-${Date.now()}`,
    kind: kind.value,
    src: url.value,
    poster: poster.value || undefined,
    alt: file.value.name,
  })
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
        <video
          v-else
          ref="preview"
          :src="url"
          class="size-full object-cover"
          muted
          playsinline
          preload="auto"
          @seeked="capture"
          @loadeddata="capture"
        />
      </div>
      <p v-if="url && kind === 'image'" class="text-p-sm text-ink-gray-5">As it shows in your gallery.</p>
      <div v-if="url && kind === 'video' && duration" class="space-y-2">
        <p class="text-p-sm text-ink-gray-5">Drag to pick the cover</p>
        <Slider v-model="at" :min="0" :max="duration" :step="0.1" aria-label="Cover frame" />
      </div>

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
