<script setup>
import { appLabels, appsText, fixShort, industryText, setupLine, sizeShort } from '../data/format'
import ShortList from './ShortList.vue'
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { Avatar, Badge, Button, Dialog, ScrollArea, dialog, toast } from 'frappe-ui'
import { useConnectStore } from '../stores/connect'
import { appLogo } from '../data/apps'
import RequirementsFields from './RequirementsFields.vue'
import { useRequirementsDraft } from '../composables/useRequirementsDraft'
import { changedParts } from '../data/messages'
import IconBuilding from '~icons/lucide/building-2'
import IconPackage from '~icons/lucide/package'
import IconFactory from '~icons/lucide/factory'
import IconUsers from '~icons/lucide/users'
import IconWallet from '~icons/lucide/wallet'
import IconCalendar from '~icons/lucide/calendar'
import IconApps from '~icons/lucide/layout-grid'
import { budgetLabel, partnerShort, timelineLabel, timelineShort } from '../data/custom'

// Everything on a brief that is not the first thing you need from it.
//
// ⚠️ READ ONCE, TOP TO BOTTOM, by someone deciding whether to quote. So it is
// shaped as a document, not a record:
//
//   title      the project's name — what the card they opened is called
//   facts      the deciding numbers, as the card's own icon facts: who, how
//              big, what budget, when
//   scope      the one long read
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
  //   'facts'        the partner Lead page, whose side panel lists Budget,
  //                  Timeline, Apps, industry and size (the rest stay here)
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
  // The project these requirements belong to — what Edit edits.
  projectId: { type: String, default: null },
  // After Send: close (a thread, which scrolls to the new update card), or stay
  // open showing the new version (the project page).
  closeOnSave: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'saved'])

// ── Editing, section by section ─────────────────────────────────────────────
// ⚠️ ONE SECTION AT A TIME, ON ITS OWN, ONE SEND FOR ALL. A card's pencil
// swaps the cards for that section's fields at full width, titled with a back
// arrow; Done (or the arrow) returns to the cards, showing the new values.
// Every section edits one draft, and only the cards' footer sends — every
// change as one update, so partners confirm or re-quote once however many
// sections were touched. Discard there drops everything.
//
// ⚠️ SAVE OR SEND. A change to the company alone saves (to Settings, and
// quietly onto what partners have) and the button says Save; once a
// requirement changed it says Send. See `useRequirementsDraft`.
//
// It replaced fields opened inside the card, beside the others, which left the
// one being edited hard to tell from the rest; before that, one edit mode for
// the whole dialog, and sending per card.
const openCard = ref(null)
const draft = ref(null)
const editing = computed(() => !!openCard.value)
const dirty = computed(() => !!draft.value?.dirty)
const startDraft = () => (draft.value ??= reactive(useRequirementsDraft(props.projectId)))
const edit = (card) => {
  startDraft()
  openCard.value = card
}
const done = () => (openCard.value = null)
const SECTION_TITLES = { ask: 'Apps and budget', company: 'Company and setup', scope: 'What you want built' }
const reset = () => {
  openCard.value = null
  draft.value = null
}
watch(
  () => props.open,
  (isOpen) => isOpen && reset(),
)
const canEdit = computed(() => props.editable && !props.lockNote && !!props.projectId && listLayout.value)
// Each card's pencil: a ghost icon button, named for what it edits, since the
// icon alone doesn't say.
// ⚠️ SHOWN ON HOVER: hidden until the pointer is over its card, or the pencil
// has keyboard focus, so the cards read as content first. Always shown on
// touch screens, which have no hover.
const pencil = (card) => ({
  icon: 'lucide-pencil',
  size: 'sm',
  variant: 'ghost',
  class: 'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
  'aria-label': `Edit ${SECTION_TITLES[card].toLowerCase()}`,
  onClick: () => edit(card),
})
const cardClass = 'bg-surface-gray-1 dark:bg-surface-gray-2'
// ⚠️ A FADE AT THE SCROLL EDGE, only while more is below. frappe-ui's
// scrollbar shows once you scroll, so on a short window the fields were cut
// mid-field with nothing saying the form went on. Measured on scroll and
// whenever the viewport or its content changes size.
const scroller = ref(null)
const more = ref(false)
let vp = null
let ro = null
const measure = () => (more.value = !!vp && vp.scrollHeight - vp.scrollTop - vp.clientHeight > 1)
const unwatch = () => {
  vp?.removeEventListener('scroll', measure)
  ro?.disconnect()
  vp = ro = null
}
watch(
  () => scroller.value?.$el,
  async (el) => {
    unwatch()
    await nextTick()
    vp = el?.querySelector?.('[data-slot="scroll-area-viewport"]') ?? null
    if (!vp) return (more.value = false)
    vp.addEventListener('scroll', measure, { passive: true })
    ro = new ResizeObserver(measure)
    ro.observe(vp)
    if (vp.firstElementChild) ro.observe(vp.firstElementChild)
    measure()
  },
  { flush: 'post' },
)
// Each view opens at its top.
watch(openCard, () => nextTick(() => {
  if (vp) vp.scrollTop = 0
  if (vp?.firstElementChild) { ro?.disconnect(); ro?.observe(vp); ro?.observe(vp.firstElementChild) }
  measure()
}))
onBeforeUnmount(unwatch)

