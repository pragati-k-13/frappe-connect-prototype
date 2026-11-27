<script setup>
import { computed } from 'vue'
import IconBuilding from '~icons/lucide/building-2'
import IconPackage from '~icons/lucide/package'
import IconFactory from '~icons/lucide/factory'
import IconUsers from '~icons/lucide/users'
import IconWallet from '~icons/lucide/wallet'
import IconCalendar from '~icons/lucide/calendar'
import IconApps from '~icons/lucide/layout-grid'
import { budgetLabel, criteriaShort, timelineLabel } from '../data/custom'
import { scopeSentence } from '../data/modules'
import { PROJECT_APPS } from '../data/partners'
import { operationsLabel, problemLabels } from '../data/company'

// The requirements as a partner reads them: the read view of the requirements
// dialog (`BriefDetailsDialog`), and what Contact shows before it sends. ONE
// COMPONENT, so what the business checks before sending is what arrives.
// See `BriefDetailsDialog` for the props.
const props = defineProps({
  brief: { type: Object, default: null },
  own: { type: Boolean, default: false },
  omit: { type: Array, default: () => [] },
  previous: { type: Object, default: null },
  companyName: { type: String, default: '' },
})

// A pack booking's requirements rather than a brief: the packs stand in for the
// scope, there is no budget, and nobody was asked for — Frappe implements
// packs itself. See `packBrief`.
const packs = computed(() => props.brief?.packs ?? null)

const listOf = (items) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : (items[0] ?? '')

// The card's icon facts, continued: who is asking and the numbers the partner
// decides on. ABOUT THE BUSINESS ONLY — the packs were here once and read as
// something the company already had; they are what it bought, so they have
// their own section below.
// ── Requirements: one list, then the description ───────────────────────────
// ⚠️ THE SHORT ANSWERS FIRST, AS ONE LIST; THE DESCRIPTION LAST. Five of the
// seven sections were a heading over one short line, so the dialog had as many
// headings as answers, and the short facts were drawn two ways (icon rows up
// top, sections below). People come back here to check one fact, so the facts
// lead; the description is read once, and at the end a long one only lengthens
// the end — it used to push every answer below it five scrolls down.
//
// ⚠️ BOTH SIDES. The partner read the old sectioned layout until the business's
// was rebuilt; the same brief now reads the same way from either end. On the
// Lead page, `omit: ['facts']` drops the rows its side panel already lists.
const listLayout = computed(() => !packs.value)
const rowsOf = (b) => {
  const apps = (b.projectApps ?? []).map((v) => PROJECT_APPS.find((a) => a.value === v)?.label ?? v)
  const fixed = problemLabels((b.problems ?? []).filter((p) => !(p === 'integration' && b.operations === 'disconnected')))
  return [
    { label: 'Budget', text: budgetLabel(b.budget), fact: true },
    { label: 'Timeline', text: b.timeline ? timelineLabel(b.timeline) : '', fact: true },
    { label: 'Apps', text: apps.join(', '), fact: true },
    { label: 'Modules', text: scopeSentence(b.modules) || '' },
    {
      label: 'Today',
      text: [operationsLabel(b.operations), b.apps?.length ? `${props.own ? 'You use' : 'Uses'} ${listOf(b.apps)}` : ''].filter(Boolean).join('. '),
    },
    { label: 'To fix', text: fixed.join('\n') },
    { label: 'Looking for', text: criteriaShort({ country: b.country, segments: b.segments }, b) },
    {
      label: 'Company',
      // The name leads when it went out with the brief (Contact, a direct
      // contact), so the business sees it is shared.
      text: [props.companyName, b.segments?.[0], b.employees ? `${b.employees} people` : ''].filter(Boolean).join(' · '),
      fact: true,
    },
  ]
}
// `was`: the old value, when the update this was opened from changed it.
const rows = computed(() => {
  const before = props.previous ? rowsOf(props.previous) : null
  return rowsOf(props.brief ?? {})
    .map((r, i) => ({ ...r, was: before && before[i].text !== r.text ? before[i].text : '' }))
    .filter((r) => r.text && !(r.fact && props.omit.includes('facts')))
})

const factsOf = (b) => [
    { icon: IconBuilding, label: 'Company', text: props.companyName },
    { icon: IconFactory, label: 'Industry', text: b.segments?.[0] ?? '' },
    { icon: IconUsers, label: 'Size', text: b.employees ? `${b.employees} people` : '' },
    { icon: IconWallet, label: 'Budget', text: budgetLabel(b.budget) },
    { icon: IconCalendar, label: 'Timeline', text: b.timeline ? timelineLabel(b.timeline) : '' },
    { icon: IconApps, label: 'Apps', text: (b.projectApps ?? []).map((v) => PROJECT_APPS.find((a) => a.value === v)?.label ?? v).join(', ') },
  ]
