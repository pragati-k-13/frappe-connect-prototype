<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Button, FormControl, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import SelectedServiceCard from '../components/SelectedServiceCard.vue'
import { PARTNERS } from '../data/partners'
import { STARTER_PACKS, marketFor, DEFAULT_REGION } from '../data/packs'
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

// ⚠️ The URL is authoritative, the store is the fallback.
//
// `store.pack` is in-memory, so reading it alone meant a RELOAD of this screen
// lost the selection and showed the empty state — on a confirmation page, which
// is the one screen someone might refresh, bookmark or send to a colleague
// before committing money. `?pack=` is the same contract the catalogue's panel
// already has.
//
// The store still gets written, so the rest of the app agrees with the URL when
// someone arrives by link rather than by choosing.
const pack = computed(
  () => STARTER_PACKS.find((p) => p.value === (route.query.pack ?? store.pack)) ?? null,
)

watchEffect(() => {
  if (pack.value && store.pack !== pack.value.value) store.selectPack(pack.value.value)
})

// Same market resolution as the catalogue — the country first, because sign-up
// writes only that. See `marketFor` in `data/packs.js`.
const region = computed(
  () => marketFor(store.filters.countries[0]) ?? store.answers.region[0] ?? DEFAULT_REGION,
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
  // ⚠️ THE ASSIGNMENT, mocked. "Frappe assigns you a partner" is the whole
  // model, and this is where it happens: the best match under the answers
  // already given, which is `store.results` — the same filtered, tier-ranked
  // list the directory shows, so the assignment is at least consistent with
  // what the visitor would have seen browsing.
  //
  // A real build decides this server-side on capacity and the overlap the
  // profile brags about. Falling back to the first partner keeps the screen
  // reachable when the filters have narrowed to nothing.
  setTimeout(() => {
    booking.value = false
    const assigned = store.results[0] ?? PARTNERS[0]
    toast.success('Call booked', {
      description: `You will get an email with the details and an introduction to ${assigned.name}.`,
    })
    router.push({
      name: 'confirmed',
      query: { pack: pack.value.value, partner: assigned.id },
    })
  }, 900)
}

// The scope panel, addressable so Back closes it — the same contract the
// catalogue's `?pack=` has.
</script>

<template>
  <ConnectShell root-label="Starter packs" root-to="/connect/packs" crumb="Confirm selection">
    <!-- Full width to 1440. The card rides the page's right padding and the
         600px reading column is placed by `.fc-split`'s own left padding, so
         this cap only decides where the gutter stops growing. -->
    <div class="mx-auto w-full max-w-[1440px] px-5 py-8 lg:px-10">
      <!-- No pack in the store: someone reached this by URL rather than by
           choosing. Sending them to the catalogue is the only honest answer —
           there is nothing to confirm. -->
      <div v-if="!pack" class="py-20 text-center">
        <p class="text-p-lg font-medium text-ink-gray-8">No pack selected</p>
        <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
          This link doesn't name a pack. Pick one and this is where you'll confirm it.
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

        <SelectedServiceCard :pack="pack" :region="region" />
      </div>
    </div>
  </ConnectShell>
</template>