// ⚠️ UNSENT EDITS ARE ASKED ABOUT, NOT DROPPED. Discard, ×, Esc and the overlay
// all come through here; with nothing changed they just leave.
const leave = (then) => {
  if (!dirty.value) return then()
  // ⚠️ DANGER, NOT CONFIRM: discarded edits can't be got back, and the
  // destructive pattern gives that a red Discard (frappe-ui `dialog.danger`).
  dialog.danger({
    title: 'Discard changes?',
    message: 'Your edits won’t be saved, and can’t be recovered.',
    confirmLabel: 'Discard',
    size: 'sm',
    onConfirm: () => then(),
  })
}
const discard = () => leave(reset)
const onOpen = (value) => {
  if (value || !dirty.value) {
    if (!value) reset()
    return emit('update:open', value)
  }
  leave(() => {
    reset()
    emit('update:open', false)
  })
}

// A missing required answer opens the section it's in, with the field's
// error. Sent: the caller says so (and may close). The company alone: saved
// here, and the dialog stays on the cards.
const send = () => {
  const result = draft.value?.submit()
  if (result === false) {
    const e = draft.value.check()
    openCard.value = e.scope ? 'scope' : e.segments || e.employees ? 'company' : 'ask'
    return
  }
  reset()
  if (result.sent == null) return result.company && toast.success('Company details saved')
  emit('saved', result)
  if (props.closeOnSave) emit('update:open', false)
}

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
// ── Requirements: three cards ──────────────────────────────────────────────
// ⚠️ THREE CARDS, EACH ONE QUESTION: what they want (apps, budget, timeline,
// the partner wanted, what to fix), who they are (the company and how it runs
// today), and the details (the description, last). The bento of seven
// labelled tiles before it gave every answer the same weight and needed a
// label on each; here a label stays only where the value can't name itself
// (To fix, Today).
//
// ⚠️ BOTH SIDES. The same brief reads the same way to the business and to the
// partner, in full.
const listLayout = computed(() => !packs.value)
const store = useConnectStore()
// "Systems that do not talk" was once both a setup and a problem; the problem
// is dropped where the setup already says it.
const fixesOf = (b) => fixShort((b.problems ?? []).filter((p) => !(p === 'integration' && b.operations === 'disconnected')))
// Inside "You use …" every tool is mid-sentence, so an answer that opens with
// an article ("An in-house system", a typed "A custom costing sheet") takes a
// lowercase one. Only "A"/"An" before a lowercase word: names stay as written.
const toolNames = (apps) => apps.map((a) => a.replace(/^(An?) (?=[a-z])/, (m) => m.toLowerCase()))
// ⚠️ SHORT FORMS THROUGHOUT: two apps or industries then "+N" (the count
// shows the rest on hover; the logos and the edit form show every app), "Live
// in 3 months", "500+ people, India". The full-length card read as a wall of
// text. Everything comes from data/format.js and data/custom.js.
const setupText = (b) => {
  const { list, after } = setupLine(b.operations, b.apps)
  return list ? [list.full, after].filter(Boolean).join(', ') : after
}
const peopleText = (b) => [b.employees && `${sizeShort(b.employees)} people`, b.country].filter(Boolean).join(', ')
// Each line's text, read the same way off this version and the one it
// replaced, so a line an update changed can show its old value struck through.
const READ = {
  apps: (b) => appsText(b.projectApps).full,
  budget: (b) => budgetLabel(b.budget),
  timeline: (b) => timelineShort(b.timeline),
  partner: (b) => partnerShort({ country: b.country }, b),
  fixes: (b) => fixesOf(b).join(', '),
  people: (b) => peopleText(b),
  setup: (b) => setupText(b),
}
// What the cards draw. While a draft has changes, the draft, as plain new
// values (the footer names what changed); otherwise the version this was
// opened on, struck against the one it replaced (an update).
const shown = computed(() =>
  dirty.value ? { ...draft.value.asBrief(props.brief ?? {}, draft.value.form), ...draft.value.company } : props.brief ?? {},
)
const before = computed(() => (dirty.value ? null : props.previous))
// The footer's line, company first: "Company size and budget changed".
const changedLine = computed(() => {
  if (!dirty.value) return ''
  const d = draft.value
  const asked = d.formDirty ? changedParts(d.asBrief(props.brief ?? {}, d.initial), d.asBrief(props.brief ?? {}, d.form)) : []
  const parts = [...d.companyChanges, ...(d.formDirty && !asked.length ? ['requirements'] : asked)]
  const line = listOf(parts)
  return `${line.charAt(0).toUpperCase()}${line.slice(1)} changed`
})
const text = (key) => READ[key](shown.value)
const was = (key) => {
  if (!before.value) return ''
  const before_ = READ[key](before.value)
  return before_ !== text(key) ? before_ : ''
}
const fixes = computed(() => fixesOf(shown.value))
// ⚠️ NOTHING IS LEFT OUT OF THE CARDS. `omit: ['facts']` once dropped what the
// Lead page's side panel lists, but this dialog covers that panel while it's
// open, and the cards lost their anchors: the ask began at "Any partner tier"
// and the company card was a lone country. The facts omission now applies only
// to a pack booking's prose layout.
const hideFacts = computed(() => !listLayout.value && props.omit.includes('facts'))
const apps = computed(() => shown.value.projectApps ?? [])
// The Lead panel shows two apps by name and the rest as "+N": past two, the
// full list is only here.
const showApps = computed(() => apps.value.length && !(hideFacts.value && apps.value.length <= 2))
const askCard = computed(() => showApps.value || !hideFacts.value || fixes.value.length)
// The ask's icon rows. A globe for where the partner may be, not a pin: the pin
// is the company's own country in the card beside this one.
const askRows = computed(() =>
  [
    { icon: 'lucide-boxes', label: 'Apps', text: showApps.value ? text('apps') : '', list: appsText(apps.value), was: was('apps') },
    { icon: 'lucide-calendar', label: 'Go-live', text: hideFacts.value ? '' : text('timeline'), was: was('timeline') },
    { icon: 'lucide-globe', label: 'Partner wanted', text: text('partner'), was: was('partner') },
  ].filter((r) => r.text),
)

