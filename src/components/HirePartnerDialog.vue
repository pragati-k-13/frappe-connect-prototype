<script setup>
import { ref, watch } from 'vue'
import { Button, Checkbox, Dialog } from 'frappe-ui'

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
})

const emit = defineEmits(['update:open', 'hire', 'why'])

// ⚠️ ONE-TAP, FOUR OPTIONS, NO FREE TEXT. It is the second of the two feedback
// moments in a project's life — the other is the rating at go-live — and what
// it buys is the only signal saying which of price, speed, profile and
// responsiveness actually decides these. That is what the comparison table
// should be sorted by and currently is not.
const WHY = ['Price', 'Timeline', 'Their profile', 'How they replied']

const agreed = ref(false)
const step = ref('terms')

// Reset on open, not on close: a dialog that empties while it is fading out is
// the flash this codebase has now fixed three times.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      agreed.value = false
      step.value = 'terms'
    }
  },
)

const hire = () => {
  if (!agreed.value) return
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
    :title="step === 'terms' ? `Hire ${partner?.name ?? 'this partner'}` : `Why ${partner?.name ?? 'them'}?`"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- ⚠️ The DEFAULT slot, not `#body-content`: this version of frappe-ui's
         Dialog exposes only `default`, `title` and `actions`, and the older
         `#body-content` name fails silently — the dialog opens empty. Same trap
         documented in `NewProjectDialog`. -->
    <template #default>
      <template v-if="step === 'terms'">
        <p class="text-p-base leading-relaxed text-ink-gray-6">
          The scope, the price and the timeline are the ones in
          {{ partner?.name ?? 'your partner' }}'s quote. Anything beyond them is a change the two
          of you agree separately.
        </p>

        <ul class="mt-4 space-y-2 text-p-base text-ink-gray-7">
          <li>
            You pay {{ partner?.name ?? 'your partner' }} directly. Frappe takes no fee and is not
            a party to the agreement.
          </li>
          <li>
            Frappe Cloud hosting is billed to your partner through your partner code, and billed
            on to you.
          </li>
          <li>Frappe can see that this project exists, not what is in your site.</li>
        </ul>

        <div class="mt-5">
          <Checkbox v-model="agreed" size="md" label="I agree to these terms of engagement" />
        </div>

        <!-- ⚠️ THE BUTTON NAMES BOTH HALVES, because it does both: it is the
             agreement and it is the hire, and a label saying only one of them
             would hide the other behind it. -->
        <div class="mt-5 flex items-center gap-2">
          <Button
            variant="solid"
            :label="`Agree and hire ${partner?.name ?? ''}`.trim()"
            @click="hire"
          />
          <Button variant="ghost" label="Cancel" @click="emit('update:open', false)" />
        </div>
      </template>

      <template v-else>
        <p class="text-p-base leading-relaxed text-ink-gray-6">
          One tap, and it stays between you and Frappe — it tells us what actually decides these,
          which is how the replies get sorted better next time.
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <Button v-for="w in WHY" :key="w" :label="w" @click="answer(w)" />
        </div>
        <Button class="mt-4" variant="ghost" label="Skip" @click="answer(null)" />
      </template>
    </template>
  </Dialog>
</template>
