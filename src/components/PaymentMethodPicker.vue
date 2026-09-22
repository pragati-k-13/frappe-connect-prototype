<script setup>
import { computed } from 'vue'
import IconCard from '~icons/lucide/credit-card'
import IconPhone from '~icons/lucide/smartphone'
import { PAYMENT_METHODS, methodBy } from '../data/payment'

// How you would like to pay, as a control.
//
// ⚠️ It lives in its own file because the checkout renders it in two shapes and
// neither may be a copy of the other. A returning customer gets it as the
// page's only question, under a plain heading; someone who has just signed up
// gets it as step 2 of a numbered pair, because for them it genuinely is the
// second of two things. The rows, the marks, the wording and the focus
// behaviour have to be identical in both, and two blocks of markup that are
// meant to stay identical are two blocks that will not.
const props = defineProps({
  // `v-model`. Null until something is chosen.
  modelValue: { type: String, default: null },
  // Shows the "choose one" message. The page turns this on when the pay button
  // is pressed with nothing selected — see the note on `tried` there.
  invalid: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])

const ICONS = { card: IconCard, phone: IconPhone }

const chosen = computed(() => methodBy(props.modelValue))
</script>

<template>
  <div>
    <!-- ⚠️ REAL RADIOS, visually hidden, with the row as their label: arrow
         keys move between them, the group has one tab stop, and a screen reader
         hears a radio group. A row of divs with click handlers looks identical
         and is none of those things. The focus ring rides on an overlay span
         after the input, which is what `peer-focus-visible` can reach. -->
    <fieldset>
      <legend class="sr-only">Choose a payment method</legend>
      <div class="space-y-2">
        <label
          v-for="m in PAYMENT_METHODS"
          :key="m.value"
          class="relative flex cursor-pointer items-center gap-3 rounded-5 border px-4 py-3 transition-colors"
          :class="
            modelValue === m.value
              ? 'border-outline-gray-4 bg-surface-gray-1'
              : 'border-outline-gray-2 hover:bg-surface-gray-1'
          "
        >
          <input
            type="radio"
            name="payment-method"
            class="peer sr-only"
            :value="m.value"
            :checked="modelValue === m.value"
            @change="$emit('update:modelValue', m.value)"
          />
          <span
            class="pointer-events-none absolute inset-0 rounded-5 peer-focus-visible:ring-2 peer-focus-visible:ring-outline-gray-3"
            aria-hidden="true"
          />
          <component :is="ICONS[m.icon]" class="size-4 shrink-0 text-ink-gray-7" aria-hidden="true" />
          <span class="min-w-0 flex-1 text-base text-ink-gray-8">{{ m.label }}</span>
          <!-- ⚠️ The networks in WORDS. The design prints Visa, Mastercard,
               RuPay and UPI marks here; those are trademarks, and an
               approximation drawn by hand on a checkout is worse than none —
               this is the one screen where a not-quite-right logo reads as a
               not-quite-right merchant. Swap in licensed assets and this line
               comes out. -->
          <span class="shrink-0 text-p-sm text-ink-gray-5">{{ m.networks }}</span>
        </label>
      </div>
    </fieldset>

    <p v-if="chosen?.hint" class="mt-2 text-p-sm text-ink-gray-5">{{ chosen.hint }}</p>
    <p v-if="invalid" class="mt-2 text-p-base text-ink-red-5">Choose how you'd like to pay.</p>
  </div>
</template>
