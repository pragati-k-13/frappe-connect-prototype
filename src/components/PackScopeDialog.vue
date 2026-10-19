<script setup>
import { computed, ref, watch } from 'vue'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from 'reka-ui'
import { Button, Dialog, ScrollArea, TabButtons } from 'frappe-ui'
import IconAdded from '~icons/lucide/check'
import IconAdd from '~icons/lucide/plus'
import IconMinus from '~icons/lucide/minus'
import { DEFAULT_REGION, marketFor, priceFor } from '../data/packs'
import { appLogo } from '../data/apps'
import { commas, isProse, pointsOf, scopeRows } from '../packScope'
import { useConnectStore } from '../stores/connect'

// A pack's scope: what it is for, then what the sessions cover — the pack
// page's own rows (`packScope.js`), as the same accordion. With one pack and
// an Add, its price and the Add; with a project's packs, tabs and no footer.
//
// ⚠️ LISTED, NOT DRAWN, and they were a stack of plates (`PackModuleStack`)
// that named the modules and nothing in them, with "See what's included" off
// to the pack page for the rest. The rest is here now, so that link is gone.
const props = defineProps({
  open: { type: Boolean, default: false },
  pack: { type: Object, default: null },
  // A basket: the dialog shows one pack at a time, with tabs to switch.
  // Takes precedence over `pack`.
  packs: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:open'])

const store = useConnectStore()

const list = computed(() => (props.packs.length ? props.packs : [props.pack].filter(Boolean)))
const current = ref(null)
// Reset on open, not on close, so the content does not swap while fading out.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) current.value = list.value[0]?.value ?? null
  },
  { immediate: true },
)
const shown = computed(() => list.value.find((p) => p.value === current.value) ?? list.value[0])
const tabs = computed(() => list.value.map((p) => ({ label: p.name, value: p.value })))

// Same market resolution as the pack page, so the price matches it.
const region = computed(
  () =>
    marketFor(store.company.country) ??
    marketFor(store.filters.countries[0]) ??
    store.answers.region[0] ??
    DEFAULT_REGION,
)

const scope = computed(() => scopeRows(shown.value))
const isErpnext = computed(() => !!shown.value?.apps.includes('erpnext'))

// ⚠️ ADD ONLY FOR ONE PACK. The tabbed form is a project's packs — already
// bought — where "Add" would offer to buy them again. Adding here does not
// navigate: the dialog sits over the catalogue or the recommendation, both of
// which show the basket, and the button turns into the catalogue card's
// "Added", which takes the pack out again.
const addable = computed(() => list.value.length === 1)
const inBasket = computed(() => Boolean(shown.value && store.packs.includes(shown.value.value)))
</script>

