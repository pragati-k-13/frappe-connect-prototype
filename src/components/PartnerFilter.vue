<script setup>
// The results view's Filter: Helpdesk's filter pattern
// (`helpdesk/shared/src/filter`), cut down to the four tags this page has.
//
// Copied as Helpdesk builds it:
//   trigger   a subtle "Filter" Button with the three-line filter icon; once
//             anything is set, a white count chip grows out of it and a
//             joined X clears every filter (0fr → 1fr grid, 200ms).
//   popover   256px (Helpdesk's is 320px; four short fields need less), `rounded-6`, outline-gray-1 border, `shadow-xl`, in
//             steps that slide like a navigation push:
//               overview  "Filters" and one row per set filter ("Tier is
//                         Gold"); click to edit, X to remove; Add filter
//                         and Clear all underneath
//               fields    the fields not yet set, each with a chevron
//               value     back to the field's name, then its options:
//                         a check for one, checkboxes for App
//
// Not copied: the field search (four fields need no search), the operator
// menu (every field here has one sensible operator), "Replace filter", and
// the keyboard shortcuts.
import { computed, ref } from 'vue'
import { Button, Checkbox, Popover, ScrollArea, Tooltip } from 'frappe-ui'

const props = defineProps({
  // [{ key, label, icon, options: [{ label, value }], multiple }]
  fields: { type: Array, required: true },
  // { tier, apps, rating, reply }, as the store holds them.
  values: { type: Object, required: true },
})
const emit = defineEmits(['set', 'clear'])

const isSet = (f) => (f.multiple ? props.values[f.key]?.length > 0 : props.values[f.key] != null)
const active = computed(() => props.fields.filter(isSet))
const unset = computed(() => props.fields.filter((f) => !isSet(f)))
const labelOf = (f, v) => f.options.find((o) => o.value === v)?.label ?? v
// Helpdesk's summary: "<field> is <value>", "in" for several.
const summary = (f) => {
  const v = props.values[f.key]
  if (!f.multiple) return `${f.label} is ${labelOf(f, v)}`
  return v.length === 1 ? `${f.label} is ${labelOf(f, v[0])}` : `${f.label} in ${v.map((x) => labelOf(f, x)).join(', ')}`
}

// ── Steps ───────────────────────────────────────────────────────────────────
const step = ref('overview')
const field = ref(null)
const direction = ref('forward')
const ORDER = { overview: 0, fields: 1, value: 2 }
const go = (to) => {
  direction.value = ORDER[to] >= ORDER[step.value] ? 'forward' : 'back'
  step.value = to
}
// Opening starts on the overview when something is set, else straight on
// the field list, as Helpdesk does.
const reset = () => {
  direction.value = 'forward'
  field.value = null
  step.value = active.value.length ? 'overview' : 'fields'
}
// The step on screen. An overview with nothing set is an empty box, so it
// falls back to the field list, however the last filter went (removed here,
// cleared from the trigger, or dropped by a search that replaced the URL).
const view = computed(() => (step.value === 'overview' && !active.value.length ? 'fields' : step.value))
const canGoBackFromFields = computed(() => active.value.length > 0)
const openField = (f) => {
  field.value = f
  go('value')
}
const back = () => go(step.value === 'value' && (active.value.length || field.value) ? (active.value.length ? 'overview' : 'fields') : 'overview')

const isPicked = (v) =>
  field.value.multiple ? props.values[field.value.key].includes(v) : props.values[field.value.key] === v
// One value: pick it and return to the overview. Several (App): toggle and
// stay, so you can tick more.
const pick = (v) => {
  const f = field.value
  if (f.multiple) {
    const cur = props.values[f.key]
    emit('set', f.key, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v])
    return
  }
  emit('set', f.key, props.values[f.key] === v ? null : v)
  go('overview')
}
const remove = (f) => {
  emit('set', f.key, f.multiple ? [] : null)
  if (active.value.length <= 1) go('fields')
}
// The trigger's X and the popover's Clear all both clear and close: an
// emptied popover has nothing left to show.
const popover = ref(null)
const clearAll = (close) => {
  emit('clear')
  close?.()
}

