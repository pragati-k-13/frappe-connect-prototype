<script setup>
import { computed, ref } from 'vue'
import EmptyState from './EmptyState.vue'

// The Activity tab on a lead or a customer: what changed, who changed it,
// oldest first. Back-to-back changes by the same person fold into one line
// ("Show +2 changes from Farhan Qureshi"), as Frappe CRM does, so a burst of
// stage moves doesn't bury everything else.
const props = defineProps({
  items: { type: Array, required: true },
})

const groups = computed(() => {
  const out = []
  for (const item of props.items) {
    const last = out.at(-1)
    if (item.kind === 'change' && last?.kind === 'change' && last.by === item.by) last.rest.push(item)
    else out.push({ ...item, rest: [] })
  }
  return out
})

const expanded = ref({})

const ago = (at) => {
  const mins = Math.round((Date.now() - at) / 60000)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (mins < 60) return rtf.format(-Math.max(mins, 1), 'minute')
  if (mins < 60 * 24) return rtf.format(-Math.round(mins / 60), 'hour')
  if (mins < 60 * 24 * 30) return rtf.format(-Math.round(mins / 1440), 'day')
  if (mins < 60 * 24 * 365) return rtf.format(-Math.round(mins / 43200), 'month')
  return rtf.format(-Math.round(mins / 525600), 'year')
}
const ICON = { created: 'lucide-sparkles', change: 'lucide-pencil', note: 'lucide-link' }
</script>

<template>
  <EmptyState v-if="!items.length" icon="lucide-history" title="No activity yet" />
  <ol v-else class="relative">
    <li v-for="(g, i) in groups" :key="g.id" class="relative flex gap-3 pb-5 last:pb-0">
      <!-- The rail between entries. -->
      <span v-if="i < groups.length - 1" class="absolute bottom-0 left-2 top-6 border-l border-outline-gray-1" aria-hidden="true" />
      <span :class="ICON[g.kind]" class="relative mt-0.5 size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <template v-for="(e, j) in [g, ...(expanded[g.id] ? g.rest : [])]" :key="e.id">
          <div class="flex items-baseline justify-between gap-3" :class="j > 0 && 'mt-2'">
            <p class="min-w-0 text-p-base text-ink-gray-5">
              <!-- Spaces as text: Vue drops whitespace between elements on
                   their own lines, which welded the name to the verb. -->
              <span class="text-ink-gray-8">{{ e.by }}</span>{{ ' ' }}
              <template v-if="e.kind === 'change'">
                {{ 'changed ' }}<span class="text-ink-gray-8">{{ e.field }}</span>{{ ' from ' }}<span
                  class="text-ink-gray-8"
                  >{{ e.from }}</span
                >{{ ' to ' }}<span class="text-ink-gray-8">{{ e.to }}</span>
              </template>
              <template v-else>{{ e.text }}</template>
            </p>
            <span class="shrink-0 text-sm text-ink-gray-5">{{ ago(e.at) }}</span>
          </div>
        </template>
        <button
          v-if="g.rest.length"
          type="button"
          class="mt-2 flex items-center gap-1 text-p-sm text-ink-gray-7 hover:text-ink-gray-9"
          :aria-expanded="Boolean(expanded[g.id])"
          @click="expanded[g.id] = !expanded[g.id]"
        >
          {{ expanded[g.id] ? 'Hide' : 'Show' }} +{{ g.rest.length }} {{ g.rest.length === 1 ? 'change' : 'changes' }} from {{ g.by }}
          <span class="lucide-chevrons-up-down size-4 text-ink-gray-5" aria-hidden="true" />
        </button>
      </div>
    </li>
  </ol>
</template>