// `was`: the old value, when an update changed it.
const facts = computed(() => {
  const before = props.previous ? factsOf(props.previous) : null
  return factsOf(props.brief ?? {})
    .map((f, i) => ({ ...f, was: before && before[i].text !== f.text ? before[i].text : '' }))
    .filter((f) => f.text)
})

// How a pack booking runs today. ⚠️ A PACK ASKS ONLY WHAT YOU USE, not the
// operations ladder or what to fix — so this is the systems line alone.
const today = computed(() => {
  const apps = props.brief?.apps ?? []
  return apps.length ? [`${props.own ? 'You use' : 'Uses'} ${listOf(apps)}`] : []
})

// A pack's one free-text answer: what the sessions should focus on. Optional.
const focus = computed(() => (packs.value ? (props.brief?.focus ?? '').trim() : ''))
</script>

<template>
  <div v-if="listLayout" class="flex flex-col gap-6">
    <dl class="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-4 text-base">
      <template v-for="r in rows" :key="r.label">
        <dt class="text-ink-gray-6">{{ r.label }}</dt>
        <dd class="whitespace-pre-line text-ink-gray-8">
          <template v-if="r.was"><s class="block text-ink-gray-5" aria-hidden="true">{{ r.was }}</s></template>{{ r.text }}<span v-if="r.was" class="sr-only">, was {{ r.was }}</span>
        </dd>
      </template>
    </dl>
    <section v-if="!omit.includes('description') && brief.scope" class="flex flex-col gap-2">
      <h4 class="text-base font-medium text-ink-gray-8">Description</h4>
      <p class="whitespace-pre-line text-p-base leading-relaxed text-ink-gray-6">{{ brief.scope }}</p>
    </section>
  </div>
  <div v-else class="flex flex-col gap-7">
    <!-- The deciding facts, straight under the title. The one loud thing
         here; everything below is quiet prose. `aria-label` names each
         icon, since the icon is the label. -->
    <!-- One per line, the card's own layout. A two-column grid wrapped
         them into uneven pairs whose columns meant nothing. -->
    <ul v-if="!omit.includes('facts')" class="flex flex-col gap-2 text-p-base text-ink-gray-6">
      <li
        v-for="f in facts"
        :key="f.label"
        class="flex items-start gap-2"
      >
        <component
          :is="f.icon"
          class="mt-0.5 size-4 shrink-0 text-ink-gray-5"
          role="img"
          :aria-label="f.label"
        />
        <span>
          <!-- The old value is struck for the eye and hidden from screen
               readers, which hear "₹15 to 25 lakh, was ₹5 to 15 lakh". -->
          <template v-if="f.was"><s class="text-ink-gray-5" aria-hidden="true">{{ f.was }}</s>&nbsp; </template>{{ f.text }}<span v-if="f.was" class="sr-only">, was {{ f.was }}</span>
        </span>
      </li>
    </ul>

    <!-- No dividers: three sections, told apart by their headings and the
         space between them. -->
    <!-- A pack booking's counterpart to the scope: what was bought, in the
         place a brief says what is to be built. One pack per line, each
         with the box mark packs carry elsewhere — a pack's own name holds
         commas, so a joined line blurs where one ends. -->
    <section v-if="packs" class="flex flex-col gap-2">
      <h4 class="text-base font-medium text-ink-gray-8">
        {{ own ? 'What you bought' : 'What they bought' }}
      </h4>
      <ul class="flex flex-col gap-2 text-p-base text-ink-gray-6">
        <li v-for="name in packs" :key="name" class="flex items-start gap-2">
          <IconPackage class="mt-0.5 size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
          {{ name }}
        </li>
      </ul>
    </section>

    <section v-if="today.length" class="flex flex-col gap-2">
      <h4 class="text-base font-medium text-ink-gray-8">
        {{ own ? 'How you run today' : 'How they run today' }}
      </h4>
      <ul class="flex flex-col gap-2 text-p-base text-ink-gray-6">
        <li v-for="line in today" :key="line">{{ line }}</li>
      </ul>
    </section>

    <section v-if="focus" class="flex flex-col gap-2">
      <h4 class="text-base font-medium text-ink-gray-8">Focus for the sessions</h4>
      <p class="whitespace-pre-line text-p-base leading-relaxed text-ink-gray-6">{{ focus }}</p>
    </section>
  </div>
</template>