// Who's asking. The name only where it is known to the reader: the business's
// own, or one that went out with the requirements (`companyName`). A broadcast
// reaches partners without it.
const name = computed(() => props.companyName || (props.own ? (store.company?.name || store.viewer?.company || '') : ''))
const industries = computed(() => shown.value.segments ?? [])
// ⚠️ ONE KIND OF LINE: every fact about the company is a 14px icon row in one
// grey. Size and country share a row, and how it runs today rides on the tools
// it named ("Tally, Zoho +2, not connected").
const companyRows = computed(() => {
  const b = shown.value
  return [
    { icon: 'lucide-factory', label: 'Industry', text: industryText(industries.value).full, list: industryText(industries.value) },
    { icon: 'lucide-users', label: 'Size and country', text: text('people'), was: was('people') },
    { icon: 'lucide-wrench', label: 'How they run today', text: text('setup'), ...setupLine(b.operations, b.apps), was: was('setup') },
  ].filter((r) => r.text)
})
const companyCard = computed(() => name.value || companyRows.value.length)

// The description: two lines, then "Show more" only when it runs past them.
const clamped = ref(true)
const descEl = ref(null)
const overflows = ref(false)
const measureDesc = () => {
  const el = descEl.value
  overflows.value = !!el && el.scrollHeight - el.clientHeight > 1
}
watch(
  () => [props.open, props.brief?.scope, editing.value],
  () => {
    clamped.value = true
    nextTick(measureDesc)
  },
  { immediate: true },
)
const showDescription = computed(() => !props.omit.includes('description') && props.brief?.scope)

const factsOf = (b) => [
    { icon: IconBuilding, label: 'Company', text: props.companyName },
    { icon: IconFactory, label: 'Industry', text: industryText(b.segments).full },
    { icon: IconUsers, label: 'Size', text: b.employees ? `${b.employees} people` : '' },
    { icon: IconWallet, label: 'Budget', text: budgetLabel(b.budget) },
    { icon: IconCalendar, label: 'Timeline', text: b.timeline ? timelineLabel(b.timeline) : '' },
    { icon: IconApps, label: 'Apps', text: appLabels(b.projectApps).join(', ') },
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
  return apps.length ? [`${props.own ? 'You use' : 'Uses'} ${listOf(toolNames(apps))}`] : []
})

