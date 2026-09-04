<script setup>
import { computed, ref } from 'vue'
import { Button, Dialog, toast } from 'frappe-ui'
// Reached for directly because frappe-ui's `Dialog` renders `message` only as
// the FALLBACK content of its default slot — so any dialog with a body of its
// own loses the description, and the underlying primitive then warns that
// `aria-describedby` is missing. This is that primitive, used as intended.
// reka-ui is frappe-ui's own dialog dependency, not a new one.
import { DialogDescription } from 'reka-ui'

// "Book a slot" — the calendar action in the profile header.
//
// Scope: this is the modal's SHAPE, not a scheduler. Real availability comes
// from the partner's calendar; here the next five working days are generated
// client-side and every slot is offered, so the layout, the two-step
// day-then-time flow, and the confirm state are all reviewable. Nothing is
// submitted — `confirm` closes and resets.
const props = defineProps({
  open: { type: Boolean, default: false },
  partner: { type: Object, required: true },
})
const emit = defineEmits(['close'])

// Next five weekdays from today. Weekends dropped because a business booking a
// discovery call with an implementation partner is booking working time.
const days = computed(() => {
  const out = []
  const d = new Date()
  while (out.length < 5) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d))
  }
  return out
})

// Fixed grid rather than invented per-day availability: a mock that greys out
// arbitrary slots invites questions about a rule that doesn't exist yet.
const TIMES = ['09:30', '10:30', '11:30', '14:00', '15:00', '16:00', '17:00']

const day = ref(null)
const time = ref(null)

const fmtDay = (d) => d.toLocaleDateString(undefined, { weekday: 'short' })
const fmtDate = (d) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
const canConfirm = computed(() => Boolean(day.value !== null && time.value))

const close = () => {
  emit('close')
  // Reset after the close transition so the panel doesn't visibly empty out.
  setTimeout(() => {
    day.value = null
    time.value = null
  }, 200)
}

// Confirming used to call the identical `close()` as Cancel, which made the two
// paths byte-identical: the panel shut either way and nothing told you which
// one had happened. `:disabled` distinguished them BEFORE the click and nothing
// distinguished them after.
//
// ⚠️ Nothing is submitted — real availability and a real request both need the
// partner's calendar. The toast is what a completed request would say, and it's
// the only thing separating confirm from abandon, so it names the slot back:
// a confirmation that repeats your choice is checkable, one that says "Done"
// isn't.
const confirm = () => {
  // Read the slot before `close()` schedules the reset, or the description is
  // built from state that's about to be nulled.
  const d = days.value[day.value]
  const when = `${fmtDay(d)} ${fmtDate(d)} at ${time.value}`
  close()
  toast.success('Slot requested', {
    description: `${props.partner.name} will confirm ${when} by email.`,
  })
}
</script>

<template>
  <Dialog
    :model-value="open"
    :title="`Book a slot with ${partner.name}`"
    size="lg"
    @update:model-value="!$event && close()"
  >
    <!-- Default slot, not `#body-content`: this version of frappe-ui's Dialog
         exposes only `default`, `title` and `actions`. `#body-content` is the
         older API and fails silently — the panel renders with its title and
         footer and an empty middle. -->
    <template #default>
      <!-- `as-child` hands the description role to this <p> rather than adding
           a wrapper element. -->
      <DialogDescription as-child>
        <p class="text-p-base text-ink-gray-6">
          A 30-minute intro call. {{ partner.name }} typically responds
          {{ partner.responds }}.
        </p>
      </DialogDescription>

      <p class="mt-5 text-p-sm font-medium text-ink-gray-7">Pick a day</p>
      <div class="mt-2 grid grid-cols-5 gap-2">
        <button
          v-for="(d, i) in days"
          :key="i"
          class="rounded-4 border px-2 py-2.5 text-center transition-colors"
          :class="
            day === i
              ? 'border-outline-gray-4 bg-surface-gray-3'
              : 'border-outline-gray-2 bg-surface-base hover:bg-surface-gray-1'
          "
          :aria-pressed="day === i"
          @click="day = i"
        >
          <span class="block text-p-xs text-ink-gray-5">{{ fmtDay(d) }}</span>
          <span class="mt-0.5 block text-p-sm font-medium text-ink-gray-8">{{ fmtDate(d) }}</span>
        </button>
      </div>

      <!-- Times only appear once a day is chosen: offering both at once asks
           for two decisions with no order, and the time depends on the day. -->
      <template v-if="day !== null">
        <p class="mt-5 text-p-sm font-medium text-ink-gray-7">Pick a time</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <Button
            v-for="t in TIMES"
            :key="t"
            :variant="time === t ? 'subtle' : 'outline'"
            :label="t"
            :aria-pressed="time === t"
            @click="time = t"
          />
        </div>
      </template>
    </template>

    <template #actions>
      <div class="flex justify-end gap-2">
        <Button variant="ghost" label="Cancel" @click="close" />
        <Button variant="solid" label="Request slot" :disabled="!canConfirm" @click="confirm" />
      </div>
    </template>
  </Dialog>
</template>
