<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Badge, Button, TextInput, Tooltip } from 'frappe-ui'
import IconReview from '~icons/lucide/star'
import IconBook from '~icons/lucide/book-open'
import IconContact from '~icons/lucide/message-square-text'
import IconFeedback from '~icons/lucide/message-circle'
import IconExpand from '~icons/lucide/maximize-2'
import IconProject from '~icons/lucide/briefcase-business'
import IconPack from '~icons/lucide/package'
// Opens a dialog: a panel opening over the page — not a chevron (drilling
// down) and not maximize (frappe-ui's image viewer uses it for full screen).
import { isFrappe } from '../data/partners'
import { SESSIONS_PER_PACK, checkoutFor } from '../data/packs'
import { serviceOf } from '../data/project'
import { scopeSentence } from '../data/modules'
import dayjs from 'dayjs'

// The project's reference facts, beside the work: who is doing it, what it is,
// and where to get help. Nothing here is something to do — that is the page.
//
// ⚠️ ROWS APPEAR ONLY WHEN THEY HAVE AN ANSWER. Custom work has no cost or
// timeline until a quote is accepted, and a row reading "—" is a question the
// panel is asking back.
const props = defineProps({
  project: { type: Object, required: true },
  packs: { type: Array, default: () => [] },
  partner: { type: Object, default: null },
  region: { type: String, default: null },
  // Custom work's requirements as they went out, when they have. The scope
  // row opens them, the way a pack's opens its scope.
  hasBrief: { type: Boolean, default: false },
  // Offer the public review — only once the project is complete and unreviewed.
  canReview: { type: Boolean, default: false },
  // The page's time line — days left on a pack, or when it was completed —
  // `{ text, tone }`, shown under the timeline.
  when: { type: Object, default: null },
})

const emit = defineEmits(['scope', 'requirements', 'feedback', 'message', 'review', 'rename'])

// ── The header: the project's mark and name ─────────────────────────────────
// ⚠️ FRAPPE CRM'S RECORD HEADER, its contact layout: the tile the projects list
// uses (briefcase for custom work, package for packs) beside the name.
// ⚠️ THE NAME IS EDITED WHERE IT IS: click it and it becomes a field. It
// shows a fill on hover and a "Rename" tooltip, so it reads as editable; the
// separate Rename button is gone.
// ⚠️ THE NAME WRAPS, TWO LINES AT MOST. Wrapping shows real names in full;
// past two lines it would push the rail down, so it clamps — and only then
// does the tooltip carry the full name.
const mark = computed(() => (props.project.service === 'pack' ? IconPack : IconProject))
const titleEl = ref(null)
const clamped = ref(false)
const measure = () => {
  const el = titleEl.value
  clamped.value = !!el && el.scrollHeight > el.clientHeight + 1
}
let ro
onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  if (titleEl.value) ro.observe(titleEl.value)
})
onBeforeUnmount(() => ro?.disconnect())

// ── The name, edited in place ───────────────────────────────────────────────
// Rename swaps the title for a field, focused. Saved on Enter or leaving the
// field; Esc, or an empty field, puts the old name back.
const renaming = ref(false)
// The name's box, so the field that replaces it takes its height.
const nameField = ref(null)
const startRename = async () => {
  renaming.value = true
  await nextTick()
  const el = nameField.value?.querySelector('input')
  el?.focus()
  el?.select()
}
const name = ref(props.project.name)
watch(
  () => props.project.name,
  (n) => (name.value = n),
)
// ⚠️ A FLAG, NOT A RESET. Esc blurs the field, and the input hands its typed
// value back on blur — after any reset made here — so the revert is decided
// in the blur handler and applied a tick later.
let cancelled = false
const saveName = async () => {
  const next = name.value.trim()
  renaming.value = false
  if (cancelled || !next || next === props.project.name) {
    cancelled = false
    await nextTick()
    name.value = props.project.name
    return
  }
  emit('rename', next)
  await nextTick()
  if (titleEl.value) ro?.observe(titleEl.value)
  measure()
}
const revertName = (e) => {
  cancelled = true
  e.target.blur()
}

// ⚠️ HIDDEN FOR NOW: the handbook isn't ready to link to. Flip this back on
// once it is; the row is still in the template.
const SHOW_HANDBOOK = false
// Hidden for now too; flip back on to show it.
const SHOW_CONTACT = false
const HANDBOOK = 'https://frappe.io/handbook'

// ⚠️ `partner` is `FRAPPE_TEAM` on a Starter Pack: Frappe implements packs
// itself. It is not in the directory, so it has no profile to open.
const frappe = computed(() => isFrappe(props.partner))

