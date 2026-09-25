<script setup>
import { computed } from 'vue'
import IconChevronDown from '~icons/lucide/chevron-down'
import { CUSTOMER_RESPONSIBILITIES, commercialTermsFor } from '../data/packs'

// What you are agreeing to, as two disclosures.
//
// ⚠️ A COMPONENT, AND IT WAS A BLOCK OF MARKUP ON ONE PAGE. The recommendation
// screen now shows the same terms as the pack detail page, and thirty lines of
// `<details>` copied across two files is how one of them comes to carry an
// extra clause. The lists were already shared through `data/packs.js`; this is
// the rest of it.
//
// ⚠️ REGION AWARE, because the commercial terms name a tax and an hourly rate
// and quoting a German buyer in rupees is the bug `commercialTermsFor` exists
// to prevent.
//
// ⚠️ STILL DISCLOSURES, not printed lists. The terms belong on the page rather
// than behind a panel one navigation away, but thirteen lines of contract
// printed under a price would bury the thing that answers what you are buying.
const props = defineProps({
  region: { type: String, required: true },
})

const terms = computed(() => [
  { key: 'commercial', label: 'Commercial terms', lines: commercialTermsFor(props.region) },
  { key: 'responsibilities', label: 'What we need from you', lines: CUSTOMER_RESPONSIBILITIES },
])
</script>

<template>
  <section>
    <h2 class="text-lg font-semibold text-ink-gray-8">Terms and conditions</h2>

    <div class="mt-1 divide-y divide-outline-gray-1 border-b border-outline-gray-1">
      <!-- ⚠️ `<details>`, not a hand-rolled toggle: this version of frappe-ui
           ships no accordion, and the native element brings the open state, the
           keyboard behaviour and the semantics for free. Same device as
           `PackScope` and `PackPanel`. -->
      <details v-for="t in terms" :key="t.key" class="group">
        <summary
          class="flex cursor-pointer list-none items-center gap-2 py-3 text-p-base font-medium text-ink-gray-7 [&::-webkit-details-marker]:hidden"
        >
          <span class="min-w-0 flex-1">{{ t.label }}</span>
          <IconChevronDown
            class="size-4 shrink-0 text-ink-gray-5 motion-safe:transition-transform group-open:rotate-180"
          />
        </summary>
        <!-- Bulleted: each line is a separate term, read one at a time. Without
             a mark, a term that wraps and the term after it look the same. -->
        <ul class="list-disc space-y-1 pb-4 pl-5 marker:text-ink-gray-4">
          <li v-for="line in t.lines" :key="line" class="text-p-base text-ink-gray-6">
            {{ line }}
          </li>
        </ul>
      </details>
    </div>
  </section>
</template>