// A 0fr to 1fr grid column animates the width, which `auto` cannot.
const REVEAL = 'grid transition-all duration-200 ease-out motion-reduce:transition-none'
const revealOnRowActivity =
  'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100'
</script>

<template>
  <Popover ref="popover" bare side="bottom" align="end" @open="reset">
    <template #trigger>
      <div class="flex w-fit items-center">
        <Button label="Filter" :class="active.length ? 'rounded-e-none' : ''">
          <template #prefix>
            <!-- Helpdesk's filter icon on a 16×16 box (theirs is 16×17). -->
            <svg class="size-4" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 4H14" stroke="currentColor" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M4 8H12" stroke="currentColor" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M6.5 12H9.5" stroke="currentColor" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </template>
          <template #suffix>
            <!-- -ms-2 cancels the Button's gap while the chip is closed -->
            <span :class="[REVEAL, active.length ? 'grid-cols-[1fr]' : 'invisible -ms-2 grid-cols-[0fr]']" :aria-hidden="!active.length">
              <span class="-m-1 min-w-0 overflow-hidden p-1">
                <span class="flex size-5 items-center justify-center rounded-2 bg-surface-base pt-px text-xs-medium text-ink-gray-8 shadow-sm">
                  {{ active.length || '' }}
                </span>
              </span>
            </span>
          </template>
        </Button>
        <!-- invisible: a collapsed X still has a box; visibility waits out the transition -->
        <div :class="[REVEAL, active.length ? 'grid-cols-[1fr]' : 'invisible grid-cols-[0fr]']" :inert="!active.length">
          <div class="min-w-0 overflow-hidden">
            <Tooltip text="Clear all filters">
              <div class="flex">
                <Button class="rounded-s-none border-s border-outline-gray-2" icon="lucide-x" aria-label="Clear all filters" @click.stop="clearAll(popover?.close)" />
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </template>

    <template #default="{ close }">
      <div class="my-2 w-64 rounded-6 border border-outline-gray-1 bg-surface-base shadow-xl">
        <div class="relative overflow-clip rounded-[inherit]">
          <Transition :name="direction === 'forward' ? 'slide-forward' : 'slide-back'">
            <div :key="view">
              <!-- Overview: the set filters. The footer's buttons are ghost `sm` in
                   their own ink, as MultiSelect's footer: Helpdesk's xs gray-5
                   read as disabled, and its trash can promised a delete. -->
              <template v-if="view === 'overview'">
                <div class="flex h-9 items-center border-b border-outline-gray-1 p-2 ps-3">
                  <span class="text-base-medium text-ink-gray-8">Filters</span>
                </div>
                <div class="p-1.5">
                  <div
                    v-for="f in active"
                    :key="f.key"
                    class="group flex h-8 w-full items-center gap-2 rounded-4 px-1.5 pl-0 hover:bg-surface-gray-2"
                  >
                    <Button
                      variant="ghost"
                      :label="summary(f)"
                      class="!h-full min-w-0 flex-1 !justify-start !px-0 !pl-1.5 hover:!bg-transparent"
                      @click="openField(f)"
                    >
                      <template #prefix>
                        <span :class="f.icon" class="size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
                      </template>
                    </Button>
                    <Button
                      variant="ghost"
                      icon="lucide-x"
                      :aria-label="`Remove ${f.label} filter`"
                      :class="revealOnRowActivity"
                      @click="remove(f)"
                    />
                  </div>
                </div>
                <div class="flex items-center justify-between border-t border-outline-gray-1 px-1 py-1.5">
                  <Button v-if="unset.length" variant="ghost" size="sm" label="Add filter" @click="go('fields')">
                    <template #prefix><span class="lucide-plus size-4" aria-hidden="true" /></template>
                  </Button>
                  <span v-else />
                  <Button variant="ghost" size="sm" label="Clear all" @click="clearAll(close)" />
                </div>
              </template>

              <!-- Fields: the ones not yet set -->
              <template v-else-if="view === 'fields'">
                <div v-if="canGoBackFromFields" class="flex h-9 items-center border-b border-outline-gray-1 ps-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon-left="lucide-chevron-left"
                    label="Choose a field"
                    class="!justify-start truncate ps-1 font-medium text-ink-gray-8 hover:bg-transparent hover:opacity-70 active:bg-transparent"
                    @click="go('overview')"
                  />
                </div>
                <div class="p-1.5">
                  <button
                    v-for="f in unset"
                    :key="f.key"
                    type="button"
                    class="flex h-8 w-full items-center gap-2 rounded-4 px-2 text-base text-ink-gray-8 hover:bg-surface-gray-2 focus-visible:bg-surface-gray-2 focus-visible:outline-none"
                    @click="openField(f)"
                  >
                    <span :class="f.icon" class="size-4 text-ink-gray-5" aria-hidden="true" />
                    <span class="flex-1 truncate text-start">{{ f.label }}</span>
                    <span class="lucide-chevron-right size-4 text-ink-gray-4" aria-hidden="true" />
                  </button>
                </div>
              </template>

              <!-- Value: the field's options -->
              <template v-else-if="view === 'value' && field">
                <div class="flex h-9 items-center border-b border-outline-gray-1 pe-2 ps-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon-left="lucide-chevron-left"
                    :label="field.label"
                    class="min-w-0 !justify-start truncate ps-1 font-medium text-ink-gray-8 hover:bg-transparent hover:opacity-70 active:bg-transparent"
                    @click="back"
                  />
                </div>
                <ScrollArea viewport-class="max-h-52">
                  <div role="listbox" :aria-label="field.label" :aria-multiselectable="field.multiple || undefined" class="p-1.5">
                    <button
                      v-for="o in field.options"
                      :key="o.value"
                      type="button"
                      role="option"
                      :aria-selected="isPicked(o.value)"
                      class="flex h-8 w-full items-center gap-2 rounded-4 px-1.5 text-base text-ink-gray-8 hover:bg-surface-gray-2 focus-visible:bg-surface-gray-2 focus-visible:outline-none"
                      @click="pick(o.value)"
                    >
                      <Checkbox
                        v-if="field.multiple"
                        :model-value="isPicked(o.value)"
                        size="sm"
                        tabindex="-1"
                        aria-hidden="true"
                        class="pointer-events-none"
                      />
                      <span class="flex-1 truncate text-start">{{ o.label }}</span>
                      <span v-if="!field.multiple && isPicked(o.value)" class="lucide-check size-4 text-ink-gray-7" aria-hidden="true" />
                    </button>
                  </div>
                </ScrollArea>
              </template>
            </div>
          </Transition>
        </div>
      </div>
    </template>
  </Popover>
</template>

<style scoped>
/* Helpdesk's step slide. Panels are transparent at rest so they never paint
   over the popover border; they only need their own background while two
   of them overlap mid-swipe. */
.slide-forward-enter-active,
.slide-forward-leave-active,
.slide-back-enter-active,
.slide-back-leave-active {
  background-color: var(--surface-base);
  transition:
    transform 250ms cubic-bezier(0.2, 0, 0, 1),
    opacity 250ms cubic-bezier(0.2, 0, 0, 1);
}
.slide-forward-leave-active,
.slide-back-leave-active {
  position: absolute;
  top: 0;
  inset-inline: 0;
}
.slide-forward-enter-active {
  position: relative;
  z-index: 1;
}
.slide-forward-enter-from,
.slide-back-leave-to {
  transform: translateX(100%);
}
.slide-forward-leave-to,
.slide-back-enter-from {
  transform: translateX(-25%);
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .slide-forward-enter-active,
  .slide-forward-leave-active,
  .slide-back-enter-active,
  .slide-back-leave-active {
    transition-duration: 0s;
  }
}
</style>
