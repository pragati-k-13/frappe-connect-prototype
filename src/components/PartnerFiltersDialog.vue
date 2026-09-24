<script setup>
import { computed } from 'vue'
import { Button, Dialog } from 'frappe-ui'
import FilterChip from './FilterChip.vue'
import { TIERS, TIMELINES, WORK_STYLES, asksCity, matchingPartners } from '../data/custom'
import { INDIA_CITIES } from '../data/partners'
import { useConnectStore } from '../stores/connect'

// Narrowing who a brief reaches.
//
// ⚠️ A DIALOG, because these are a DETOUR. They were a section of the
// recommendation screen — ten chips under three sub-headings, sitting above the
// send button and below two questions that had not been answered yet — which
// made a screen with one thing to do look like a screen with fifteen, and
// offered to refine a search before the thing being searched for was written.
//
// ⚠️ IT WRITES STRAIGHT TO THE STORE — or, given a draft project's `brief`,
// reports each change as `patch` for the draft to keep — with no Apply. There is
// nothing to commit: every toggle is reversible, the count at the top moves
// with it, and the screen behind shows the same number. An Apply button would
// only introduce a state where the dialog and the page disagree.
const props = defineProps({
  open: { type: Boolean, default: false },
  // Someone else's requirements and answers — a draft project's. Changes are
  // then reported as `patch` instead of written to the account's.
  brief: { type: Object, default: null },
  answers: { type: Object, default: null },
})
const emit = defineEmits(['update:open', 'patch'])

const store = useConnectStore()
const brief = computed(() => props.brief ?? store.brief)
const company = computed(() => props.answers ?? store.company)
const save = (patch) => (props.brief ? emit('patch', patch) : save(patch))
const matches = computed(() => matchingPartners(company.value, brief.value))

// ⚠️ THE COUNT PER OPTION, BEFORE IT IS PRESSED. Without it every chip is a
// guess: somebody narrows to Kochi, watches the total fall to one, and has to
// undo it to find out what Chennai would have given. The number is what the
// list would be IF THIS OPTION WERE THE ONLY ONE ON IN ITS OWN GROUP, with the
// other groups left as they are — which is what facet counts mean everywhere
// else and is the only reading that stays stable as you tick around.
//
// ⚠️ Deliberately NOT "what you would have if you added this to what is already
// picked". Cities union, so that number grows as you select and the chip you
// are looking at reports a figure that includes cities you chose earlier.
const countFor = (key, value) =>
  matchingPartners(company.value, { ...brief.value, [key]: [value] }).length

const countForStyle = (value) =>
  matchingPartners(company.value, { ...brief.value, workStyle: value }).length

const toggleIn = (key, value) => {
  const list = brief.value[key]
  save({
    [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
  })
}

const clear = () =>
  save({ cities: [], tiers: [], workStyle: '', timeline: '' })

const count = computed(
  () =>
    brief.value.cities.length +
    brief.value.tiers.length +
    (brief.value.workStyle ? 1 : 0) +
    (brief.value.timeline ? 1 : 0),
)
</script>

<template>
  <Dialog
    :model-value="open"
    title="Edit criteria"
    @update:model-value="emit('update:open', $event)"
  >
    <template #default>
      <div class="space-y-5">
        <!-- ⚠️ INDIA ONLY, and the absence is explained rather than silent —
             see `asksCity`. Outside India the directory's biggest city holds one
             firm, so every option would return one result or none. -->
        <div v-if="asksCity(company.country)">
          <p class="text-sm text-ink-gray-7">City</p>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <FilterChip
              v-for="city in INDIA_CITIES"
              :key="city"
              :label="city"
              :count="countFor('cities', city)"
              :selected="brief.cities.includes(city)"
              @toggle="toggleIn('cities', city)"
            />
          </div>
        </div>

        <div>
          <p class="text-sm text-ink-gray-7">Partner tier</p>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <FilterChip
              v-for="t in TIERS"
              :key="t.value"
              :label="t.label"
              :count="countFor('tiers', t.value)"
              :selected="brief.tiers.includes(t.value)"
              @toggle="toggleIn('tiers', t.value)"
            />
          </div>
        </div>

        <!-- ⚠️ THE ONE ANSWER IN HERE THAT NARROWS NOTHING, and it says so on
             the line under it rather than in a tooltip. A partner deciding
             whether to quote wants it more than they want the tier, so it is
             collected and printed on the brief; there is nothing on a partner
             to test it against until the partner side is asked when they are
             free. Every chip beside it carries a count and this one cannot,
             which is the same fact stated twice. -->
        <div>
          <p class="text-sm text-ink-gray-7">When you want to start</p>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <FilterChip
              v-for="t in TIMELINES"
              :key="t.value"
              :label="t.label"
              :selected="brief.timeline === t.value"
              @toggle="save({ timeline: brief.timeline === t.value ? '' : t.value })"
            />
          </div>
          <p class="mt-1.5 text-p-sm text-ink-gray-5">
            Partners see this on your requirements, but it does not narrow the list.
          </p>
        </div>

        <div>
          <p class="text-sm text-ink-gray-7">How you want to work</p>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <!-- Single-select, and re-pressing clears it: "no preference" is the
                 absence of an answer rather than a third chip, because a third
                 chip would make the empty state look unanswered. -->
            <FilterChip
              v-for="w in WORK_STYLES"
              :key="w.value"
              :label="w.label"
              :count="countForStyle(w.value)"
              :selected="brief.workStyle === w.value"
              @toggle="save({ workStyle: brief.workStyle === w.value ? '' : w.value })"
            />
          </div>
        </div>
      </div>

      <!-- ⚠️ THE COUNT LIVES IN HERE TOO, and it has to: narrowing to nothing is
           the one outcome of this dialog worth catching before it is closed. -->
      <p class="mt-5 border-t border-outline-gray-2 pt-4 text-p-base text-ink-gray-7">
        <template v-if="matches.length">
          <span class="font-medium tabular-nums">{{ matches.length }}</span>
          {{ matches.length === 1 ? 'partner' : 'partners' }} left.
        </template>
        <template v-else>No partner matches all of this. Loosen something.</template>
      </p>

      <div class="mt-4 flex items-center gap-2">
        <Button variant="solid" label="Done" @click="emit('update:open', false)" />
        <Button v-if="count" variant="ghost" label="Clear" @click="clear" />
      </div>
    </template>
  </Dialog>
</template>
