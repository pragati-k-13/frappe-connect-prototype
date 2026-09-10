<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Badge, Button, FormControl, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PackDrawer from '../components/PackDrawer.vue'
import IconModules from '~icons/lucide/package'
import IconEffort from '~icons/lucide/hourglass'
import IconDelivery from '~icons/lucide/calendar'
import IconScope from '~icons/lucide/info'
import { STARTER_PACKS, priceFor, marketFor, DEFAULT_REGION } from '../data/packs'
import { useConnectStore } from '../stores/connect'

// SCREEN — confirm the pack and book the introductory call.
//
// The last screen of the booking flow, and where it stops: payment is mocked
// and the partner-side surfaces don't exist, so "Confirm and book call" is the
// end of what's been designed.
//
// ⚠️ TITLE COPY IS PLACEHOLDER, per the wireframe. "Confirm selection" and the
// subtitle beneath it are the drawing's words, not decided ones.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

const pack = computed(() => STARTER_PACKS.find((p) => p.value === store.pack) ?? null)

// Same market resolution as the catalogue — the country first, because sign-up
// writes only that. See `marketFor` in `data/packs.js`.
const region = computed(
  () => marketFor(store.filters.countries[0]) ?? store.answers.region[0] ?? DEFAULT_REGION,
)

const details = computed(() =>
  pack.value
    ? [
        { icon: IconModules, text: pack.value.moduleList },
        { icon: IconEffort, text: `${pack.value.hours} hrs of effort` },
        { icon: IconDelivery, text: `${pack.value.validity} delivery time` },
      ]
    : [],
)

// ⚠️ What happens between picking a pack and the work starting. Steps 2 to 4
// describe, they don't act — only the first has a control, because booking the
// call is the only thing this screen actually does.
//
// ⚠️ The partner is unnamed. "Frappe assigns you a partner" is the whole model,
// and the decision was to show who before any payment — but the wireframe names
// nobody, so nothing here invents one. See the note in the PR.
const STEPS = [
  { title: 'Pick a slot for your introductory call' },
  { title: 'Introductory call', body: 'Get acquainted with Partner' },
  { title: 'Pay in full before kickoff', body: '3x faster to get started' },
  { title: 'Co-ordinate with Partner', body: 'Share data and processes' },
]

// ⚠️ A free datetime, because that's the component asked for. Real slot booking
// offers the partner's OPEN times as a list — a picker that accepts 3am on a
// Sunday is promising something the calendar can't keep.
const slot = ref(null)

const booking = ref(false)

const confirm = () => {
  if (booking.value) return
  booking.value = true
  // ⚠️ THE SEAM, and the end of the designed flow. Payment and the partner's
  // own surfaces are next and neither exists, so this confirms and returns.
  setTimeout(() => {
    booking.value = false
    toast.success('Call booked', {
      description: 'You will get an email with the details and your partner introduction.',
    })
    router.push('/connect/packs')
  }, 900)
}

// The scope panel, addressable so Back closes it — the same contract the
// catalogue's `?pack=` has.
const scopeOpen = computed(() => route.query.scope === '1' && Boolean(pack.value))
const openScope = () => router.push({ query: { ...route.query, scope: '1' } })
const closeScope = () => {
  const { scope, ...rest } = route.query
  router.push({ query: rest })
}
</script>

<template>
  <ConnectShell root-label="Starter packs" root-to="/connect/packs" crumb="Confirm selection">
    <div class="mx-auto w-full max-w-[1100px] px-5 py-8 lg:px-10">
      <!-- No pack in the store: someone reached this by URL rather than by
           choosing. Sending them to the catalogue is the only honest answer —
           there is nothing to confirm. -->
      <div v-if="!pack" class="py-20 text-center">
        <p class="text-p-lg font-medium text-ink-gray-8">No pack selected</p>
        <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
          Pick a Starter Pack first and this is where you will confirm it.
        </p>
        <Button class="mt-4" variant="solid" label="See the packs" :route="'/connect/packs'" />
      </div>

      <div v-else class="fc-split">
        <!-- ── What you are doing ─────────────────────────────────────── -->
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold text-ink-gray-8">Confirm selection</h1>
          <p class="mt-1 text-p-base text-ink-gray-6">
            This will connect you with the ideal Partner for your needs.
          </p>

          <ol class="mt-6 space-y-5">
            <li v-for="(step, i) in STEPS" :key="step.title" class="flex items-start gap-3">
              <!-- `label` renders only its first character, so a digit needs no
                   slot of its own. Same treatment as "How it works" on the
                   catalogue, so the two numbered lists read as one device. -->
              <Avatar size="lg" :label="String(i + 1)" class="shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-base font-medium text-ink-gray-8">{{ step.title }}</p>
                <p v-if="step.body" class="mt-1 text-p-base text-ink-gray-6">{{ step.body }}</p>
                <!-- Only the first step has one. -->
                <FormControl
                  v-if="i === 0"
                  v-model="slot"
                  type="datetime"
                  size="sm"
                  class="mt-2 max-w-[320px]"
                  placeholder="Pick a slot"
                />
              </div>
            </li>
          </ol>

          <div class="mt-8 flex items-center gap-2">
            <Button
              variant="solid"
              label="Confirm and book call"
              :loading="booking"
              loading-text="Booking"
              @click="confirm"
            />
            <Button variant="subtle" label="Cancel" :route="'/connect/packs'" />
          </div>
        </div>

        <!-- ── What you are buying ────────────────────────────────────── -->
        <!-- A card here and a list row on the catalogue, deliberately: there
             the packs are being compared, so a frame around each would be four
             frames; here it is the one thing carried across from that choice,
             and the border is what says it belongs to the decision rather than
             to the steps beside it. -->
        <aside class="rounded-6 border border-outline-gray-2 p-5">
          <h2 class="text-base font-medium text-ink-gray-8">Selected service</h2>

          <!-- ⚠️ Placeholder. The illustrations land later — same grey box the
               catalogue rows use. -->
          <div class="mt-4 aspect-[16/10] w-full rounded-6 bg-surface-gray-2" aria-hidden="true" />

          <div class="mt-4 flex items-center gap-2">
            <span class="min-w-0 truncate text-lg font-medium text-ink-gray-8">
              {{ pack.name }}
            </span>
            <Badge variant="subtle" theme="gray" size="sm" label="Starter Pack" />
          </div>
          <p class="mt-1 text-p-base text-ink-gray-6">{{ pack.tagline }}</p>

          <p class="mt-4 text-lg font-semibold text-ink-gray-7">{{ priceFor(pack, region) }}</p>

          <ul class="mt-4 space-y-1">
            <li
              v-for="d in details"
              :key="d.text"
              class="flex items-start gap-2 text-p-base text-ink-gray-6"
            >
              <component :is="d.icon" class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
              <span class="min-w-0">{{ d.text }}</span>
            </li>
          </ul>

          <Button
            class="mt-5"
            variant="subtle"
            size="sm"
            label="View full scope"
            @click="openScope"
          >
            <template #prefix><IconScope class="size-4" /></template>
          </Button>
        </aside>
      </div>
    </div>

    <!-- The same panel the catalogue opens, and the same way — it pushes the
         page aside rather than covering it. `actionable="false"` drops its
         "Get started" footer: you are already doing that here. -->
    <template v-if="scopeOpen" #panel>
      <PackDrawer :pack="pack" :actionable="false" @close="closeScope" />
    </template>
  </ConnectShell>
</template>
