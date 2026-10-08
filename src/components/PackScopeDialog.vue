<script setup>
import { computed, ref, watch } from 'vue'
import { Button, Dialog, ScrollArea, TabButtons } from 'frappe-ui'
import IconAdded from '~icons/lucide/check'
import IconAdd from '~icons/lucide/plus'
import { PACK_SCOPE, DEFAULT_REGION, marketFor, priceFor } from '../data/packs'
import PackModuleStack from './PackModuleStack.vue'
import { appLogo } from '../data/apps'
import { SCOPE_ICONS } from '../scopeIcons'
import { useConnectStore } from '../stores/connect'

// A pack at a glance: what it is for, what it costs, and the modules in it —
// each one line. Then the way on to the whole of it.
//
// ⚠️ A SUMMARY NOW, and it used to be the pack page's own `PackScope`. That was
// right while the dialog was the only place the scope lived; each pack has its
// own page now, and once that page grew screenshots, accordions and fixed
// module heights, the dialog became the same page squeezed into 770px, unable
// to show one module whole. The detail — every doctype, every carve-out — is
// on the pack's page, and "See what's included" is in every dialog so it is always
// one click away. A summary cannot disagree with the contract by omission
// while the contract is a click from it.
//
// The modules are drawn, not listed: `PackModuleStack`, one plate per module,
// labelled with PACK_SCOPE's own module names.
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

const modules = computed(() =>
  (shown.value?.areas ?? []).map((key) => ({
    key,
    label: PACK_SCOPE[key].label,
    icon: SCOPE_ICONS[key],
  })),
)

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
        <p v-if="list.length > 1" class="mb-4 text-p-base text-ink-gray-6">{{ shown.tagline }}</p>

        <!-- The modules as a stack of plates, one per module, in a light
             gray panel. `rounded-5` (10px) inside the dialog's `rounded-7`
             (16px): a nested radius smaller than its frame. -->
        <div class="rounded-5 bg-surface-gray-2 pb-1 pt-5">
          <p class="text-center text-base font-medium text-ink-gray-7">Modules in this pack</p>
          <PackModuleStack :modules="modules" />
        </div>
      </ScrollArea>
    </template>
    <template v-if="shown" #actions>
      <!-- ⚠️ THE PRICE SITS WITH THE ACT, left of the buttons, as a cart's
           total sits by its checkout — and only where there is an Add. A
           project's packs are already bought, and a price beside "See what's
           included" alone would read as something still owed.
           The way to the detail, then the act at the far right, where a
           dialog's primary button sits. "See what's included", not "View full
           page": what the reader wants is the scope, not a page. Wraps on a
           phone, the price above the buttons.
           `-mt-3`: frappe-ui's body padding and its footer's together left
           40px between the modules panel and this row; 28 keeps the footer
           with the pack it prices. -->
      <div class="-mt-3 flex flex-wrap items-center justify-end gap-x-4 gap-y-3">
        <p v-if="addable" class="mr-auto text-lg font-semibold tabular-nums text-ink-gray-9">
          {{ priceFor(shown, region) }}
        </p>
        <div class="flex gap-2">
          <Button
            variant="subtle"
            label="See what's included"
            :route="{ name: 'pack', params: { id: shown.value } }"
          />
          <Button
            v-if="addable"
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
      </div>
    </template>
  </Dialog>
</template>
