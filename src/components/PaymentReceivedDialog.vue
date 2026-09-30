<script setup>
import { computed } from 'vue'
import { Button, Dialog } from 'frappe-ui'

// Shown once, on arrival from payment: the moment the purchase becomes a
// project. The copy does the work — what happened, and who has it now — and
// the mark is the one flourish. The receipt itself lives on the project's
// "Pay upfront" task, so the invoice here is a convenience, not the only copy.
const props = defineProps({
  open: { type: Boolean, default: false },
  count: { type: Number, default: 1 },
  // Frappe, or the partner assigned at payment.
  implementer: { type: String, default: 'Frappe' },
})
const who = computed(() => (props.implementer === 'Frappe' ? 'Frappe’s team' : props.implementer))
const emit = defineEmits(['update:open', 'invoice'])

const heading = computed(() =>
  props.count > 1 ? 'Your Starter Packs are booked' : 'Your Starter Pack is booked',
)
</script>

<template>
  <!-- `bare`: a centred moment rather than a titled form, so it draws its own
       frame. -->
  <Dialog
    :model-value="open"
    size="sm"
    bare
    title="Payment received"
    @update:model-value="emit('update:open', $event)"
  >
    <div class="px-6 pb-6 pt-8 text-center">
      <!-- A check that draws itself on a soft green disc. Still under
           reduced motion. -->
      <div class="fc-booked mx-auto grid size-14 place-items-center rounded-full bg-surface-green-2">
        <svg viewBox="0 0 24 24" class="size-7 text-ink-green-7" fill="none" aria-hidden="true">
          <path
            class="fc-booked-check"
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <h2 class="mt-5 text-xl font-semibold text-ink-gray-8">{{ heading }}</h2>
      <p class="mx-auto mt-2 max-w-[300px] text-p-base text-ink-gray-6">
        {{ who }} has your requirements and starts once your setup is done.
      </p>

      <div class="mt-6 flex flex-col gap-2">
        <Button variant="solid" size="md" label="Done" @click="emit('update:open', false)" />
        <Button variant="subtle" size="md" label="Download invoice" @click="emit('invoice')" />
      </div>
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
