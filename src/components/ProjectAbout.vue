<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Badge, Button, TextInput, Tooltip } from 'frappe-ui'
import IconReview from '~icons/lucide/star'
import IconProject from '~icons/lucide/briefcase-business'
import IconPack from '~icons/lucide/package'
// Opens a dialog: a panel opening over the page — not a chevron (drilling
// down) and not maximize (frappe-ui's image viewer uses it for full screen).
import PanelSection from './PanelSection.vue'
import PanelField from './PanelField.vue'
import PanelLink from './PanelLink.vue'
import { PROJECT_APPS, isFrappe } from '../data/partners'
import { budgetLabel, timelineLabel } from '../data/custom'
import { logoFor } from '../data/logos'
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
  // The requirements as they stand, for the budget and timeline asked.
  brief: { type: Object, default: null },
  // Offer the public review — only once the project is complete and unreviewed.
  canReview: { type: Boolean, default: false },
  // The page's time line — days left on a pack, or when it was completed —
  // `{ text, tone }`, shown under the timeline.
  when: { type: Object, default: null },
})

const emit = defineEmits(['scope', 'requirements', 'message', 'review', 'rename'])

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

// ── The rest of the rail: the panel the partner side's lead and customer
// pages use, so a project reads like a record on both sides. ──────────────────
const apps = computed(() =>
  (props.project.apps ?? []).map((v) => PROJECT_APPS.find((a) => a.value === v)?.label ?? v).join(', '),
)
// What the business asked for, on custom work. A pack's is in its scope.
const asked = computed(() => {
  if (props.packs.length) return []
  const b = props.brief ?? props.project.brief ?? {}
  return [
    { label: 'Budget', value: budgetLabel(b.budget) },
    { label: 'Timeline', value: b.timeline ? timelineLabel(b.timeline) : '' },
  ].filter((r) => r.value)
})
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

    <div class="divide-y divide-outline-gray-1">
      <PanelSection v-if="partner" title="Implementation">
        <PanelField :label="frappe ? 'Implementer' : 'Partner'">
          <!-- On a pack it's Frappe, which has no profile, so it stays text. -->
          <PanelLink
            v-if="!frappe"
            :label="partner.name"
            :avatar="partner.name"
            :image="logoFor(partner.id)"
            :to="`/connect/partners/${partner.id}`"
          />
          <span v-else class="truncate px-2">{{ partner.name }}</span>
        </PanelField>
        <PanelField v-if="!frappe && partner.city" label="Location">
          <span class="truncate px-2">{{ partner.city }}</span>
        </PanelField>
        <PanelField v-if="packs.length" label="Scope">
          <PanelLink
            :label="packs.length === 1 ? packs[0].name : `${packs.length} Starter Packs`"
            icon="lucide-package"
            @click="emit('scope')"
          />
        </PanelField>
        <PanelField v-else-if="scopeLine" label="Scope">
          <span class="px-2">{{ scopeLine }}</span>
        </PanelField>
        <PanelField v-if="cost" label="Cost">
          <span class="flex items-center gap-2 px-2">
            <span class="tabular-nums">{{ cost }}</span>
            <!-- A pack is paid at checkout; custom work is paid to the partner,
                 outside this product, so there is nothing to mark. -->
            <Badge v-if="packs.length" label="Paid" />
          </span>
        </PanelField>
        <PanelField v-if="timeline || when" label="Timeline">
          <span class="px-2">
            <span v-if="timeline" class="block">{{ timeline }}</span>
            <span v-if="when && when.text !== timeline" class="block" :class="when.tone">{{ when.text }}</span>
          </span>
        </PanelField>
        <!-- Only once the work is done. Never on a pack: Frappe did the work. -->
        <div v-if="canReview" class="px-3 pt-1">
          <Button variant="subtle" :label="`Review ${partner.name}`" @click="emit('review')">
            <template #prefix><IconReview class="size-4" /></template>
          </Button>
        </div>
      </PanelSection>

      <!-- "Details", not "Project": the header above already names it. -->
      <PanelSection title="Details">
        <PanelField v-if="project.service" label="Service">
          <span class="px-2">{{ serviceOf(project.service)?.label }}</span>
        </PanelField>
        <PanelField v-if="apps" label="Apps">
          <span class="px-2">{{ apps }}</span>
        </PanelField>
        <!-- What the business asked for, on custom work. A pack's requirements
             are already on the page. -->
        <PanelField v-for="row in asked" :key="row.label" :label="row.label">
          <span class="px-2">{{ row.value }}</span>
        </PanelField>
        <PanelField v-if="hasBrief && !packs.length" label="Requirements">
          <PanelLink label="View" icon="lucide-file-text" @click="emit('requirements')" />
        </PanelField>
        <PanelField v-if="project.requirementsUpdatedAt" label="Updated">
          <span class="px-2">{{ dayjs(project.requirementsUpdatedAt).format('MMM D, YYYY') }}</span>
        </PanelField>
        <PanelField label="Created">
          <span class="px-2">{{ created }}</span>
        </PanelField>
      </PanelSection>

    </div>
  </div>
</template>
