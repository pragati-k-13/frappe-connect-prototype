<script setup>
import { computed } from 'vue'
import { Badge, Button, Dropdown } from 'frappe-ui'
import { List, ListCell, ListRow, ListRows } from 'frappe-ui/list'
import { storiesFor } from '../data/stories'

// SCREEN 6 — "Success stories", as a list. No covers: partners used stock or
// generated thumbnails, which made the section look worse than the work. Each
// row leads with the client's logo in a fixed tile (initials when there's
// none), then the title and the industry. Stories live on frappe.io, so every row opens
// there.
//
// The stories are real, from each partner's frappe.io page; see
// `data/stories.js`.
const props = defineProps({
  partner: { type: Object, required: true },
  // The partner's own page in edit mode: each row's menu features or moves
  // that story.
  editable: { type: Boolean, default: false },
})
const emit = defineEmits(['change'])

// In the partner's order once they've set one (`storyOrder`, story ids),
// otherwise frappe.io's. The first leads, its headline large; the rest
// follow as rows. Featuring a story is moving it to the top.
const stories = computed(() => {
  const all = storiesFor(props.partner)
  const order = props.partner.storyOrder ?? []
  const rank = (s) => (order.includes(s.id) ? order.indexOf(s.id) : order.length + all.indexOf(s))
  return [...all].sort((a, b) => rank(a) - rank(b))
})
const featured = computed(() => stories.value[0] ?? null)
const rest = computed(() => stories.value.slice(1))
function move(from, to) {
  const ids = stories.value.map((s) => s.id)
  const [id] = ids.splice(from, 1)
  ids.splice(to, 0, id)
  emit('change', { storyOrder: ids })
}
// The same menu on every story, the lead included. `i` is its place among
// all stories (the lead is 0), so "Move up" on the first row would make it
// the lead: that's "Feature this story" instead.
const rowMenu = (item) => {
  const i = stories.value.indexOf(item)
  return [
    i > 0 && { label: 'Feature this story', icon: 'lucide-star', onClick: () => move(i, 0) },
    i > 1 && { label: 'Move up', icon: 'lucide-chevron-up', onClick: () => move(i, i - 1) },
    i < stories.value.length - 1 && { label: 'Move down', icon: 'lucide-chevron-down', onClick: () => move(i, i + 1) },
    // The lead has "Read the story" as a button already.
    i > 0 && { label: 'Read story', icon: 'lucide-external-link', onClick: () => open(item.href) },
  ].filter(Boolean)
}
const initials = (name) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
const open = (href) => window.open(href, '_blank', 'noopener')
</script>

<template>
  <section>
    <!-- No "Submit a story" here when editing: the client logos section
         near the top carries it, and one is enough. -->
    <h2 class="flex items-center gap-2 text-base font-semibold text-ink-gray-8">
      Success stories
      <Badge v-if="stories.length" :label="String(stories.length)" />
    </h2>

    <!-- ── The featured story ───────────────────────────────────────── -->
    <!-- The headline is the hero: the result, large, so it registers without
         a click. The client's logo small above it names them; a description
         from the story's opening says who they are. No panel, no fill: size
         and space set it apart from the rows. One subtle button, since the
         story lives on frappe.io. -->
    <article v-if="featured" class="mt-6">
      <!-- Editing: the lead gets the same menu as the rows, at its top right. -->
      <div class="flex items-start justify-between gap-3">
        <!-- Scaled down only, never up, so a small logo never blurs. -->
        <img
          v-if="featured.client.src"
          :src="featured.client.src"
          :alt="featured.client.name"
          class="h-7 max-w-36 object-contain object-left"
        />
        <p v-else class="text-base font-medium text-ink-gray-7">{{ featured.client.name }}</p>
        <Dropdown v-if="editable && stories.length > 1" :options="rowMenu(featured)">
          <Button variant="ghost" class="data-[state=open]:bg-surface-gray-3" icon="lucide-ellipsis" :aria-label="`Actions for ${featured.client.name} story`" />
        </Dropdown>
      </div>
      <h3 class="mt-3 max-w-prose text-xl font-semibold text-ink-gray-9">{{ featured.title }}</h3>
      <p v-if="featured.description" class="mt-1 max-w-prose text-p-base text-ink-gray-6">{{ featured.description }}</p>
      <Button class="mt-3" label="Read the story" @click="open(featured.href)" />
    </article>

    <!-- Pulled out by the rows' 20px padding, so each row's logo lines up
         with the featured logo and the hover fill bleeds past the column, as
         frappe lists do. -->
    <div v-if="rest.length" class="-mx-5 mt-9">
      <!-- Every logo fitted to the same 56×40 box (wide enough for a
           wordmark), in full color, no outline, scaled down only so it never
           blurs. The files are the originals from frappe.io, uncropped. A firm
           with no usable logo
           gets its initials in the same box. -->
      <List :columns="editable ? ['3.5rem', 'minmax(0,1fr)', 'auto'] : ['3.5rem', 'minmax(0,1fr)']" :row-height="72" class="list-gap-3 list-row-px-5">
        <ListRows :items="rest" v-slot="{ item }">
          <!-- Not clickable while editing: a click in an editor shouldn't leave
               the page, and the ⋯ sits in the row. "Read story" is in its
               menu instead. -->
          <ListRow :on-click="editable ? undefined : () => open(item.href)">
            <ListCell>
              <span class="grid h-10 w-14 place-items-center overflow-hidden rounded-4">
                <img v-if="item.client.src" :src="item.client.src" :alt="item.client.name" class="max-h-full max-w-full object-contain" />
                <span v-else class="grid size-10 place-items-center rounded-4 bg-surface-gray-2 text-sm font-medium text-ink-gray-6" :aria-label="item.client.name">{{ initials(item.client.name) }}</span>
              </span>
            </ListCell>
            <ListCell>
              <div class="flex min-w-0 flex-col gap-1">
                <p class="truncate text-base font-medium text-ink-gray-8">{{ item.title }}</p>
                <p v-if="item.segment" class="text-p-base text-ink-gray-6">{{ item.segment }}</p>
              </div>
            </ListCell>
            <!-- Editing: feature or move this story, like "Make cover" on
                 media. -->
            <ListCell v-if="editable">
              <div>
                <Dropdown :options="rowMenu(item)">
                  <Button variant="ghost" class="data-[state=open]:bg-surface-gray-3" icon="lucide-ellipsis" :aria-label="`Actions for ${item.client.name} story`" />
                </Dropdown>
              </div>
            </ListCell>
          </ListRow>
        </ListRows>
      </List>
    </div>
    <p v-if="!stories.length" class="mt-4 text-p-base text-ink-gray-6">No success stories published yet.</p>
  </section>
</template>
