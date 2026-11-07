<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Button, Checkbox, Dialog, ErrorMessage, TextInput } from 'frappe-ui'

// Hiring a partner: the terms, then the commitment, then one question.
//
// ⚠️ THE TERMS ARE NOT A TASK AND NEVER SHOULD HAVE BEEN. They were a row in
// the "Choosing a partner" checklist, which put them AFTER the hire — you
// picked a firm, and the product then asked you to go and agree the terms of
// the engagement you had already entered. That is the wrong way round. Nobody
// hires a firm and signs afterwards; signing is what hiring IS. So the hire
// dialog is the terms dialog, and the stage that used to hold that one lonely
// checkbox now holds nothing at all — which is honest, because everything left
// in it is the replies list.
//
// ⚠️ THE CHECKBOX HERE IS NOT THE KIND THAT WAS REMOVED FROM THE TRACKER.
// Those were status — the customer asserting to the product that something had
// happened elsewhere, which is not something a product can know. This is
// CONSENT: the act itself, performed here, witnessed here. The product is not
// recording a claim about the past, it is collecting an agreement in the
// present, and that is the one thing a checkbox is genuinely for.
//
// ⚠️ FRAPPE IS NOT A PARTY TO IT, and that is the sentence this content exists
// to carry. Custom work is paid entirely to the partner; the agreement is
// between the business and the firm, and a tick collected inside Frappe's
// product could easily be read as Frappe standing behind the engagement. It
// does not, and saying so here is cheaper than explaining it later.
//
// ⚠️ TWO STEPS IN ONE DIALOG, not two dialogs. The terms gate the hire; the
// "why" cannot, because it is feedback about a decision and the decision is
// already made by the time it is asked. A second popup appearing after the
// first one closes is the pattern everybody dismisses without reading, so the
// content swaps in place and the partner is already hired behind it — dropping
// out of step two costs nothing.
const props = defineProps({
  open: { type: Boolean, default: false },
  // Kept by the page after the dialog closes so the title does not empty out
  // mid-fade. See the note on `chosen` in `ProjectPage`.
  partner: { type: Object, default: null },
  // The quote being accepted, `{ price, weeks }`, when there is one.
  bid: { type: Object, default: null },
  // Opened from the partner's hire request: the footer answers it, Decline
  // request beside Hire, and the × closes without deciding.
  fromRequest: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'hire', 'why', 'decline'])

// ⚠️ ONE-TAP, FOUR OPTIONS, THEN OTHER. It is the second of the two feedback
// moments in a project's life — the other is the rating at go-live — and what
// it buys is the only signal saying which of price, speed, profile and
// responsiveness actually decides these. That is what the comparison table
// should be sorted by and currently is not. The four stay countable; Other
// opens one line of free text for the reasons they don't cover.
const WHY = ['Price', 'Timeline', 'Their profile', 'How they replied']

const name = computed(() => props.partner?.name ?? 'this partner')

// ⚠️ FRAPPE IS NOT A PARTY is first, because it is the one a business would
// otherwise assume the opposite of.
const terms = computed(() => [
  {
    title: `Pay ${name.value} directly`,
    text: 'Frappe takes no fee and is not a party to the agreement.',
  },
  {
    title: 'Scope, price and timeline are as quoted',
    text: `Changes are agreed between you and ${name.value}.`,
  },
  {
    title: 'Hosting is billed through your partner',
    text: `Frappe Cloud bills ${name.value}, who bills you.`,
  },
  {
    title: 'Your site stays private',
    text: 'Frappe can see that this project exists, not what is in your site.',
  },
])

const agreed = ref(false)
const step = ref('terms')
// Hire stays enabled: a disabled button can't say why. Pressing it without
// agreeing says so under the checkbox instead.
const needsAgreement = ref(false)
const other = ref(false)
const otherText = ref('')
watch(agreed, (v) => v && (needsAgreement.value = false))
const otherForm = ref(null)
const pickOther = async () => {
  other.value = true
  await nextTick()
  otherForm.value?.querySelector('input')?.focus()
}

