<script setup>
import { computed } from 'vue'
import { Dialog, ScrollArea } from 'frappe-ui'
import { termsSectionsFor } from '../data/packs'

// The Starter Pack terms, read before they are agreed.
//
// ⚠️ SECTIONS, NOT ONE LIST. Thirteen lines of contract under one heading is
// a wall; four short groups with a name each can be scanned for the one you
// care about. The grouping lives in `termsSectionsFor` so the recommendation
// screen and this dialog cannot disagree about a line.
const props = defineProps({
  open: { type: Boolean, default: false },
  region: { type: String, required: true },
  // Already agreed: the dialog is for reading, and offers nothing to press.
  agreed: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'agree'])

const sections = computed(() => termsSectionsFor(props.region))

const actions = computed(() =>
  props.agreed
    ? []
    : [
        {
          label: 'Agree',
          variant: 'solid',
          onClick: () => {
            emit('agree')
            emit('update:open', false)
          },
        },
      ],
)
</script>

<template>
  <Dialog
    :model-value="open"
    title="Terms and conditions"
    size="xl"
    :actions="actions"
    @update:model-value="emit('update:open', $event)"
  >
    <template #default>
      <!-- A ScrollArea, as in `PackScopeDialog`: the scrollbar shows on
           scroll, not for as long as the dialog is open. -->
      <ScrollArea class="fc-scroll-dialog -mr-4" viewport-class="pr-4">
        <div class="space-y-6">
          <section v-for="s in sections" :key="s.key">
            <h4 class="text-base font-medium text-ink-gray-8">{{ s.label }}</h4>
            <ul class="mt-2 list-disc space-y-1.5 ps-5 marker:text-ink-gray-4">
              <li v-for="line in s.lines" :key="line" class="text-p-base text-ink-gray-7">
                {{ line }}
              </li>
            </ul>
          </section>
        </div>
      </ScrollArea>
    </template>
  </Dialog>
</template>
