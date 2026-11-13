<script setup>
import { computed } from 'vue'
import { List, ListCell, ListRow, ListRows } from 'frappe-ui/list'
import { featuredFor } from '../data/featured'

// "Featured by Frappe": podcast episodes and partner stories Frappe made about
// this firm. One list rather than two sections, since no partner has more than
// two items. Each row leads with the real thumbnail (the episode's, the
// story's cover), or an icon where there's none.
// Read-only everywhere, the partner's own page included: Frappe writes it.
const props = defineProps({
  partner: { type: Object, required: true },
})

const items = computed(() => featuredFor(props.partner.id))
const ICON = { podcast: 'lucide-mic', story: 'lucide-file-text' }
const KIND = { podcast: 'Podcast', story: 'Partner story' }
const open = (href) => window.open(href, '_blank', 'noopener')
</script>

<template>
  <section v-if="items.length">
    <h2 class="text-base font-semibold text-ink-gray-8">Featured by Frappe</h2>
    <div class="-mx-3 mt-3">
      <List :columns="['10rem', 'minmax(0,1fr)']" :row-height="108" class="list-gap-3">
        <ListRows :items="items" v-slot="{ item }">
          <ListRow :on-click="() => open(item.href)">
            <ListCell>
              <img v-if="item.thumb" :src="item.thumb" alt="" class="aspect-video w-40 rounded-4 bg-surface-gray-2 object-cover" />
              <span v-else class="grid aspect-video w-40 place-items-center rounded-4 bg-surface-gray-2 text-ink-gray-6" aria-hidden="true">
                <span :class="[ICON[item.kind], 'size-4']" />
              </span>
            </ListCell>
            <ListCell>
              <div class="flex min-w-0 flex-col gap-1">
                <p class="line-clamp-2 text-base font-medium text-ink-gray-8">{{ item.title }}</p>
                <p class="text-p-base text-ink-gray-6">{{ KIND[item.kind] }} · {{ item.meta }}</p>
              </div>
            </ListCell>
          </ListRow>
        </ListRows>
      </List>
    </div>
  </section>
</template>