// A pack's one free-text answer: what the sessions should focus on. Optional.
const focus = computed(() => (packs.value ? (props.brief?.focus ?? '').trim() : ''))

</script>

<template>
  <!-- `3xl` (768px) for requirements, which are three cards; a pack
       booking's prose stays at `md`. -->
  <Dialog
    :model-value="open"
    :title="own ? 'Your requirements' : 'Requirements'"
    :actions="[]"
    :size="listLayout ? '3xl' : 'md'"
    @update:model-value="onOpen"
  >
    <!-- A section being edited: its name, with the way back to the cards. -->
    <template v-if="openCard" #title>
      <div class="flex items-center gap-2">
        <Button icon="lucide-arrow-left" variant="ghost" aria-label="Back to requirements" class="-ml-1.5" @click="done" />
        <h3 class="text-2xl-semibold leading-6 text-ink-gray-8">{{ SECTION_TITLES[openCard] }}</h3>
      </div>
    </template>
    <!-- Default slot, not `#body-content` — the older name fails silently; see
         the note in `NewProjectDialog`. -->
    <template #default>
      <!-- No negative margin: the pinned header has a solid background, and
           content pulled up under it loses its first line. -->
      <!-- A ScrollArea, as in `PackTermsDialog`: frappe-ui's scrollbar, shown
           on scroll, in place of the browser's. -->
      <!-- `fc-scroll-tight` while changes wait: the body's own 24px under the
           cards plus the footer's 16px left a 40px empty band above Send. -->
      <ScrollArea
        v-if="brief"
        ref="scroller"
        class="fc-scroll-dialog -mr-4 sm:-mr-6"
        :class="{ 'fc-scroll-tight': dirty || openCard, 'fc-scroll-more': more }"
        viewport-class="pr-4 sm:pr-6"
      >
      <!-- One section's fields, on their own, in place of the cards. -->
      <RequirementsFields v-if="openCard" :draft="draft" :section="openCard" />
      <!-- ⚠️ THREE CARDS at 768px (`3xl`): what they want (two thirds) beside
           who they are (one third), then the description. Flat grey fills, no
           borders: none is clickable. gray-2 in dark, where gray-1 is the
           dialog's own fill. A card with nothing left in it (`omit`) drops out
           and the other takes the row.
           ⚠️ THE PENCIL TAKES NO COLUMN: it sits at the right end of a row that
           is already there (the logos, the avatar), or floats into the
           description's first line. -->
      <div v-else-if="listLayout" class="grid grid-cols-1 gap-3 text-base sm:grid-cols-3">
        <!-- What they want. The budget and, beside it, the company name are the
             cards' two titles, both `text-lg` (16px). Everything else is a 14px
             icon row; the badges are their own group below. -->
        <div v-if="askCard" :class="[companyCard ? 'sm:col-span-2' : 'sm:col-span-3', cardClass]" class="group min-w-0 rounded-6 p-5">
          <div class="flex items-start justify-between gap-2" :class="showApps && 'mb-3'">
            <!-- The apps' own coloured logos, stacked like an avatar group,
                 each ringed in the card's own fill to part it from the one
                 under it; the first app sits on top. -->
            <div v-if="showApps" class="flex" aria-hidden="true">
              <Avatar
                v-for="(a, i) in apps"
                :key="a"
                size="lg"
                shape="square"
                :image="appLogo(a) ?? undefined"
                :label="appLabels([a])[0]"
                class="bg-surface-gray-1 ring-2 ring-[--surface-gray-1] dark:bg-surface-gray-2 dark:ring-[--surface-gray-2]"
                :class="i && '-ml-1.5'"
                :style="{ zIndex: apps.length - i }"
              />
            </div>
            <Button v-if="canEdit" v-bind="pencil('ask')" class="-mr-1.5 -mt-1.5 ml-auto" />
          </div>
          <p v-if="!hideFacts && text('budget')" class="text-lg font-semibold text-ink-gray-8">
          <s v-if="was('budget')" class="mr-1 font-normal text-ink-gray-5">{{ was('budget') }}</s>{{ text('budget') }}
          </p>
          <ul class="mt-1.5 flex flex-col gap-1.5 text-ink-gray-6">
            <li v-for="r in askRows" :key="r.label" class="flex min-w-0 items-start gap-2">
              <span :class="r.icon" class="mt-0.5 size-4 shrink-0 text-ink-gray-5" role="img" :aria-label="r.label" />
              <span class="text-pretty"><s v-if="r.was" class="mr-1 text-ink-gray-5">{{ r.was }}</s><template v-if="r.list"><ShortList :list="r.list" badge />{{ r.after ? `, ${r.after}` : '' }}</template><template v-else>{{ r.text }}</template></span>
            </li>
          </ul>
          <!-- What to fix: no label and no icon. Phrased as complaints ("Lost
               leads", "Slow reports"), they read as problems; set apart below
               the list so they don't look like a row missing its icon. -->
          <div v-if="fixes.length" class="mt-3.5">
            <p v-if="was('fixes')" class="mb-1.5 text-p-sm text-ink-gray-5"><s>{{ was('fixes') }}</s></p>
            <div class="flex flex-wrap gap-1">
              <Badge v-for="f in fixes" :key="f" :label="f" theme="gray" variant="subtle" size="lg" class="dark:bg-surface-gray-3" />
            </div>
          </div>
        </div>

        <!-- Who they are, and how they run today. Its pencil edits both: the
             company's industries and size, and how this project runs. -->
        <div v-if="companyCard" :class="[!askCard && 'sm:col-span-3', cardClass]" class="group min-w-0 rounded-6 p-5">
          <div v-if="name || canEdit" class="flex items-start justify-between gap-2">
            <Avatar v-if="name" size="lg" shape="square" :label="name" class="[&>*]:bg-surface-gray-3" />
            <Button v-if="canEdit" v-bind="pencil('company')" class="-mr-1.5 -mt-1.5 ml-auto" />
          </div>
          <p v-if="name" class="mt-2 truncate text-lg font-medium text-ink-gray-8" :title="name">{{ name }}</p>
          <ul v-if="companyRows.length" class="flex flex-col gap-1.5 text-ink-gray-6" :class="name && 'mt-1.5'">
            <li v-for="r in companyRows" :key="r.label" class="flex min-w-0 items-start gap-2">
              <span :class="r.icon" class="mt-0.5 size-4 shrink-0 text-ink-gray-5" role="img" :aria-label="r.label" />
              <span class="text-pretty"><s v-if="r.was" class="mr-1 text-ink-gray-5">{{ r.was }}</s><template v-if="r.list"><ShortList :list="r.list" badge />{{ r.after ? `, ${r.after}` : '' }}</template><template v-else>{{ r.text }}</template></span>
            </li>
          </ul>
        </div>

        <!-- The details: the one long read, last -->
        <div v-if="showDescription" :class="cardClass" class="group rounded-6 p-5 sm:col-span-3">
          <!-- The pencil floats INSIDE the paragraph: the line clamp makes the
               paragraph its own block, which would sit beside a float outside
               it and lose a column. Inside, only the first line wraps. -->
          <p
            ref="descEl"
            class="whitespace-pre-line text-p-base leading-relaxed text-ink-gray-6"
            :class="clamped && 'line-clamp-2'"
          ><Button v-if="canEdit" v-bind="pencil('scope')" class="float-right -mr-1.5 -mt-1.5 ml-2" />{{ shown.scope }}</p>
          <!-- Ghost, and pulled left by its own 8px padding so its label lines
               up with the text above. -->
          <Button
            v-if="overflows || !clamped"
            class="-ml-2 mt-1"
            variant="ghost"
            size="sm"
            :label="clamped ? 'Show more' : 'Show less'"
            @click="clamped = !clamped; nextTick(measureDesc)"
          />
        </div>
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
      </ScrollArea>
    </template>
    <!-- Locked: the line that says why, and no pencils. -->
    <template v-if="lockNote" #actions>
      <p class="text-p-sm text-ink-gray-6">{{ lockNote }}</p>
    </template>
    <!-- A section being edited: Done, back to the cards. Save and Send are
         only on the cards, where every change is in sight. -->
    <template v-else-if="openCard" #actions>
      <div class="flex justify-end">
        <Button label="Done" @click="done" />
      </div>
    </template>
    <!-- Changes waiting: what changed, Discard, and the one Save or Send.
         There is no footer until something has changed. -->
    <template v-else-if="dirty" #actions>
      <div class="flex items-center justify-between gap-4">
        <p class="text-p-sm text-ink-gray-6">
          {{ draft.requester && draft.formDirty ? `Sending declines ${draft.requester.name}’s hire request.` : changedLine }}
        </p>
        <div class="flex shrink-0 gap-2">
          <Button variant="ghost" label="Discard" @click="discard" />
          <Button variant="solid" :label="draft.sendLabel" @click="send" />
        </div>
      </div>
    </template>
  </Dialog>
</template>
