<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Avatar, Button, Checkbox, Dialog, Textarea } from 'frappe-ui'
import TierIcon from './TierIcon.vue'
import { cityOf } from '../data/partners'
import { logoFor } from '../data/logos'

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

// ⚠️ FOUR OPTIONS AND A NOTE. It is the second of the two feedback
// moments in a project's life — the other is the rating at go-live — and what
// it buys is the only signal saying which of price, speed, profile and
// responsiveness actually decides these. That is what the comparison table
// should be sorted by and currently is not. The four stay countable; the note
// takes the reasons they don't cover.
const WHY = ['Price', 'Timeline', 'Their profile', 'How they replied']
const OTHER = 'Other'

const name = computed(() => props.partner?.name ?? 'this partner')

// ⚠️ ONE LINE A TERM, AN ICON EACH. They were a title and a sentence apiece,
// read like a contract at the moment that should feel like a step forward.
// One fact can't be cut to fit: Frappe isn't a party. It's why the terms
// exist, so it stays in the first line.
// ⚠️ FRAPPE IS NOT A PARTY is first, because it is the one a business would
// otherwise assume the opposite of.
const terms = computed(() => [
  { icon: 'lucide-wallet', text: `Pay ${name.value} directly, Frappe isn’t a party` },
  { icon: 'lucide-file-check', text: 'Scope, price and timeline are as quoted' },
  // ⚠️ HOSTING IS OPTIONAL, so the term says the choice, not one outcome.
  { icon: 'lucide-cloud', text: `Host with ${name.value}, Frappe Cloud or elsewhere` },
  { icon: 'lucide-lock', text: 'Frappe sees this project, not your site' },
  // ⚠️ Hire is on every quote, so it can be the first time this firm learns
  // who you are. Said here, only then.
  props.bid && props.bid.state !== 'shortlisted' && {
    icon: 'lucide-building-2',
    text: `${name.value} gets your company name and contact details`,
  },
].filter(Boolean))

const agreed = ref(false)
const step = ref('terms')
// Hire stays enabled: a disabled button can't say why. Pressing it without
// agreeing says so under the checkbox instead.
const needsAgreement = ref(false)
// ⚠️ PICK, THEN SEND. The chips toggle (a choice usually has more than one
// reason), and Other opens a field for what they don't cover — most people
// tap a chip and press Done, so the field isn't there until it's asked for.
// Done is the one CTA; picking nothing and pressing it is the skip.
const reasons = ref([])
const note = ref('')
watch(agreed, (v) => v && (needsAgreement.value = false))
const noteEl = ref(null)
const toggle = (w) => {
  reasons.value = reasons.value.includes(w) ? reasons.value.filter((r) => r !== w) : [...reasons.value, w]
  // Other opens the field with the cursor in it.
  if (w === OTHER && reasons.value.includes(OTHER)) nextTick(() => noteEl.value?.querySelector('textarea')?.focus())
}
const otherOn = computed(() => reasons.value.includes(OTHER))

// Reset on open, not on close: a dialog that empties while it is fading out is
// the flash this codebase has now fixed three times.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      agreed.value = false
      step.value = 'terms'
      needsAgreement.value = false
      reasons.value = []
      note.value = ''
      hiredMin.value = 0
    }
  },
)

// ⚠️ ONE SIZE FOR BOTH STEPS. The hired step is shorter than the terms, and
// the dialog shrank by 130px the moment you hired, then grew again when Other
// opened its field. Its content is now held to the height the terms left; the
// confirmation takes up the slack, so the dialog keeps its size and Other's
// field opens into space that's already there.
const termsEl = ref(null)
const hiredEl = ref(null)
const hiredMin = ref(0)
const hire = async () => {
  if (!agreed.value) {
    needsAgreement.value = true
    return
  }
  const panel = termsEl.value?.closest('.dialog-content')
  const before = panel?.offsetHeight ?? 0
  emit('hire')
  step.value = 'why'
  await nextTick()
  const short = before - (panel?.offsetHeight ?? before)
  if (short > 0 && hiredEl.value) hiredMin.value = hiredEl.value.offsetHeight + short
}

// Enabled always, like every primary here: an empty answer just closes.
const send = () => {
  const picked = reasons.value.filter((r) => r !== OTHER)
  const said = otherOn.value ? note.value.trim() : ''
  if (picked.length || said) emit('why', { reasons: picked, note: said })
  emit('update:open', false)
}
</script>

