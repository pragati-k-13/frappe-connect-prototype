<script setup>
import { computed } from 'vue'
import { Dialog, ScrollArea } from 'frappe-ui'
import IconBuilding from '~icons/lucide/building-2'
import IconPackage from '~icons/lucide/package'
import IconFactory from '~icons/lucide/factory'
import IconUsers from '~icons/lucide/users'
import IconWallet from '~icons/lucide/wallet'
import IconCalendar from '~icons/lucide/calendar'
import { budgetLabel, criteriaSentence, timelineLabel } from '../data/custom'
import { scopeSentence } from '../data/modules'
import { operationsLabel, problemLabels } from '../data/company'

// Everything on a brief that is not the first thing you need from it.
//
// ⚠️ READ ONCE, TOP TO BOTTOM, by someone deciding whether to quote. So it is
// shaped as a document, not a record:
//
//   title      the project's name — what the card they opened is called
//   facts      the deciding numbers, as the card's own icon facts: who, how
//              big, what budget, when
//   scope      the one long read, with the modules it covers under it
//   today      how they run now, one line per answer
//   fixed      what they want fixed, one per line
//   looking    who they asked for, as one sentence
//
// It was one flat list of label/value rows between dividers, which gave every
// fact the same weight and put the three that decide it mid-list — and printed
// "Systems that do not talk to each other" twice, once as the operations answer
// and once as a problem.
//
// ⚠️ THREE TONES: title and headings gray-8, every value gray-6, icons gray-5.
// Values were gray-7, a shade darker than the card this opens from and too
// close to the headings to tell the sections apart at a glance.
//
// ⚠️ BUILT FROM THE SNAPSHOT, not from the store. The brief on the message is
// what was sent; the account's answers have kept moving since.
const props = defineProps({
  open: { type: Boolean, default: false },
  brief: { type: Object, default: null },
  // The business reading its own requirements, rather than a partner reading
  // them. Only the wording changes: "you", not "they".
  own: { type: Boolean, default: false },
  // What the caller already shows, so the dialog doesn't repeat it:
  //   'description'  opened from under a message, whose text it is
  //   'facts'        the partner Lead page, whose side panel lists the short
  //                  facts and the modules
  omit: { type: Array, default: () => [] },
  // The version this one replaced, when opened from an update. Changed values
  // show the old one struck through before the new one.
  previous: { type: Object, default: null },
  // The business's own view: an Edit button, or, once editing is locked, the
  // line that says why (`lockNote`).
  editable: { type: Boolean, default: false },
  lockNote: { type: String, default: '' },
  // The company's name, when it went out with these requirements rather than
  // separately (a pack booking, a direct contact). Leads the facts.
  companyName: { type: String, default: '' },
})

const emit = defineEmits(['update:open', 'edit'])
const editActions = [{ label: 'Edit', variant: 'subtle', iconLeft: 'lucide-pencil', onClick: () => emit('edit') }]

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
const factsOf = (b) => [
    { icon: IconBuilding, label: 'Company', text: props.companyName },
    { icon: IconFactory, label: 'Industry', text: b.segments?.[0] ?? '' },
    { icon: IconUsers, label: 'Size', text: b.employees ? `${b.employees} people` : '' },
    { icon: IconWallet, label: 'Budget', text: budgetLabel(b.budget) },
    { icon: IconCalendar, label: 'Timeline', text: b.timeline ? timelineLabel(b.timeline) : '' },
  ]
// `was`: the old value, when an update changed it.
const facts = computed(() => {
  const before = props.previous ? factsOf(props.previous) : null
  return factsOf(props.brief ?? {})
    .map((f, i) => ({ ...f, was: before && before[i].text !== f.text ? before[i].text : '' }))
    .filter((f) => f.text)
})

const modulesLine = computed(() => scopeSentence(props.brief?.modules) || '')
const modulesWas = computed(() => {
  if (!props.previous) return ''
  const was = scopeSentence(props.previous.modules) || ''
  return was !== modulesLine.value ? was : ''
})

// How they run today, as a few sentences rather than three rows.
//
// ⚠️ THE OVERLAP IS DROPPED HERE. "Several systems that do not talk to each
// other" is an operations answer and "Systems that do not talk to each other" a
// problem, and anyone who picked the first almost always ticks the second —
// saying it once is the point of writing this as prose.
// How they run today, as lines like the section after it: the operations
// answer, then the systems they named. Lines, not a sentence, so the two
// sections read the same way and neither ends in a stop the other lacks.
//
// ⚠️ A PACK ASKS ONLY WHAT YOU USE, not the operations ladder or what to fix —
// so on a pack this is the systems line alone, and `problems` is empty.
const today = computed(() => {
  const b = props.brief ?? {}
  return [
    packs.value ? '' : operationsLabel(b.operations),
    b.apps?.length ? `${props.own ? 'You use' : 'Uses'} ${listOf(b.apps)}` : '',
  ].filter(Boolean)
})

