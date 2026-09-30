<script setup>
import { computed } from 'vue'
import FilterChip from './FilterChip.vue'
import { TIERS, TIMELINES, WORK_STYLES, asksCity, matchingPartners } from '../data/custom'
import { INDIA_CITIES } from '../data/partners'
import { useConnectStore } from '../stores/connect'

// The criteria that narrow who a brief reaches, as fields — for whichever
// surface is asking: `PartnerFiltersDialog`, and the contact quiz's details
// dialog, which swaps them in over its read-only list.
//
// ⚠️ IT ONLY EVER EMITS `patch`. The caller decides where a change lands — the
// account's brief or a draft's — so this cannot write to the wrong one.
const props = defineProps({
  brief: { type: Object, required: true },
  answers: { type: Object, default: null },
  // The running "N partners left" under the chips. Off where the surface
  // around these fields already shows the number; the per-chip counts stay.
  total: { type: Boolean, default: true },
})
const emit = defineEmits(['patch'])

const store = useConnectStore()
const brief = computed(() => props.brief)
const company = computed(() => props.answers ?? store.company)
const save = (patch) => emit('patch', patch)
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
</script>

<template>
  <div>
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

        <!-- ⚠️ THE ONE ANSWER IN HERE THAT NARROWS NOTHING, which is why it
             carries no count: it is printed on the brief for the partner to
             read, and there is nothing on a partner to test it against. -->
        <div>
          <p class="text-sm text-ink-gray-7">When do you need it live?</p>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <FilterChip
              v-for="t in TIMELINES"
              :key="t.value"
              :label="t.label"
              :selected="brief.timeline === t.value"
              @toggle="save({ timeline: brief.timeline === t.value ? '' : t.value })"
            />
          </div>
        </div>

        <div>
          <p class="text-sm text-ink-gray-7">How do you want to work?</p>
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
      <p v-if="total" class="mt-5 border-t border-outline-gray-2 pt-4 text-p-base text-ink-gray-7">
        <template v-if="matches.length">
          <span class="font-medium tabular-nums">{{ matches.length }}</span>
          {{ matches.length === 1 ? 'partner' : 'partners' }} left.
        </template>
        <template v-else>No partner matches all of this. Loosen something.</template>
      </p>
  </div>
</template>
