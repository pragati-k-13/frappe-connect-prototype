<script setup>
import { computed, reactive, watch } from 'vue'
import { PACK_SCOPE } from '../data/packs'
import IconRupee from '~icons/lucide/receipt-indian-rupee'
import IconReconcile from '~icons/lucide/arrow-left-right'
import IconStatements from '~icons/lucide/chart-line'
import IconDocument from '~icons/lucide/file-text'
import IconTruck from '~icons/lucide/truck'
import IconFileCheck from '~icons/lucide/file-check'
import IconScale from '~icons/lucide/scale'
import IconShip from '~icons/lucide/ship'
import IconPayment from '~icons/lucide/banknote'
import IconNote from '~icons/lucide/file-minus'
import IconWarehouses from '~icons/lucide/building-2'
import IconBarcode from '~icons/lucide/scan-barcode'
import IconReorder from '~icons/lucide/bell-ring'
import IconBom from '~icons/lucide/layers'
import IconWorkOrder from '~icons/lucide/clipboard-list'
import IconStock from '~icons/lucide/boxes'
import IconEmployee from '~icons/lucide/contact'
import IconLeave from '~icons/lucide/calendar-days'
import IconExpense from '~icons/lucide/receipt'
import IconSalary from '~icons/lucide/wallet'
import IconTax from '~icons/lucide/percent'
import IconAgeing from '~icons/lucide/calendar-clock'
import IconPurchase from '~icons/lucide/shopping-cart'
import { Button } from 'frappe-ui'
import IconChevronDown from '~icons/lucide/chevron-down'

// A Starter Pack's scope, module by module.
//
// ── The idea ────────────────────────────────────────────────────────────────
// Not every line of the scope matters equally. Each module leads with three
// STARS — the features a buyer is checking for (three, or six where a
// module needs more: full rows only, never a row of one or two) — in the icon, title and line
// pattern the catalogue uses, and everything else it sets up sits behind one
// closed "More" toggle: the stars are the point, and the list is there
// for whoever wants to check it.
//
// ⚠️ The copy names features, not benefits. The people evaluating a pack know
// these terms from spreadsheets and Tally; a line that reads like an ad loses
// them. See `stars` and `alsoSetUp` in `data/packs.js`.
// ⚠️ No "Not included" here. Exclusions are left to the scope document.
const props = defineProps({
  pack: { type: Object, required: true },
})

const STAR_ICONS = {
  'receipt-indian-rupee': IconRupee,
  'arrow-left-right': IconReconcile,
  'chart-line': IconStatements,
  'file-text': IconDocument,
  truck: IconTruck,
  'file-check': IconFileCheck,
  scale: IconScale,
  ship: IconShip,
  banknote: IconPayment,
  'file-minus': IconNote,
  'building-2': IconWarehouses,
  'scan-barcode': IconBarcode,
  'bell-ring': IconReorder,
  layers: IconBom,
  'clipboard-list': IconWorkOrder,
  boxes: IconStock,
  contact: IconEmployee,
  'calendar-days': IconLeave,
  receipt: IconExpense,
  wallet: IconSalary,
  percent: IconTax,
  'calendar-clock': IconAgeing,
  'shopping-cart': IconPurchase,
}

const areas = computed(() =>
  props.pack.areas.map((key) => ({
    key,
    label: PACK_SCOPE[key].label,
    stars: PACK_SCOPE[key].stars,
    alsoSetUp: PACK_SCOPE[key].alsoSetUp,
  })),
)

// The "More" list starts closed in every module; each opens on its own. Moving
// to another pack keeps this component, so the open ones reset with the pack.
// One sentence-case line: the list's first letter up, the rest as written
// (lowercase, bar acronyms like GST and BOM).
const sentence = (items) => {
  const text = items.join(', ')
  return `${text[0].toUpperCase()}${text.slice(1)}.`
}

const open = reactive({})
watch(
  () => props.pack,
  () => {
    for (const key of Object.keys(open)) delete open[key]
  },
)
</script>

<template>
  <!-- One card per module: an outline at the catalogue cards' radius, the
       module's name on a filled header band, then the stars. The rest of the
       module's scope opens under the stars from a "More" button at the
       header's right, so every card ends on its stars. HR and Payroll have no
       further inclusions, so their headers carry the name alone. -->
  <div class="space-y-10">
    <section
      v-for="area in areas"
      :key="area.key"
      class="overflow-hidden rounded-6 border border-outline-gray-1"
      :aria-labelledby="`scope-${area.key}`"
    >
      <!-- `h-10` fixes the band's height with or without the button. -->
      <div
        class="flex h-10 items-center justify-between gap-4 border-b border-outline-gray-1 bg-surface-gray-1 px-5"
      >
        <h3 :id="`scope-${area.key}`" class="text-base font-medium text-ink-gray-8">
          {{ area.label }}
        </h3>
        <!-- `-mr-2`: the ghost button's own padding, so its chevron lines up
             with the stars' right edge. -->
        <Button
          v-if="area.alsoSetUp.length"
          class="-mr-2 !text-ink-gray-6 hover:!text-ink-gray-8"
          variant="ghost"
          size="sm"
          :label="open[area.key] ? 'Less' : 'More'"
          :aria-expanded="!!open[area.key]"
          :aria-controls="`also-${area.key}`"
          @click="open[area.key] = !open[area.key]"
        >
          <template #suffix>
            <IconChevronDown
              class="size-4 transition-transform motion-reduce:transition-none"
              :class="open[area.key] && 'rotate-180'"
              aria-hidden="true"
            />
          </template>
        </Button>
      </div>

      <!-- The stars: an icon in a small tile, then the title and its line
           beside it. -->
      <ul class="grid gap-x-6 gap-y-8 px-5 py-7 sm:grid-cols-3">
        <li v-for="star in area.stars" :key="star.title" class="flex items-start gap-2.5">
          <span
            class="grid size-8 shrink-0 place-items-center rounded-[6px] bg-surface-gray-2"
            aria-hidden="true"
          >
            <component :is="STAR_ICONS[star.icon]" class="size-4 text-ink-gray-7" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-base font-medium text-ink-gray-7">
              {{ star.title }}
            </span>
            <span class="mt-1 block text-pretty text-p-sm text-ink-gray-6">
              {{ star.body }}
            </span>
          </span>
        </li>
      </ul>

      <!-- Everything else, closed until asked for, opening UNDER the stars so
           it never pushes them down. Height eases from 0fr to 1fr; the closed
           list is `inert`, out of the tab order. Its padding sits inside the
           clipped child, so a closed list adds no height. -->
      <div
        v-if="area.alsoSetUp.length"
        :id="`also-${area.key}`"
        class="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
        :class="open[area.key] ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        :inert="!open[area.key]"
      >
        <div class="overflow-hidden">
          <div class="px-5 pb-6 pt-2">
            <p class="text-sm font-medium text-ink-gray-6">Also included</p>
            <p class="mt-1 text-pretty text-p-sm text-ink-gray-6">
              {{ sentence(area.alsoSetUp) }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
