<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Dialog, FormControl, MultiSelect } from 'frappe-ui'
import IconClose from '~icons/lucide/x'
import IconCircleDashed from '~icons/lucide/circle-dashed'
import IconDownload from '~icons/lucide/download'
import { APPS_OTHER, COMPANY_SIZES, CURRENT_APPS, SEGMENT_OPTIONS } from '../data/company'
import { useConnectStore } from '../stores/connect'

// Arriving on the project from payment, in two steps — and the company
// questions on their own, from the task.
//
// ⚠️ STEP 1 IS THE MOMENT AND THE MAP. Razorpay has confirmed the payment;
// this confirms the PROJECT — the check, what was bought in plain words — and
// then says what happens next, the same three things the page lists, so the
// page behind is familiar when the dialog closes. Kept short on purpose: a
// text-only step gets skimmed past.
//
// ⚠️ STEP 2 IS THE COMPANY TASK. Four questions, every one for preparing the
// sessions: size, industry, what they run today, and anything to focus on
// (optional). Nothing set-up shaped — warehouses, fiscal year — the sessions
// do those live. Opened from the task, the dialog starts here (`start: 2`) and
// has no Back.
//
// Closing without saving is allowed; the task stays open and the kickoff stays
// locked behind it (the list only lets the task in hand be done).
const props = defineProps({
  open: { type: Boolean, default: false },
  start: { type: Number, default: 1 },
  packs: { type: Array, default: () => [] },
  implementer: { type: String, default: 'Frappe' },
  // False when we already know the business (the intake asked): step 1 is
  // then the whole dialog, and its list starts at the kickoff.
  asksCompany: { type: Boolean, default: true },
})
const emit = defineEmits(['update:open', 'save', 'invoice'])
const store = useConnectStore()

const step = ref(props.start)
const who = computed(() => (props.implementer === 'Frappe' ? 'Frappe’s team' : props.implementer))
// Welcomes them to the page they've landed on; the line under it carries the
// booking, so the title orients and the line confirms.
const heading = 'Welcome to your project!'
const booked = computed(() =>
  props.packs.length > 1
    ? 'Your Starter Packs are booked. Everything for them happens here.'
    : 'Your Starter Pack is booked. Everything for it happens here.',
)
const NEXT = computed(() =>
  [
    props.asksCompany && 'Tell us about your company',
    'Schedule your kickoff call',
    'Set up Frappe Cloud',
  ].filter(Boolean),
)

const blank = () => ({
  employees: store.company.employees || '',
  segments: [...(store.company.segments ?? [])],
  apps: [...(store.company.apps ?? [])],
  appsOther: store.company.appsOther || '',
  focus: store.company.focus || '',
})
const form = reactive(blank())
const tried = ref(false)

// Fresh on every open: the dialog lives on the page and only `open` flips.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    step.value = props.start
    Object.assign(form, blank())
    tried.value = false
  },
)

const errors = computed(() => {
  if (!tried.value) return {}
  const e = {}
  if (!form.employees) e.employees = 'Select the number of employees'
  if (!form.segments.length) e.segments = 'Select at least one industry'
  if (!form.apps.length) e.apps = 'Select what you use today'
  return e
})
const save = () => {
  tried.value = true
  if (Object.keys(errors.value).length) return
  emit('save', {
    ...form,
    appsOther: form.apps.includes(APPS_OTHER) ? form.appsOther.trim() : '',
    focus: form.focus.trim(),
  })
}
const close = () => emit('update:open', false)
</script>

