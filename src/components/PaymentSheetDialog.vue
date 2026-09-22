<script setup>
import { ref, watch } from 'vue'
import { Button, Dialog } from 'frappe-ui'
// Reached for directly because frappe-ui's `Dialog` renders `message` only as
// the FALLBACK content of its default slot — so any dialog with a body of its
// own loses the description, and the underlying primitive then warns that
// `aria-describedby` is missing. reka-ui is frappe-ui's own dialog dependency,
// not a new one. Same reasoning as `BookSlotDialog` and `EstimateQuoteDialog`.
import { DialogDescription } from 'reka-ui'
import IconLock from '~icons/lucide/lock'
import { PAYMENT_MS } from '../data/payment'

// THE PROCESSOR'S SHEET, simulated.
//
// ⚠️ THIS IS NOT A PAYMENT FORM AND MUST NOT BECOME ONE. It collects nothing:
// no card number, no expiry, no CVC, no UPI id, no bank login. The real thing
// is Stripe's or Razorpay's own hosted sheet, and the whole point of that
// arrangement is that those details never touch this application — which is
// also exactly what the line under the checkout's pay button promises. A field
// added here would make that line false and would teach people to type a card
// number into a screen a prototype drew.
//
// What it does draw is the HANDOFF: who has the payment, what it is for, what
// leaves the account, and a button that takes a beat and returns. That is
// enough to review the flow either side of it, which is all this seam is for.
//
// ⚠️ It is also NOT a copy of either provider's interface. No Stripe purple, no
// Razorpay blue, no borrowed layout — the sheet is in this app's own surface
// styles and says whose it is in words. A convincing look-alike of a payment
// page is the one mock worth refusing to draw.
const props = defineProps({
  open: { type: Boolean, default: false },
  // `{ value, label, blurb }` from `PROVIDERS`.
  provider: { type: Object, required: true },
  // `{ value, label, networks }` from `PAYMENT_METHODS`.
  method: { type: Object, required: true },
  // Already formatted by `checkoutFor` — the sheet never does arithmetic. Two
  // surfaces computing the same total is how they come to disagree by a rupee.
  amount: { type: String, required: true },
  // What the money is for, named so the sheet is checkable against the page
  // that opened it.
  pack: { type: String, required: true },
})
const emit = defineEmits(['paid', 'close'])

// ⚠️ Three states, and the middle one is the reason the timer exists:
// idle → processing → done. `processing` also locks the dialog: a sheet you can
// dismiss mid-payment is the one interaction where "did that go through?" has
// no answer on screen.
const processing = ref(false)

// Reset on OPEN rather than on close, the same call the company and contact
// dialogs make: a panel that clears itself while it is animating out shows the
// reader its own state being wiped.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) processing.value = false
  },
)

const pay = () => {
  if (processing.value) return
  processing.value = true
  setTimeout(() => {
    processing.value = false
    // The caller books the pack and navigates. This component knows nothing
    // about packs, partners or projects — it is a seam, and a seam that starts
    // writing to the store is a seam that has to be understood to be replaced.
    emit('paid')
  }, PAYMENT_MS)
}

// ⚠️ Dismissible only while idle. Cancelling before you have paid is a real
// thing to want; cancelling during is a request nobody can honour, because the
// thing you would be cancelling is happening somewhere else.
const requestClose = () => {
  if (processing.value) return
  emit('close')
}
</script>

<template>
  <!-- `sm` (384px): a payment sheet is narrow everywhere it appears, and there
       are four lines in it. At `md` the rows stretch into two columns of air. -->
  <Dialog
    :model-value="open"
    :title="`Pay with ${provider.label}`"
    size="sm"
    @update:model-value="!$event && requestClose()"
  >
    <!-- ⚠️ The DEFAULT slot, not `#body-content`: this version of frappe-ui's
         Dialog renders a body slot by that name nowhere, so a panel written
         against it opens with a title and nothing under it. Same slot the other
         three dialogs in this app use. -->
    <template #default>
      <DialogDescription class="sr-only">
        A simulated {{ provider.label }} payment sheet for this prototype. Nothing is charged
        and no payment details are collected.
      </DialogDescription>

      <div class="text-p-base text-ink-gray-6">{{ provider.blurb }}</div>

      <!-- The three facts a sheet has to carry: what for, how, how much. A
           `dl` rather than three flex rows, because that is what they are —
           and the total sits last and larger, the same shape the checkout's
           own summary ends on. -->
      <dl class="mt-4 rounded-5 border border-outline-gray-2 px-4 py-3">
        <div class="flex items-baseline justify-between gap-4">
          <!-- `shrink-0`: the pack name beside it truncates, and a truncating
               cell will take every pixel it is given — which folded this label
               onto two lines to make room. -->
          <dt class="shrink-0 text-p-base text-ink-gray-6">Paying for</dt>
          <dd class="min-w-0 truncate text-p-base font-medium text-ink-gray-7">{{ pack }}</dd>
        </div>
        <div class="mt-1.5 flex items-baseline justify-between gap-4">
          <dt class="text-p-base text-ink-gray-6">Method</dt>
          <dd class="text-p-base font-medium text-ink-gray-7">{{ method.label }}</dd>
        </div>
        <!-- `items-baseline`, not `items-center`: the label is 14px and the
             figure 17px, so centring them sits the two on different baselines. -->
        <div
          class="mt-2.5 flex items-baseline justify-between gap-4 border-t border-outline-gray-2 pt-2.5"
        >
          <dt class="text-base font-medium text-ink-gray-8">Total</dt>
          <dd class="text-lg font-semibold tabular-nums text-ink-gray-8">{{ amount }}</dd>
        </div>
      </dl>

      <!-- ⚠️ No amount on the button, matching the checkout's own rule: the
           figure is one line above it and a button repeating it is a second
           place for the same number to be wrong. "Pay now" rather than "Pay",
           because the sheet's title already says who is being paid. -->
      <Button
        class="mt-4 w-full"
        variant="solid"
        label="Pay now"
        :loading="processing"
        loading-text="Processing"
        @click="pay"
      />

      <p class="mt-3 flex items-start gap-1.5 text-p-sm text-ink-gray-5">
        <IconLock class="mt-0.5 size-3.5 shrink-0" />
        <span>
          Simulated for this prototype. Nothing is charged, and no card, UPI or bank details are
          collected here or anywhere in this app.
        </span>
      </p>
    </template>
  </Dialog>
</template>