// The accepted quote on custom work — the source of both its cost and its
// timeline.
const hired = computed(() =>
  (props.project.bids ?? []).find((b) => b.partnerId === props.project.partnerId),
)

const cost = computed(() =>
  props.packs.length
    ? checkoutFor(props.packs, props.region ?? undefined).total
    : (hired.value?.price ?? ''),
)

// ⚠️ THE LONGEST VALIDITY IN THE BASKET, the same figure the countdown runs
// against — see `windowFor`.
// A pack's timeline carries its sessions too: the days are how long the hours
// last, the sessions how the work is delivered: five, stated as a count, not
// a ceiling. ⚠️ FIVE IN ALL, however many packs: the
// sessions don't add up per pack.
const timeline = computed(() => {
  if (props.packs.length) {
    const days = Math.max(...props.packs.map((p) => p.validityDays))
    return `Up to ${days} days, ${SESSIONS_PER_PACK} sessions`
  }
  return hired.value ? `${hired.value.weeks} weeks` : ''
})

const created = computed(() =>
  new Date(props.project.at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }),
)

const scopeLine = computed(() => scopeSentence(props.project.modules))
</script>

<template>
  <div>
    <!-- CRM's contact header measures: a 62px mark, 16px to a 20px medium
         name. The row is the tile's height, and two lines of name fit inside
         it, so the field that replaces the name on Rename moves nothing. -->
    <section class="border-b border-outline-gray-1 px-5 py-5">
      <div class="flex min-h-15.5 items-center gap-4">
        <div class="grid size-15.5 shrink-0 place-items-center rounded-6 bg-surface-gray-2 text-ink-gray-5">
          <component :is="mark" class="size-6" aria-hidden="true" />
        </div>
        <div v-if="renaming" ref="nameField" class="-ml-2 min-w-0 flex-1">
          <TextInput
            v-model="name"
            aria-label="Project name"
            @keydown.enter="$event.target.blur()"
            @keydown.esc="revertName"
            @blur="saveName"
          />
        </div>
        <!-- `-mx-2 px-2`: the hover fill gets room around the text without
             moving it off the column. -->
        <Tooltip v-else :text="clamped ? project.name : 'Rename'">
          <button
            type="button"
            class="-mx-2 min-w-0 flex-1 rounded-4 px-2 py-0.5 text-left transition-colors hover:bg-surface-gray-2 focus-visible:focus-ring"
            aria-label="Rename project"
            @click="startRename"
          >
            <h2 ref="titleEl" class="line-clamp-2 text-pretty text-3xl-medium text-ink-gray-9">
              {{ project.name }}
            </h2>
          </button>
        </Tooltip>
      </div>
    </section>

    <section v-if="partner" class="border-b border-outline-gray-1 px-5 py-5">
      <!-- Who implements, what, and for how much. Who is the first row, keyed
           like the rest. -->
      <h3 class="text-base font-semibold text-ink-gray-9">Implementation</h3>
      <dl class="mt-4 grid grid-cols-[112px_minmax(0,1fr)] items-baseline gap-y-4 text-base">
        <dt class="self-center text-sm text-ink-gray-5">{{ frappe ? 'Implementer' : 'Partner' }}</dt>
        <!-- ⚠️ THE NAME IS THE WAY TO THE PROFILE, a ghost button like View
             requirements below — not a name beside a separate profile icon.
             On a pack it's Frappe, which has no profile, so it stays text.
             `-mx-2 -my-1.5` takes back the button's padding and height so the
             name sits on the value column and the row keeps the list's rhythm. -->
        <dd class="min-w-0">
          <Button
            v-if="!frappe"
            variant="ghost"
            class="-mx-2 -my-1.5 max-w-full !text-ink-gray-7"
            :label="partner.name"
            :route="{ name: 'partner', params: { id: partner.id } }"
          />
          <span v-else class="block truncate text-ink-gray-7">{{ partner.name }}</span>
        </dd>
        <template v-if="packs.length || scopeLine">
          <dt class="text-sm text-ink-gray-5">Scope of work</dt>
          <!-- ⚠️ WHAT THIS IMPLEMENTER IS DELIVERING — a partner, or Frappe
               on a pack — so it sits under them, and is where the fuller scope (modules and what is in each) will live.
               ⚠️ ONE LINK, NOT ONE PER PACK. Pack names are long and wrap in a
               112px column; the dialog it opens lists them. -->
          <!-- ⚠️ THE VALUE IS TEXT, THE WAY IN IS ITS OWN BUTTON: the packs by
               name (or count) read as a fact like the rows around them, and
               an icon-only ghost button beside it opens the scope — tooltip
               and label, like the implementer row's. `-my-0.5` takes back the
               24px button's extra height so the row keeps the list's rhythm. -->
          <dd v-if="packs.length" class="flex min-w-0 items-center gap-1 text-ink-gray-7">
            <span class="truncate">
              {{ packs.length === 1 ? packs[0].name : `${packs.length} Starter Packs` }}
            </span>
            <Tooltip text="View scope">
              <Button
                size="xs"
                variant="ghost"
                class="-my-0.5 shrink-0"
                aria-label="View scope"
                @click="emit('scope')"
              >
                <template #icon><IconExpand class="size-3.5 text-ink-gray-5" /></template>
              </Button>
            </Tooltip>
          </dd>
          <dd v-else class="text-ink-gray-7">{{ scopeLine }}</dd>
        </template>

        <template v-if="cost">
          <dt class="text-sm text-ink-gray-5">Cost</dt>
          <dd class="flex items-center gap-2 text-ink-gray-7">
            <span class="tabular-nums">{{ cost }}</span>
            <!-- A pack is paid at checkout; custom work is paid to the partner,
                 outside this product, so there is nothing to mark. -->
            <Badge v-if="packs.length" label="Paid" />
          </dd>
        </template>
        <!-- After Cost: both come from what was agreed (the quote, or the
             packs bought). -->
        <template v-if="timeline || when">
          <dt class="text-sm text-ink-gray-5">Timeline</dt>
          <dd class="text-ink-gray-7">
            <span v-if="timeline">{{ timeline }}</span>
            <span
              v-if="when && when.text !== timeline"
              class="block"
              :class="[when.tone, timeline ? 'mt-1' : '']"
            >
              {{ when.text }}
            </span>
          </dd>
        </template>
      </dl>
      <!-- The one partner action that asks for something, and only once the
           work is done — so it is a labelled button, and only then. Never on
           a pack: Frappe did the work, and there is no partner to review. -->
      <Button
        v-if="canReview"
        class="mt-3"
        variant="subtle"
        :label="`Review ${partner.name}`"
        @click="emit('review')"
      >
        <template #prefix><IconReview class="size-4" /></template>
      </Button>
    </section>

    <section class="border-b border-outline-gray-1 px-5 py-5">
      <!-- "Details", not "Project": the header above already names it. -->
      <h3 class="text-base font-semibold text-ink-gray-9">Details</h3>
      <dl class="mt-4 grid grid-cols-[112px_minmax(0,1fr)] items-baseline gap-y-4 text-base">
        <template v-if="project.service">
          <dt class="text-sm text-ink-gray-5">Service</dt>
          <dd class="text-ink-gray-7">{{ serviceOf(project.service)?.label }}</dd>
        </template>
        <!-- What the business submitted, as it went out.
             ⚠️ NOT ON A PACK: everything its requirements hold is already on
             the page — the packs in Scope of work, the company answers in the
             company task. A custom brief exists nowhere else, so it stays. -->
        <template v-if="hasBrief && !packs.length">
          <dt class="text-sm text-ink-gray-5">Requirements</dt>
          <dd class="min-w-0">
            <Button
              variant="ghost"
              size="sm"
              class="-mx-2 -my-1.5 max-w-full !text-ink-gray-7"
              label="View requirements"
              @click="emit('requirements')"
            />
            <!-- When they were last edited after going out. -->
            <p v-if="project.requirementsUpdatedAt" class="text-p-sm text-ink-gray-5">
              Updated {{ dayjs(project.requirementsUpdatedAt).format('MMM D') }}
            </p>
          </dd>
        </template>


        <dt class="text-sm text-ink-gray-5">Created</dt>
        <dd class="text-ink-gray-7">{{ created }}</dd>
      </dl>
    </section>

    <section class="px-5 py-5">
      <!-- ⚠️ "Resources" only once it holds resources. With the handbook and
           Contact Frappe hidden, the section was a heading over one feedback
           button that is not a resource. -->
      <h3 v-if="SHOW_HANDBOOK || SHOW_CONTACT" class="mb-3 text-base font-semibold text-ink-gray-9">Resources</h3>
      <div class="-ms-2 flex flex-col items-start gap-1">
        <Button v-if="SHOW_HANDBOOK" variant="ghost" label="Implementation handbook" :href="HANDBOOK">
          <template #prefix><IconBook class="size-4 text-ink-gray-6" /></template>
        </Button>
        <Button v-if="SHOW_CONTACT" variant="ghost" label="Contact Frappe" route="/contact">
          <template #prefix><IconContact class="size-4 text-ink-gray-6" /></template>
        </Button>
        <Button variant="ghost" label="Give feedback" @click="emit('feedback')">
          <template #prefix><IconFeedback class="size-4 text-ink-gray-6" /></template>
        </Button>
      </div>
    </section>
  </div>
</template>