// Reset on open, not on close: a dialog that empties while it is fading out is
// the flash this codebase has now fixed three times.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      agreed.value = false
      step.value = 'terms'
      needsAgreement.value = false
      other.value = false
      otherText.value = ''
    }
  },
)

const hire = () => {
  if (!agreed.value) {
    needsAgreement.value = true
    return
  }
  emit('hire')
  step.value = 'why'
}

const answer = (why) => {
  if (why) emit('why', why)
  emit('update:open', false)
}
</script>

<template>
  <Dialog
    :model-value="open"
    :title="step === 'terms' ? `Hire ${name}` : 'What made you choose them?'"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- ⚠️ The DEFAULT slot, not `#body-content`: this version of frappe-ui's
         Dialog exposes only `default`, `title` and `actions`, and the older
         `#body-content` name fails silently — the dialog opens empty. -->
    <template #default>
      <template v-if="step === 'terms'">
        <!-- The quote being accepted, so the terms are read against it. -->
        <dl v-if="bid" class="grid grid-cols-[96px_minmax(0,1fr)] gap-y-2 text-base">
          <dt class="text-ink-gray-6">Quote</dt>
          <dd class="tabular-nums text-ink-gray-8">{{ bid.price }}</dd>
          <dt class="text-ink-gray-6">Timeline</dt>
          <dd class="text-ink-gray-8">{{ bid.weeks }} weeks</dd>
        </dl>

        <!-- ⚠️ TITLE AND DESCRIPTION PAIRS, the project's task shape. It was
             a paragraph and three sentences at one weight, so the one that
             matters — Frappe is not a party — read like the others. -->
        <ul class="space-y-4" :class="bid ? 'mt-6' : ''">
          <li v-for="term in terms" :key="term.title">
            <p class="text-base font-medium text-ink-gray-8">{{ term.title }}</p>
            <p class="mt-1 text-p-base text-ink-gray-6">{{ term.text }}</p>
          </li>
        </ul>

        <!-- Label through the slot: Checkbox fixes its own label at 13px, and
             this one is the sentence being agreed to, read with the terms. -->
        <Checkbox v-model="agreed" class="mt-6" size="md">
          <template #label>
            <span class="text-base text-ink-gray-8">I agree to these terms of engagement</span>
          </template>
        </Checkbox>
      </template>

      <template v-else>
        <div class="flex flex-wrap gap-2">
          <Button v-for="w in WHY" :key="w" :label="w" @click="answer(w)" />
          <Button label="Other" @click="pickOther" />
        </div>
        <!-- Always laid out, hidden until Other, so the dialog keeps its size. -->
        <form ref="otherForm" class="mt-4" :class="other ? '' : 'invisible'" @submit.prevent="otherText.trim() && answer(otherText.trim())">
          <TextInput
            v-model="otherText"
            size="md"
            placeholder="They already know our industry"
            aria-label="What made you choose them"
            :tabindex="other ? 0 : -1"
          />
        </form>
      </template>
    </template>

    <template #actions>
      <div class="flex items-center justify-end gap-2">
        <!-- The error sits beside Hire, in space the footer already has, so
             nothing moves when it appears. -->
        <ErrorMessage
          v-if="step === 'terms' && needsAgreement"
          class="mr-auto"
          message="Agree to the terms to hire"
        />
        <template v-if="step === 'terms'">
          <Button
            v-if="fromRequest"
            label="Decline request"
            @click="emit('decline'); emit('update:open', false)"
          />
          <Button v-else variant="ghost" label="Cancel" @click="emit('update:open', false)" />
          <Button variant="solid" label="Hire" @click="hire" />
        </template>
        <template v-else>
          <Button variant="ghost" label="Skip" @click="answer(null)" />
          <Button v-if="other" variant="solid" label="Send" :disabled="!otherText.trim()" @click="answer(otherText.trim())" />
        </template>
      </div>
    </template>
  </Dialog>
</template>
