<script setup>
import { computed } from 'vue'
import { Badge, Button } from 'frappe-ui'
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
})

const stories = computed(() => storiesFor(props.partner))
// The first story the partner lists leads, its headline large; the rest
// follow as rows.
const featured = computed(() => stories.value[0] ?? null)
const rest = computed(() => stories.value.slice(1))
const initials = (name) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
const open = (href) => window.open(href, '_blank', 'noopener')
</script>

<template>
  <section>
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
      <!-- Scaled down only, never up, so a small logo never blurs. -->
      <img
        v-if="featured.client.src"
        :src="featured.client.src"
        :alt="featured.client.name"
        class="h-7 max-w-36 object-contain object-left"
      />
      <p v-else class="text-base font-medium text-ink-gray-7">{{ featured.client.name }}</p>
      <h3 class="mt-3 max-w-prose text-2xl font-semibold text-ink-gray-9">{{ featured.title }}</h3>
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
      <List :columns="['3.5rem', 'minmax(0,1fr)']" :row-height="72" class="list-gap-3 list-row-px-5">
        <ListRows :items="rest" v-slot="{ item }">
          <ListRow :on-click="() => open(item.href)">
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
          </ListRow>
        </ListRows>
      </List>
    </div>
    <p v-if="!stories.length" class="mt-4 text-p-base text-ink-gray-6">No success stories published yet.</p>
  </section>
</template>