// A pack's one free-text answer: what the sessions should focus on. Optional.
const focus = computed(() => (packs.value ? (props.brief?.focus ?? '').trim() : ''))

// What they want fixed: its own section, one symptom per line. It shared a
// paragraph with `today` behind a mid-sentence colon, which put two different
// answers — how it runs, what goes wrong — in one block you had to read to
// tell apart.
const problems = computed(() => {
  const b = props.brief ?? {}
  if (packs.value) return []
  return problemLabels(
    (b.problems ?? []).filter((p) => !(p === 'integration' && b.operations === 'disconnected')),
  )
})

const lookingForOf = (b) =>
  packs.value ? '' : criteriaSentence({ country: b?.country, segments: b?.segments }, b ?? {})
const lookingFor = computed(() => lookingForOf(props.brief))
const lookingForWas = computed(() => {
  if (!props.previous) return ''
  const was = lookingForOf(props.previous)
  return was !== lookingFor.value ? was : ''
})
</script>

<template>
  <!-- `md`, not `lg`: the text is prose now, and 448px keeps its lines under
       about 75 characters. -->
  <Dialog
    :model-value="open"
    :title="own ? 'Your requirements' : 'Requirements'"
    :actions="editable && !lockNote ? editActions : []"
    size="md"
    @update:model-value="$emit('update:open', $event)"
  >
    <!-- Default slot, not `#body-content` — the older name fails silently; see
         the note in `NewProjectDialog`. -->
    <template #default>
      <!-- No negative margin: the pinned header has a solid background, and
           content pulled up under it loses its first line. -->
      <!-- A ScrollArea, as in `PackTermsDialog`: frappe-ui's scrollbar, shown
           on scroll, in place of the browser's. -->
      <ScrollArea v-if="brief" class="fc-scroll-dialog -mr-4 sm:-mr-6" viewport-class="pr-4 sm:pr-6">
      <div class="flex flex-col gap-7">
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

        <!-- "Description", the word an update names when this text changes
             (docs/edit-requirements.md). Left out when the dialog opens from
             under the message, since there it is that message's own text. -->
        <section v-if="!packs && !omit.includes('description')" class="flex flex-col gap-2">
          <h4 class="text-base font-medium text-ink-gray-8">Description</h4>
          <p class="whitespace-pre-line text-p-base leading-relaxed text-ink-gray-6">
            {{ brief.scope }}
          </p>
        </section>

        <section v-if="!packs && modulesLine && !omit.includes('facts')" class="flex flex-col gap-2">
          <h4 class="text-base font-medium text-ink-gray-8">Modules</h4>
          <p class="text-p-base text-ink-gray-6">
            <template v-if="modulesWas"><s class="text-ink-gray-5" aria-hidden="true">{{ modulesWas }}</s>&nbsp; </template>{{ modulesLine }}<span v-if="modulesWas" class="sr-only">, was {{ modulesWas }}</span>
          </p>
        </section>

        <section v-if="today.length" class="flex flex-col gap-2">
          <h4 class="text-base font-medium text-ink-gray-8">
            {{ own ? 'How you run today' : 'How they run today' }}
          </h4>
          <ul class="flex flex-col gap-2 text-p-base text-ink-gray-6">
            <li v-for="line in today" :key="line">{{ line }}</li>
          </ul>
        </section>

        <section v-if="problems.length" class="flex flex-col gap-2">
          <h4 class="text-base font-medium text-ink-gray-8">
            {{ own ? 'What you want fixed' : 'What they want fixed' }}
          </h4>
          <ul class="flex flex-col gap-2 text-p-base text-ink-gray-6">
            <li v-for="p in problems" :key="p">{{ p }}</li>
          </ul>
        </section>

        <section v-if="focus" class="flex flex-col gap-2">
          <h4 class="text-base font-medium text-ink-gray-8">Focus for the sessions</h4>
          <p class="whitespace-pre-line text-p-base leading-relaxed text-ink-gray-6">{{ focus }}</p>
        </section>

        <section v-if="lookingFor" class="flex flex-col gap-2">
          <h4 class="text-base font-medium text-ink-gray-8">Looking for</h4>
          <p v-if="lookingForWas" class="text-p-base leading-relaxed text-ink-gray-5 line-through" aria-hidden="true">{{ lookingForWas }}</p>
          <p class="text-p-base leading-relaxed text-ink-gray-6">{{ lookingFor }}<span v-if="lookingForWas" class="sr-only">, was {{ lookingForWas }}</span></p>
        </section>
      </div>
      </ScrollArea>
    </template>
    <!-- Edit goes through `actions`, so frappe-ui lays it out: a single action
         in a `md` dialog is full width. The slot is only for the lock note. -->
    <template v-if="lockNote" #actions>
      <p class="text-p-sm text-ink-gray-6">{{ lockNote }}</p>
    </template>
  </Dialog>
</template>
