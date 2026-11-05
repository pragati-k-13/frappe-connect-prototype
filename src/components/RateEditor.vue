<script setup>
import { computed, ref } from 'vue'
import { Button, Popover, Slider, Switch, TextInput } from 'frappe-ui'
import { PARTNERS } from '../data/partners'
import { REGIONS } from '../data/quiz'

// The partner's hourly rate, edited in a popover anchored to the value: a
// slider in dollars an hour, a switch to keep it off the profile ("Undisclosed"
// instead), and where the rate sits among other partners' published rates, so
// a firm can tell whether it's at the high or low end before publishing.
//
// The comparison is the firm's country, or its region when the country has
// fewer than five published rates: below that, a dot is close to naming a
// firm. Undisclosed rates are left out, no names are shown, and it's only ever
// shown here, never on the profile.
// ⚠️ The rates it compares against are the invented ones in `data/partners.js`.
const props = defineProps({
  partner: { type: Object, required: true },
})
const emit = defineEmits(['publish'])

const MIN = 20
const MAX = 200
const MIN_PEERS = 5

const open = ref(false)
const value = ref([60])
const show = ref(true)
function onOpen(v) {
  open.value = v
  if (!v) return
  value.value = [props.partner.rate ?? 60]
  show.value = Boolean(props.partner.rate)
}
// The number field and the slider edit the same value. Typing only moves the
// slider once the number is in range, so "5" on the way to "50" doesn't jump
// it to the minimum; leaving the field clamps it.
const clamp = (n) => Math.min(MAX, Math.max(MIN, Math.round(n)))
const typed = computed({
  get: () => String(value.value[0]),
  set: (v) => {
    const n = Number(v)
    if (v !== '' && n >= MIN && n <= MAX) value.value = [Math.round(n)]
  },
})
function settle(e) {
  const n = Number(e.target.value)
  value.value = [clamp(Number.isFinite(n) && e.target.value !== '' ? n : value.value[0])]
  e.target.value = value.value[0]
}
function publish() {
  emit('publish', show.value ? value.value[0] : null)
  open.value = false
}

// ── Where it sits ───────────────────────────────────────────────────────────
const countryOf = (p) => p.city?.split(',').pop().trim()
const country = computed(() => countryOf(props.partner))
const others = PARTNERS.filter((p) => p.rate && p.id !== props.partner.id)
const peers = computed(() => {
  const local = others.filter((p) => countryOf(p) === country.value)
  if (local.length >= MIN_PEERS) return { label: country.value, rates: local.map((p) => p.rate) }
  const region = REGIONS.find((r) => r.countries.includes(country.value))
  const near = region ? others.filter((p) => region.countries.includes(countryOf(p))) : []
  return near.length >= MIN_PEERS ? { label: region.label, rates: near.map((p) => p.rate) } : null
})
const sorted = computed(() => [...(peers.value?.rates ?? [])].sort((a, b) => a - b))
// The middle half of the market: the "Most charge" range.
const quantile = (q) => {
  const s = sorted.value
  const i = (s.length - 1) * q
  return Math.round(s[Math.floor(i)] + (s[Math.ceil(i)] - s[Math.floor(i)]) * (i % 1))
}
const band = computed(() => (peers.value ? [quantile(0.25), quantile(0.75)] : null))
const standing = computed(() => {
  if (!peers.value) return ''
  const n = sorted.value.length
  const rate = value.value[0]
  const below = sorted.value.filter((r) => r < rate).length
  const above = sorted.value.filter((r) => r > rate).length
  if (below === n) return `Higher than all ${n} partners in ${peers.value.label}`
  if (above === n) return `Lower than all ${n} partners in ${peers.value.label}`
  return `Higher than ${below} of ${n} partners in ${peers.value.label}`
})
</script>

<template>
  <Popover :open="open" side="bottom" align="start" @update:open="onOpen">
    <template #trigger>
      <!-- A gray field with a chevron, like the card's other editable values.
           It stays filled darker while the popover is open. -->
      <button
        type="button"
        class="flex min-h-7 w-full items-center justify-between gap-2 rounded-4 bg-surface-gray-2 px-2 py-1 text-left text-p-base tabular-nums text-ink-gray-8 transition-colors hover:bg-surface-gray-3 focus-visible:focus-ring data-[state=open]:bg-surface-gray-3"
        aria-label="Edit rate"
      >
        <span>
          <template v-if="partner.rate">From ${{ partner.rate }}/hr</template>
          <span v-else class="text-ink-gray-5">Undisclosed</span>
        </span>
        <span class="lucide-chevron-down size-4 shrink-0 text-ink-gray-4" aria-hidden="true" />
      </button>
    </template>
    <template #default>
      <div class="w-80 space-y-4 p-3">
        <div>
          <TextInput
            v-model="typed"
            type="number"
            size="md"
            :min="MIN"
            :max="MAX"
            :disabled="!show"
            class="w-32 tabular-nums [&_input::-webkit-inner-spin-button]:appearance-none [&_input]:[appearance:textfield]"
            aria-label="Hourly rate in dollars"
            @blur="settle"
            @keydown.enter="settle"
          >
            <template #prefix><span class="text-base text-ink-gray-5">$</span></template>
            <template #suffix><span class="text-base text-ink-gray-5">/hr</span></template>
          </TextInput>
          <Slider v-model="value" class="mt-4" :min="MIN" :max="MAX" :step="1" :disabled="!show" aria-label="Hourly rate slider" />
          <div class="mt-1 flex justify-between text-sm text-ink-gray-5">
            <span>${{ MIN }}</span>
            <span>${{ MAX }}</span>
          </div>
        </div>

        <div v-if="peers">
          <p class="text-base text-ink-gray-8">{{ standing }}</p>
          <p class="mt-1 text-sm text-ink-gray-5">Most charge ${{ band[0] }} to ${{ band[1] }}</p>
        </div>

        <Switch v-model="show" label="Show on your profile" />

        <div class="flex justify-end gap-2">
          <Button label="Cancel" @click="open = false" />
          <Button variant="solid" label="Done" @click="publish" />
        </div>
      </div>
    </template>
  </Popover>
</template>
