<script setup>
import { ref, watch } from 'vue'
import { Avatar, Button, Dialog, FormControl } from 'frappe-ui'

// Client logos, with help for the poor files partners tend to have. A
// customer's website fetches its logo, so nobody has to hunt for one; an
// upload too small to show cleanly is flagged. On the page every logo shows at
// one height and in one tone, so a mixed set still reads as one row.
//
// Logos go to Frappe for review, since they claim a relationship. The live
// set stays on the directory until it's approved.
//
// ⚠️ Fetching is faked here: the website's name becomes the client, shown as
// initials. The real thing would pull the site's logo.
const open = defineModel('open', { type: Boolean, default: false })
const props = defineProps({ clients: { type: Array, required: true } })
const emit = defineEmits(['submit'])

const list = ref([])
const site = ref('')
const error = ref('')
const MIN_WIDTH = 200

watch(open, (v) => {
  if (!v) return
  list.value = props.clients.map((c) => ({ ...c }))
  site.value = ''
  error.value = ''
})

function fetchLogo() {
  const host = site.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host)) return (error.value = 'Enter a website, like acme.com')
  const name = host.split('.')[0].replace(/(^|-)(\w)/g, (_, s, c) => (s ? ' ' : '') + c.toUpperCase())
  list.value.push({ slug: host, name, src: null, fetched: host })
  site.value = ''
  error.value = ''
}

function upload(e) {
  const f = e.target.files?.[0]
  if (!f) return
  const src = URL.createObjectURL(f)
  const img = new Image()
  img.onload = () => {
    const name = f.name.replace(/\.[^.]+$/, '')
    list.value.push({
      slug: `upload-${Date.now()}`,
      name,
      src,
      issue: img.naturalWidth < MIN_WIDTH ? `Too small: use at least ${MIN_WIDTH} px wide` : null,
    })
  }
  img.src = src
  e.target.value = ''
}

const remove = (slug) => (list.value = list.value.filter((c) => c.slug !== slug))
function submit() {
  emit('submit', list.value.filter((c) => !c.issue))
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open" title="Client logos" size="xl">
    <div class="space-y-4">
      <div class="flex items-end gap-2">
        <FormControl
          v-model="site"
          class="flex-1"
          label="Add by website"
          placeholder="acme.com"
          :error="error"
          @keydown.enter.prevent="fetchLogo"
        />
        <Button label="Fetch logo" @click="fetchLogo" />
      </div>
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-gray-7 hover:text-ink-gray-8">
        <span class="lucide-upload size-4 text-ink-gray-5" aria-hidden="true" />
        Or upload a file
        <input type="file" accept="image/*" class="sr-only" @change="upload" />
      </label>

      <ul class="divide-y divide-outline-gray-1">
        <li v-for="c in list" :key="c.slug" class="flex items-center gap-3 py-2">
          <span class="grid h-8 w-20 shrink-0 place-items-center">
            <img v-if="c.src" :src="c.src" :alt="c.name" class="max-h-6 max-w-full object-contain opacity-70 grayscale" />
            <Avatar v-else :label="c.name" size="sm" shape="square" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-base text-ink-gray-8">{{ c.name }}</span>
            <span v-if="c.issue" class="mt-0.5 block text-sm text-ink-red-7">{{ c.issue }}</span>
            <span v-else-if="c.fetched" class="mt-0.5 block text-sm text-ink-gray-5">From {{ c.fetched }}</span>
          </span>
          <Button variant="ghost" icon="lucide-x" :aria-label="`Remove ${c.name}`" @click="remove(c.slug)" />
        </li>
      </ul>

      <div class="flex justify-end gap-2 pt-2">
        <Button label="Cancel" @click="open = false" />
        <Button variant="solid" label="Submit for review" @click="submit" />
      </div>
    </div>
  </Dialog>
</template>
