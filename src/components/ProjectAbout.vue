<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Avatar, Badge, Button, TextInput, Tooltip } from 'frappe-ui'
import IconProfile from '~icons/lucide/user'
import IconMessage from '~icons/lucide/message-square'
import IconReview from '~icons/lucide/star'
import IconBook from '~icons/lucide/book-open'
import IconContact from '~icons/lucide/message-square-text'
import IconHelp from '~icons/lucide/circle-help'
// Opens a dialog: a panel opening over the page — not a chevron (drilling
// down) and not maximize (frappe-ui's image viewer uses it for full screen).
import IconOpen from '~icons/lucide/panel-top-open'
import { logoFor } from '../data/logos'
import { isFrappe } from '../data/partners'
import { checkoutFor } from '../data/packs'
import { serviceOf } from '../data/project'
import { scopeSentence } from '../data/modules'

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

// ── The name, edited in place ───────────────────────────────────────────────
// ⚠️ A FIELD, NOT A MENU ITEM. The name is one of the project's facts, so it
// sits with them and edits like Frappe CRM's side panel: plain text until
// hovered, saved on Enter or leaving the field. Esc, or an empty field, puts the
// old name back. It is the only editable row, so it is the only one that
// responds to hover.
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
  if (cancelled || !next || next === props.project.name) {
    cancelled = false
    await nextTick()
    name.value = props.project.name
    return
  }
  emit('rename', next)
}
const revertName = (e) => {
  cancelled = true
  e.target.blur()
}

const HANDBOOK = 'https://frappe.io/handbook'

const logo = computed(() => (props.partner ? logoFor(props.partner.id) : null))
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
const timeline = computed(() => {
  if (props.packs.length) return `${Math.max(...props.packs.map((p) => p.validityDays))} days`
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
    <section v-if="partner" class="border-b border-outline-gray-1 px-5 py-5">
      <h3 class="text-base font-medium text-ink-gray-8">
        {{ frappe ? 'Implemented by' : 'Partner' }}
      </h3>
<!-- ⚠️ THE PARTNER'S ACTIONS SIT ON THEIR ROW: message them, or open their
           profile. The row itself is not a link — two named actions beat one
           guess about what a click on a name does. Icon-only, so each carries a
           tooltip and a label. -->
      <div class="mt-4 flex items-center gap-3">
        <Avatar
          :image="logo"
          :label="partner.name"
          size="2xl"
          shape="square"
          class="fc-logo-avatar"
        />
        <p class="min-w-0 flex-1 truncate text-base text-ink-gray-8">{{ partner.name }}</p>
        <div class="flex shrink-0 gap-1.5">
          <!-- Labelled, so no tooltip: the word says what the icon meant. -->
          <Button size="sm" variant="subtle" label="Message" @click="emit('message')">
            <template #prefix><IconMessage class="size-3.5" /></template>
          </Button>
          <Tooltip v-if="!frappe" text="View profile">
            <Button
              size="xs"
              variant="subtle"
              aria-label="View profile"
              :route="{ name: 'partner', params: { id: partner.id } }"
            >
              <template #icon><IconProfile class="size-3.5" /></template>
            </Button>
          </Tooltip>
        </div>
      </div>
      <dl
        v-if="packs.length || scopeLine || cost"
        class="mt-4 grid grid-cols-[112px_minmax(0,1fr)] gap-y-3.5 text-base"
      >
        <template v-if="packs.length || scopeLine">
          <dt class="text-ink-gray-5">Scope of work</dt>
          <!-- ⚠️ WHAT THIS IMPLEMENTER IS DELIVERING — a partner, or Frappe
               on a pack — so it sits under them, and is where the fuller scope (modules and what is in each) will live.
               ⚠️ ONE LINK, NOT ONE PER PACK. Pack names are long and wrap in a
               112px column; the dialog it opens lists them. -->
          <dd v-if="packs.length" class="min-w-0">
            <!-- A value you can open: frappe-ui's ghost Button at `sm` (its 14px
                 text matches the other values), with the overlay mark as its
                 suffix. `-mx-2 -my-1` is the one override: it pulls the
                 button's 8px padding and 28px height back so the text stays on
                 the column and the row keeps its height. -->
            <Button
              variant="ghost"
              size="sm"
              class="-mx-2 -my-1 max-w-full"
              :label="packs.length === 1 ? packs[0].name : `${packs.length} Starter Packs`"
              @click="emit('scope')"
            >
              <template #suffix><IconOpen class="size-3.5 text-ink-gray-5" /></template>
            </Button>
          </dd>
          <dd v-else class="text-ink-gray-8">{{ scopeLine }}</dd>
        </template>

        <template v-if="cost">
          <dt class="text-ink-gray-5">Cost</dt>
          <dd class="flex items-center gap-2 text-ink-gray-8">
            <span class="tabular-nums">{{ cost }}</span>
            <!-- A pack is paid at checkout; custom work is paid to the partner,
                 outside this product, so there is nothing to mark. -->
            <Badge v-if="packs.length" label="Paid" />
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
      <h3 class="text-base font-medium text-ink-gray-8">Project</h3>
      <dl class="mt-4 grid grid-cols-[112px_minmax(0,1fr)] gap-y-3.5 text-base">
        <!-- `-mx-2 -my-1.5` takes back the ghost input's padding and height,
             so its text starts on the value column and the row keeps the
             others' rhythm. -->
        <dt class="self-center text-ink-gray-5">Name</dt>
        <dd class="-mx-2 -my-1.5 min-w-0">
          <TextInput
            v-model="name"
            variant="ghost"
            aria-label="Project name"
            @keydown.enter="$event.target.blur()"
            @keydown.esc="revertName"
            @blur="saveName"
          />
        </dd>
        <template v-if="project.service">
          <dt class="text-ink-gray-5">Service</dt>
          <dd class="text-ink-gray-8">{{ serviceOf(project.service)?.label }}</dd>
        </template>
        <!-- What the business submitted, as it went out. -->
        <template v-if="hasBrief">
          <dt class="text-ink-gray-5">Requirements</dt>
          <dd class="min-w-0">
            <Button
              variant="ghost"
              size="sm"
              class="-mx-2 -my-1 max-w-full"
              label="View requirements"
              @click="emit('requirements')"
            >
              <template #suffix><IconOpen class="size-3.5 text-ink-gray-5" /></template>
            </Button>
          </dd>
        </template>

        <template v-if="timeline || when">
          <dt class="text-ink-gray-5">Timeline</dt>
          <dd class="text-ink-gray-8">
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

        <dt class="text-ink-gray-5">Created</dt>
        <dd class="text-ink-gray-8">{{ created }}</dd>
      </dl>
    </section>

    <section class="px-5 py-5">
      <h3 class="text-base font-medium text-ink-gray-8">Resources</h3>
      <div class="-ms-2 mt-3 flex flex-col items-start gap-1">
        <Button variant="ghost" label="Implementation handbook" :link="HANDBOOK">
          <template #prefix><IconBook class="size-4 text-ink-gray-6" /></template>
        </Button>
        <Button variant="ghost" label="Contact Frappe" route="/contact">
          <template #prefix><IconContact class="size-4 text-ink-gray-6" /></template>
        </Button>
        <Button variant="ghost" label="Give feedback" @click="emit('feedback')">
          <template #prefix><IconHelp class="size-4 text-ink-gray-6" /></template>
        </Button>
      </div>
    </section>
  </div>
</template>