<template>
  <!-- ⚠️ "CONFIRM THE HIRE", NOT THE NAME: the card under it names the firm,
       and "Hire Tridots Tech" over "Tridots Tech" said it twice.
       ⚠️ No title on the hired step: its heading is the confirmation, centred
       under the logo, and a title above it would say the same thing. -->
  <Dialog
    :model-value="open"
    :title="step === 'terms' ? 'Confirm the hire' : ''"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- ⚠️ The DEFAULT slot, not `#body-content`: this version of frappe-ui's
         Dialog exposes only `default`, `title` and `actions`, and the older
         `#body-content` name fails silently — the dialog opens empty. -->
    <template #default>
      <div v-if="step === 'terms'" ref="termsEl">
        <!-- The deal being signed, laid out like its row in the quotes list:
             logo, name and city, the quote on the right — on a fill, the one
             card in the dialog. -->
        <div v-if="partner" class="-mx-2 -mt-1 flex items-center gap-3 rounded-6 bg-surface-gray-1 px-4 py-3">
          <Avatar
            :image="logoFor(partner.id)"
            :label="partner.name"
            size="2xl"
            shape="square"
            class="fc-logo-avatar shrink-0"
          />
          <div class="min-w-0 flex-1">
            <span class="flex items-center gap-2">
              <span class="line-clamp-2 min-w-0 text-base font-medium text-ink-gray-8">{{ partner.name }}</span>
              <TierIcon :tier="partner.tier" />
            </span>
            <span class="mt-1 block truncate text-sm text-ink-gray-6">{{ cityOf(partner) }}</span>
          </div>
          <div v-if="bid" class="shrink-0 text-right">
            <span class="block text-base font-medium tabular-nums text-ink-gray-8">{{ bid.price }}</span>
            <span class="mt-1 block text-sm tabular-nums text-ink-gray-6">{{ bid.weeks }} weeks</span>
          </div>
        </div>

        <ul class="mt-5 space-y-3 px-2">
          <li v-for="term in terms" :key="term.text" class="flex items-start gap-2 text-pretty text-base text-ink-gray-7">
            <span :class="term.icon" class="size-4 shrink-0 text-ink-gray-6" aria-hidden="true" />
            {{ term.text }}
          </li>
        </ul>

        <!-- ⚠️ NOT A CARD: space sets the agreement apart, 24px above and the
             footer's gap below. Spacing sits on a wrapper — frappe-ui's
             Checkbox passes its classes to the input too, and `py-3` on it
             stretched the box into a 26px-tall pill. -->
        <!-- ⚠️ THE ERROR IS THE LABEL, in red, on the same line. As Checkbox's
             own error it added a line and pushed Hire down 17px; hung under
             the row it overflowed the body and made it scroll. -->
        <div class="fc-agree-last mt-8 px-2">
          <Checkbox v-model="agreed" size="md" :aria-invalid="needsAgreement || undefined">
            <template #label>
              <span v-if="needsAgreement" class="text-base font-medium text-ink-red-7" role="alert">
                Agree to the terms to hire
              </span>
              <span v-else class="text-base font-medium text-ink-gray-8">I agree to these terms</span>
            </template>
          </Checkbox>
        </div>
      </div>

      <div
        v-else
        ref="hiredEl"
        class="flex flex-col"
        :style="hiredMin ? { minHeight: `${hiredMin}px` } : null"
      >
        <!-- The moment: the firm's logo, and the decision said back. It takes
             the height the terms left (`flex-1`), centred in it, so the space
             falls above and below the confirmation rather than under the
             chips — and gives way when Other opens its field. -->
        <div class="flex flex-1 flex-col items-center justify-center pb-6 pt-2 text-center">
          <Avatar
            v-if="partner"
            :image="logoFor(partner.id)"
            :label="partner.name"
            size="3xl"
            shape="square"
            class="fc-logo-avatar"
          />
          <!-- Success copy: the action, then its result. The one exclamation
               mark in the product is here — hiring is its biggest step. -->
          <h3 class="mt-3 text-xl font-semibold text-ink-gray-8">You’ve hired {{ name }}!</h3>
          <p class="mt-2 text-base text-ink-gray-6">Your project is officially underway</p>
        </div>

        <p class="text-base font-medium text-ink-gray-8">What made you choose them?</p>
        <div class="mt-3 flex flex-wrap gap-2" role="group" aria-label="Reasons">
          <!-- Selected is a check and a darker gray, never solid: Done is the
               one solid button in this dialog. -->
          <Button
            v-for="w in [...WHY, OTHER]"
            :key="w"
            :label="w"
            :icon-left="reasons.includes(w) ? 'lucide-check' : undefined"
            :class="reasons.includes(w) ? '!bg-surface-gray-4' : ''"
            :aria-pressed="reasons.includes(w)"
            @click="toggle(w)"
          />
        </div>
        <!-- A wrapper holds the ref: Textarea exposes no element to focus. -->
        <div v-if="otherOn" ref="noteEl" class="mt-3">
          <Textarea
            v-model="note"
            :rows="3"
            placeholder="What else helped you decide?"
            aria-label="What else helped you decide?"
          />
        </div>
      </div>
    </template>

    <!-- ⚠️ STACKED, FULL WIDTH, the commitment on top. The one dialog that
         does this: hiring is the biggest decision in the product. -->
    <template #actions>
      <div class="flex flex-col gap-2">
        <template v-if="step === 'terms'">
          <Button variant="solid" class="w-full" label="Hire" @click="hire" />
          <Button
            v-if="fromRequest"
            class="w-full"
            label="Decline request"
            @click="emit('decline'); emit('update:open', false)"
          />
          <Button v-else class="w-full" label="Cancel" @click="emit('update:open', false)" />
        </template>
        <!-- "Done", not "Send": one step after a hire, "Send" read as a message
             to the partner. It keeps whatever was picked, for Frappe only;
             picking nothing and pressing it is the skip. -->
        <Button v-else variant="solid" class="w-full" label="Done" @click="send" />
      </div>
    </template>
  </Dialog>
</template>