<template>
  <Dialog
    :model-value="open"
    :title="list.length > 1 ? 'Scope of work' : (shown?.name ?? 'What this covers')"
    size="xl"
    :show-close-button="list.length !== 1"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- Default slot, not `#body-content` — the older name fails silently; see
         the note in `NewProjectDialog`. -->
    <!-- One pack: its name, what it is for, and the two facts, in the header —
         the pack page's hero, small. With tabs they follow the tab instead. -->
    <!-- ⚠️ OUR OWN CLOSE BUTTON, top-aligned to the name. frappe-ui's header
         row centres its close on a one-line title; with the tagline under the
         name it sat between the two lines, belonging to neither. The slot
         hands us the dialog's own `close`, and the button is frappe-ui's ghost
         one, so it is the same control — only its alignment changes. -->
    <template v-if="list.length === 1 && shown" #title="{ close }">
      <div class="flex items-start justify-between gap-4">
        <!-- The app's mark leads the name, as on the pack's card and page:
             the same three things identify a pack wherever it is shown. -->
        <div class="flex min-w-0 items-start gap-3">
          <img :src="appLogo(shown.apps[0])" alt="" class="mt-0.5 size-6 shrink-0 object-contain" />
          <div class="min-w-0">
            <h3 class="text-2xl-semibold leading-6 text-ink-gray-8">{{ shown.name }}</h3>
            <p class="mt-1 text-p-base text-ink-gray-6">{{ shown.tagline }}</p>
          </div>
        </div>
        <Button variant="ghost" class="-mt-0.5 shrink-0" aria-label="Close" @click="close">
          <template #icon><span class="lucide-x size-4 text-ink-gray-9" /></template>
        </Button>
      </div>
    </template>
    <template #default>
      <TabButtons
        v-if="shown && list.length > 1"
        v-model="current"
        class="mb-4 shrink-0"
        :options="tabs"
      />
      <ScrollArea v-if="shown" class="fc-scroll-dialog -mr-4" viewport-class="pr-4">

        <!-- ⚠️ THE SCOPE ITSELF, NOT A DIAGRAM: the pack page's "What the
             sessions cover" rows, as the same accordion — all closed, one open
             at a time, so the row names alone say what the pack covers.
             Keyed on the pack, so switching tabs closes them again. Rules
             between rows only. Points read as on the page; see
             `packScope.js`. -->
        <AccordionRoot
          :key="shown.value"
          type="single"
          collapsible
          class="divide-y divide-outline-gray-1"
        >
          <AccordionItem
            v-for="m in scope"
            :key="m.key"
            :value="m.key"
            class="group py-4 first:pt-0 last:pb-0"
          >
            <AccordionHeader as="h4">
              <AccordionTrigger
                class="flex w-full items-center gap-3 rounded-4 text-left text-base font-semibold text-ink-gray-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
              >
                <component :is="m.icon" class="size-4 shrink-0 text-ink-gray-6" aria-hidden="true" />
                <span class="flex-1">{{ m.label }}</span>
                <IconMinus
                  class="hidden size-4 shrink-0 text-ink-gray-5 group-data-[state=open]:block"
                  aria-hidden="true"
                />
                <IconAdd
                  class="size-4 shrink-0 text-ink-gray-5 group-data-[state=open]:hidden"
                  aria-hidden="true"
                />
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent class="fc-accordion-content overflow-hidden">
              <div class="pl-7 pt-2">
                <p v-if="m.sentence" class="text-p-base text-ink-gray-7">{{ m.sentence }}</p>
                <div v-else-if="m.lines" class="space-y-1.5 text-p-base text-ink-gray-7">
                  <p v-for="(line, i) in m.lines" :key="i">{{ commas(line) }}</p>
                </div>
                <p v-else-if="!isErpnext || isProse(pointsOf(m))" class="text-p-base text-ink-gray-7">
                  {{ commas(pointsOf(m)) }}
                </p>
                <ul v-else class="space-y-1.5 text-p-base text-ink-gray-7">
                  <li v-for="(point, i) in pointsOf(m)" :key="i">{{ point }}</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </AccordionRoot>
      </ScrollArea>
    </template>
    <!-- ⚠️ A FOOTER ONLY WHERE THERE IS AN ADD: the price and the act, as a
         cart's total sits by its checkout. A project's packs are already
         bought, so there is nothing to price or add — no footer at all. The
         scope is in the body now, so there is no "See what's included" to go
         to either. Wraps on a phone, the price above the button.
         `-mt-3`: frappe-ui's body padding and its footer's together left
         40px; 28 keeps the footer with the pack it prices. -->
    <template v-if="shown && addable" #actions>
      <div class="-mt-3 flex flex-wrap items-center justify-end gap-x-4 gap-y-3">
        <p class="mr-auto text-lg font-semibold tabular-nums text-ink-gray-9">
          {{ priceFor(shown, region) }}
        </p>
        <Button
          :variant="inBasket ? 'subtle' : 'solid'"
          :label="inBasket ? 'Added' : 'Add'"
          @click="store.togglePack(shown.value)"
        >
          <!-- The catalogue card's marks: + to add, ✓ once added. -->
          <template #prefix>
            <IconAdded v-if="inBasket" class="size-4" />
            <IconAdd v-else class="size-4" />
          </template>
        </Button>
      </div>
    </template>
  </Dialog>
</template>
