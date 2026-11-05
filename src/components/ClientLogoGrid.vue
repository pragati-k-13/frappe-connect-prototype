<script setup>
import { ref } from 'vue'
import { Avatar, Badge, Button, Dropdown, Popover, TextInput, Tooltip } from 'frappe-ui'
import EmptyState from './EmptyState.vue'

// The partner's client logos in edit mode: every logo in a grid, edited where
// it sits. The public strip rotates five at a time, which is the wrong view for
// editing: a logo you want to remove may have rotated out. So edit mode shows
// them all, still, in the strip's order.
//
// From the comp (Fiverr, Polywork, Upwork, Frappe CRM): add by the client's
// website first, upload only as the fallback, from a button in the section
// header (it stays put however many logos there are); remove and reorder in place
// (drag, or the ⋯ menu that media tiles have too);
// review status on each new logo, where it sits. A new logo claims a client
// relationship, so it's Pending until Frappe approves it and doesn't show on
// the profile meanwhile. Removing and reordering claim nothing, so they apply
// at once.
//
// ⚠️ Fetching is faked: the website's name becomes the client, shown as
// initials. The real thing pulls the site's logo, as Frappe CRM's "Enrich"
// does.
const props = defineProps({
  // `{ slug, name, src, pending }`, in the profile's order.
  logos: { type: Array, required: true },
})
const emit = defineEmits(['change'])

const MIN_WIDTH = 200
// Twenty: the strip shows five at a time, so that's four full turns. Past it a
// logo rarely reaches anyone. New ones count, pending or not.
const MAX = 20

// ── Adding ──────────────────────────────────────────────────────────────────
const site = ref('')
const error = ref('')
function fetchLogo(close) {
  const host = site.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host)) return (error.value = 'Enter a website, like acme.com')
  if (props.logos.some((l) => l.slug === host)) return (error.value = 'Already in your logos')
  const name = host.split('.')[0].replace(/(^|-)(\w)/g, (_, s, c) => (s ? ' ' : '') + c.toUpperCase())
  emit('change', [...props.logos, { slug: host, name, src: null, pending: true }], 'added')
  site.value = ''
  error.value = ''
  close()
}
function upload(e, close) {
  const f = e.target.files?.[0]
  if (!f) return
  const src = URL.createObjectURL(f)
  const img = new Image()
  img.onload = () => {
    if (img.naturalWidth < MIN_WIDTH) return (error.value = `Too small: use at least ${MIN_WIDTH} px wide`)
    emit('change', [...props.logos, { slug: `upload-${Date.now()}`, name: f.name.replace(/\.[^.]+$/, ''), src, pending: true }], 'added')
    error.value = ''
    close()
  }
  img.src = src
  e.target.value = ''
}

// ── Removing and reordering ─────────────────────────────────────────────────
// The same ⋯ menu as a media tile, which is also how to reorder where
// dragging doesn't work (touch screens). Removing the last approved logo is
// allowed: the strip just goes away.
const remove = (slug) => emit('change', props.logos.filter((l) => l.slug !== slug), 'removed')
function move(from, to) {
  if (to < 0 || to >= props.logos.length || from === to) return
  const next = [...props.logos]
  next.splice(to, 0, next.splice(from, 1)[0])
  emit('change', next, 'moved')
}
const menu = (i, l) =>
  [
    i > 0 && { label: 'Move earlier', icon: 'lucide-chevron-left', onClick: () => move(i, i - 1) },
    i < props.logos.length - 1 && { label: 'Move later', icon: 'lucide-chevron-right', onClick: () => move(i, i + 1) },
    { label: 'Remove', icon: 'lucide-trash-2', theme: 'red', onClick: () => remove(l.slug) },
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
    <h2 class="text-base font-semibold text-ink-gray-8">Client logos</h2>
    <div class="flex items-center gap-3">
      <span class="whitespace-nowrap text-sm text-ink-gray-5">{{ logos.length }} of {{ MAX }}</span>
      <!-- A disabled button gets no pointer events, so the tooltip sits on a
           wrapper. -->
      <Tooltip v-if="logos.length >= MAX" text="Remove one to add another">
        <span tabindex="0" class="rounded-6 focus-visible:focus-ring"><Button label="Add client" icon-left="lucide-plus" disabled /></span>
      </Tooltip>
      <Popover v-else side="bottom" align="end">
        <template #trigger>
          <Button class="data-[state=open]:bg-surface-gray-3" label="Add client" icon-left="lucide-plus" @click="error = ''" />
        </template>
        <template #default="{ close }">
          <div class="w-72 space-y-3 p-3">
            <TextInput
              v-model="site"
              placeholder="Client’s website, like acme.com"
              aria-label="Client’s website"
              @keydown.enter.prevent="fetchLogo(close)"
            />
            <p v-if="error" class="text-p-sm text-ink-red-7">{{ error }}</p>
            <div class="flex items-center justify-between gap-2">
              <label class="cursor-pointer text-sm text-ink-gray-6 underline underline-offset-2 hover:text-ink-gray-8">
                Upload instead
                <input type="file" accept="image/*" class="sr-only" @change="upload($event, close)" />
              </label>
              <Button variant="solid" label="Add" @click="fetchLogo(close)" />
            </div>
          </div>
        </template>
      </Popover>
    </div>
  </div>

  <EmptyState v-if="!logos.length" icon="lucide-building-2" title="No client logos yet" />
  <ul v-else class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <li
      v-for="(l, i) in logos"
      :key="l.slug"
      class="group relative flex h-16 cursor-grab flex-col items-center justify-center gap-1 rounded-6 border border-outline-gray-2 px-3 active:cursor-grabbing"
      :class="over === i && dragging !== i && 'ring-2 ring-outline-gray-4'"
      draggable="true"
      @dragstart="dragging = i"
      @dragover.prevent="over = i"
      @dragleave="over === i && (over = null)"
      @drop.prevent="drop(i)"
      @dragend="dragging = null; over = null"
    >
      <!-- One height and one tone, as the strip shows them. -->
      <img v-if="l.src" :src="l.src" :alt="l.name" class="max-h-7 max-w-full object-contain opacity-70 grayscale" draggable="false" />
      <span v-else class="flex min-w-0 items-center gap-2">
        <Avatar :label="l.name" size="sm" shape="square" />
        <span class="truncate text-sm text-ink-gray-7">{{ l.name }}</span>
      </span>
      <!-- Under the logo, in flow, so the tile stays centered. -->
      <Badge v-if="l.pending" theme="amber" variant="subtle" size="sm" label="Pending" />
      <!-- Positioned by a wrapper: Dropdown doesn't pass a class to its
           trigger. -->
      <div class="absolute right-1.5 top-1.5">
        <Dropdown :options="menu(i)">
          <Button class="data-[state=open]:bg-surface-gray-3" icon="lucide-ellipsis" :aria-label="`Actions for ${l.name}`" />
        </Dropdown>
      </div>
    </li>
  </ul>
</template>