<template>
  <Dialog
    :model-value="open"
    size="md"
    bare
    :title="step === 1 ? heading : 'Tell us about your company'"
    @update:model-value="emit('update:open', $event)"
  >
    <div class="relative px-6 pb-6 pt-6">
      <!-- The close sits in the corner on both steps; no "Step 1 of 2" — two
           steps don't need counting, and Back says there's a way back. -->
      <Button
        variant="ghost"
        class="absolute right-4 top-4"
        :icon="IconClose"
        aria-label="Close"
        @click="close"
      />

      <!-- ── Step 1: booked, and what happens next ─────────────────────────
           ONE LEFT EDGE for everything — the mark, the heading, the list and
           the button — where it was a centred header over a left-aligned list,
           two axes in one small dialog. -->
      <div v-if="step === 1">
        <div class="fc-booked grid size-10 place-items-center rounded-full bg-surface-green-2">
          <svg viewBox="0 0 24 24" class="size-5 text-ink-green-7" fill="none" aria-hidden="true">
            <path
              class="fc-booked-check"
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h2 class="mt-4 text-xl font-semibold text-ink-gray-8">{{ heading }}</h2>
        <p class="mt-1.5 text-p-base text-ink-gray-6">{{ booked }}</p>

        <!-- ⚠️ THE PAGE'S TASKS, NOT THIS DIALOG'S STEPS: the task list's own
             dashed marks and no numbers, so the list reads as the to-do list
             behind the dialog. Numbered, over a Continue, it read as three
             screens still to come in here. -->
        <p class="mt-6 text-base font-medium text-ink-gray-8">Your next steps</p>
        <ul class="mt-3 space-y-3">
          <li v-for="(item, i) in NEXT" :key="item" class="flex items-center gap-2.5 text-p-base">
            <IconCircleDashed class="size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
            <span :class="i === 0 ? 'font-medium text-ink-gray-8' : 'text-ink-gray-7'">{{ item }}</span>
          </li>
        </ul>

        <!-- Stacked, both full width: the footer spans the dialog evenly under
             a left-aligned column, where a split row leaned to one corner. The
             next step first and solid; the invoice under it, subtle — wanted
             now (GST input credit, accounts), and it also stays on the "Pay
             upfront" task. -->
        <div class="mt-6 flex flex-col gap-2">
          <Button
            variant="solid"
            size="md"
            :label="asksCompany ? 'Tell us about your company' : 'Go to your project'"
            @click="asksCompany ? (step = 2) : close()"
          />
          <Button variant="subtle" size="md" label="Download invoice" @click="emit('invoice')">
            <template #prefix><IconDownload class="size-4" /></template>
          </Button>
        </div>
      </div>

      <!-- ── Step 2: the company questions ─────────────────────────────── -->
      <form v-else novalidate @submit.prevent="save">
        <h2 class="text-xl font-semibold text-ink-gray-8">Tell us about your company</h2>
        <p class="mt-1 text-p-base text-ink-gray-6">This helps {{ who }} prepare for your sessions.</p>

        <div class="mt-6 space-y-4">
          <FormControl
            v-model="form.employees"
            type="select"
            size="sm"
            label="Number of employees"
            placeholder="Select"
            required
            :options="COMPANY_SIZES"
            :error="errors.employees"
          />
          <MultiSelect
            v-model="form.segments"
            label="Industry"
            placeholder="Select"
            required
            :options="SEGMENT_OPTIONS"
            :error="errors.segments"
          />
          <MultiSelect
            v-model="form.apps"
            label="What do you use today?"
            placeholder="Select"
            required
            :options="CURRENT_APPS"
            :error="errors.apps"
          />
          <FormControl
            v-if="form.apps.includes(APPS_OTHER)"
            v-model="form.appsOther"
            size="sm"
            label="What else do you use?"
            placeholder="Name the software"
          />
          <FormControl
            v-model="form.focus"
            type="textarea"
            size="sm"
            :rows="3"
            label="Anything you’d like the sessions to focus on?"
            placeholder="For example, GST invoicing or tracking stock across two shops"
          />
        </div>

        <!-- Natural widths, at the right: Back, then Save. From the task
             there's no Back. -->
        <div class="mt-6 flex justify-end gap-2">
          <Button v-if="start === 1" variant="subtle" size="md" label="Back" @click="step = 1" />
          <Button type="submit" variant="solid" size="md" label="Save" />
        </div>
      </form>
    </div>
  </Dialog>
</template>

<style scoped>
.fc-booked {
  animation: fc-booked-in 320ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
.fc-booked-check {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: fc-booked-draw 360ms cubic-bezier(0.23, 1, 0.32, 1) 180ms forwards;
}
@keyframes fc-booked-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
}
@keyframes fc-booked-draw {
  to {
    stroke-dashoffset: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .fc-booked {
    animation: none;
  }
  .fc-booked-check {
    animation: none;
    stroke-dashoffset: 0;
  }
}
</style>
