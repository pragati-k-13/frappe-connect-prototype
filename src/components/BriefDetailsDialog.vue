<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Alert, Button, Dialog, ScrollArea, dialog } from 'frappe-ui'
import RequirementsForm from './RequirementsForm.vue'
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

// ── Editing, in place ───────────────────────────────────────────────────────
// ⚠️ ONE DIALOG, TWO STATES. Edit used to close this dialog and open a second
// one titled "Edit requirements": the overlay flickered, the title changed,
// the scroll was lost, and Cancel had to reopen this one. Now Edit turns the
// body into fields, the title stays, and the footer becomes Cancel and Send.
const editing = ref(false)
const form = ref(null)
watch(
  () => props.open,
  (isOpen) => isOpen && (editing.value = false),
)
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
watch(editing, () => nextTick(() => {
  if (vp?.firstElementChild) { ro?.disconnect(); ro?.observe(vp); ro?.observe(vp.firstElementChild) }
  measure()
}))
onBeforeUnmount(unwatch)

const editActions = [{ label: 'Edit', variant: 'subtle', iconLeft: 'lucide-pencil', onClick: () => (editing.value = true) }]

// ⚠️ UNSAVED EDITS ARE ASKED ABOUT, NOT DROPPED. Cancel, ×, Esc and the overlay
// all come through here; with nothing changed they just leave.
const leave = (then) => {
  if (!form.value?.dirty) return then()
  // ⚠️ DANGER, NOT CONFIRM: discarded edits can't be got back, and the
  // destructive pattern gives that a red Discard (frappe-ui `dialog.danger`).
  dialog.danger({
    title: 'Discard changes?',
    message: 'Your edits won’t be sent, and can’t be recovered.',
    confirmLabel: 'Discard',
    size: 'sm',
    onConfirm: () => then(),
  })
}
const cancel = () => leave(() => (editing.value = false))
const onOpen = (value) => {
  if (value || !editing.value) return emit('update:open', value)
  leave(() => emit('update:open', false))
}

const send = () => {
  const result = form.value?.submit()
  if (result === false) return
  if (result) emit('saved', result)
  if (props.closeOnSave) emit('update:open', false)
  else editing.value = false
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
      text: [b.segments?.[0], b.employees ? `${b.employees} people` : ''].filter(Boolean).join(' · '),
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
  <!-- `md`, not `lg`: the text is prose now, and 448px keeps its lines under
       about 75 characters. -->
  <Dialog
    :model-value="open"
    :title="own ? 'Your requirements' : 'Requirements'"
    :actions="editable && !lockNote && projectId && !editing ? editActions : []"
    size="md"
    @update:model-value="onOpen"
  >
    <!-- Default slot, not `#body-content` — the older name fails silently; see
         the note in `NewProjectDialog`. -->
    <template #default>
      <!-- No negative margin: the pinned header has a solid background, and
           content pulled up under it loses its first line. -->
      <!-- A ScrollArea, as in `PackTermsDialog`: frappe-ui's scrollbar, shown
           on scroll, in place of the browser's. -->
      <!-- `fc-scroll-tight` while editing: the body's own 24px under the fields
           plus the footer's 16px left a 40px empty band above Cancel and Send. -->
      <ScrollArea
        v-if="brief"
        ref="scroller"
        class="fc-scroll-dialog -mr-4 sm:-mr-6"
        :class="{ 'fc-scroll-tight': editing, 'fc-scroll-more': more }"
        viewport-class="pr-4 sm:pr-6"
      >
      <!-- Editing: what Send does that the button can't say, read before the
           fields rather than found beside Send. A frappe-ui Alert; it names
           the pending hire request when there is one. -->
      <div v-if="editing" class="space-y-6">
        <Alert
          theme="blue"
          title="Partners who quoted will confirm or re-quote"
          :description="form?.requester ? `Sending declines ${form.requester.name}’s hire request. They can send a new one.` : undefined"
        />
        <RequirementsForm ref="form" :project-id="projectId" />
      </div>
      <div v-else-if="listLayout" class="flex flex-col gap-6">
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
      </ScrollArea>
    </template>
    <!-- Edit goes through `actions`, so frappe-ui lays it out: a single action
         in a `md` dialog is full width. The slot is only for the lock note. -->
    <template v-if="lockNote" #actions>
      <p class="text-p-sm text-ink-gray-6">{{ lockNote }}</p>
    </template>
    <!-- Editing: Cancel and Send. Who it goes to is on the button; it turns
         on once something has changed. -->
    <template v-else-if="editing" #actions>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" @click="cancel" />
        <!-- Disabled until a field changes: with nothing changed, Send sent
             nothing and said nothing, under a label promising 12 partners. -->
        <Button variant="solid" :label="form?.sendLabel ?? 'Send'" :disabled="!form?.dirty" @click="send" />
      </div>
    </template>
  </Dialog>
</template>
