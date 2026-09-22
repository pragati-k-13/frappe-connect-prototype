<script setup>
import { computed } from 'vue'
import { Button, Dialog } from 'frappe-ui'
import PackScope from './PackScope.vue'
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'
import { INCLUDED_IN_ALL, STRICTLY_EXCLUDED, asExclusion } from '../data/packs'

// What a pack covers, and what it never does.
//
// ⚠️ THE QUESTION THIS ANSWERS IS "IS PAYMENT RECONCILIATION IN THIS OR NOT",
// and until now the only place to find out was the pack's own page — a
// navigation away from the screen where the money is decided, from which the
// way back is the browser's Back button. A fixed scope IS the contract, so
// reading it should not cost leaving the purchase.
//
// ⚠️ THREE LISTS, in the order somebody checks them:
//
//   1. module by module, from the scope document — the long one, and the
//      only one that differs per pack
//   2. what ships with every pack regardless of which you bought
//   3. what no pack ever covers
//
// The last two are the same on all three packs and are printed here anyway.
// Somebody comparing two packs in two visits to this dialog would otherwise
// have to remember that the exclusions did not change.
//
// ⚠️ `PackScope` is the pack page's own component, not a summary of it. A
// shorter "key points" version was the obvious thing to build and it is the
// wrong one: a scope document paraphrased is a scope document that can disagree
// with the contract.
const props = defineProps({
  open: { type: Boolean, default: false },
  pack: { type: Object, default: null },
})
const emit = defineEmits(['update:open'])

const notInScope = computed(() => STRICTLY_EXCLUDED.map(asExclusion))
</script>

<template>
  <Dialog
    :model-value="open"
    :title="pack?.name ?? 'What this covers'"
    size="3xl"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- Default slot, not `#body-content` — the older name fails silently; see
         the note in `NewProjectDialog`. -->
    <template #default>
      <div v-if="pack">
        <p class="text-p-base text-ink-gray-6">
          {{ pack.hours }} hours · {{ pack.validity }} to deliver
        </p>

        <div class="mt-5">
          <PackScope :pack="pack" />
        </div>

        <!-- ── True of every pack ──────────────────────────────────────── -->
        <!-- ⚠️ Ticks and crosses HERE, where the reason list on the screen
             behind deliberately has none. There the marks would have dressed an
             argument as a spec sheet; this IS a spec sheet, and two lists of
             bare sentences under two headings would leave the reader checking
             the heading to know which way each line ran. -->
        <section class="mt-8">
          <h3 class="text-base font-medium text-ink-gray-8">Included in every pack</h3>
          <ul class="mt-2 grid gap-1.5 sm:grid-cols-2">
            <li
              v-for="item in INCLUDED_IN_ALL"
              :key="item"
              class="flex gap-2 text-p-base text-ink-gray-7"
            >
              <IconCheck class="mt-1 size-3.5 shrink-0 text-ink-gray-5" />
              {{ item }}
            </li>
          </ul>
        </section>

        <section class="mt-6">
          <h3 class="text-base font-medium text-ink-gray-8">Never in a pack</h3>
          <!-- ⚠️ Given the same weight as the inclusions above, not a footnote.
               These are the reason a pack is cheap and fast, and they are what
               sends somebody to a scoped implementation instead — a customer
               who finds them after paying has been sold the wrong thing. -->
          <ul class="mt-2 grid gap-1.5 sm:grid-cols-2">
            <li
              v-for="item in notInScope"
              :key="item.label"
              class="flex gap-2 text-p-base text-ink-gray-6"
            >
              <IconX class="mt-1 size-3.5 shrink-0 text-ink-gray-5" />
              <span class="min-w-0">
                {{ item.label }}
                <span v-if="item.hint" class="block text-p-sm text-ink-gray-5">
                  {{ item.hint }}
                </span>
              </span>
            </li>
          </ul>
        </section>

        <div class="mt-6 flex items-center gap-2">
          <Button variant="solid" label="Done" @click="emit('update:open', false)" />
          <!-- The pack's own page, for the reader who wants the terms as well —
               commercial terms and customer responsibilities live there and are
               not repeated here. Same tab: the basket is on the store, so Back
               returns to the recommendation with everything still ticked. -->
          <Button
            variant="ghost"
            label="Open the full pack page"
            :route="{ name: 'pack', params: { id: pack.value } }"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>
