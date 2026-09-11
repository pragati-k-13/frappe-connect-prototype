<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Button, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import SelectedServiceCard from '../components/SelectedServiceCard.vue'
import { PARTNERS } from '../data/partners'
import { STARTER_PACKS, marketFor, DEFAULT_REGION } from '../data/packs'
import { useConnectStore } from '../stores/connect'

// SCREEN — confirm the pack.
//
// The last screen of the booking flow, and where it stops: payment is mocked
// and the partner-side surfaces don't exist, so Confirm is the end of what's
// been designed. The introductory call is requested here and scheduled
// elsewhere; this screen collects no time for it.
//
// ⚠️ TITLE COPY IS PLACEHOLDER, per the wireframe: "Confirm selection" is the
// drawing's word, not a decided one. The subtitle is not the wireframe's — it
// said "This will connect you with the ideal Partner for your needs", which was
// also the onboarding screen's subtitle two navigations earlier.
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

// ⚠️ What happens between picking a pack and the work starting. Steps 2 and 3
// describe, they don't act — only the first has a control, because booking the
// call is the only thing this screen actually does.
//
// ⚠️ THREE steps, matching "How it works" on the catalogue exactly, titles and
// all. There were four: a "Pick a slot for your introductory call" step above
// "Introductory call", which listed the same call twice — once as the thing
// being arranged and once as the thing that will happen — and dressed the
// screen's own form up as a step in a sequence. The picker now sits under the
// call it books, so the catalogue's promise and this screen tell one story with
// the same numbers.
//
// ⚠️ The partner is unnamed. "Frappe assigns you a partner" is the whole model,
// and the decision was to show who before any payment — but the wireframe names
// nobody, so nothing here invents one. See the note in the PR.
const STEPS = [
  { title: 'Introductory call', body: 'Get to know your partner' },
  { title: 'Pay in full before kickoff', body: '3x faster to get started' },
  { title: 'Coordinate with partner', body: 'Share data and processes' },
]

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
    // The conversation the next screen promises. Booking is the only thing in
    // the app that opens one, so it happens here rather than on arrival: the
    // confirmed screen links to a thread that already exists.
    // ⚠️ No time. The slot picker is gone from this screen, so the call is
    // requested here and scheduled afterwards — `bookingThread` renders the
    // card without one, and the field stays in the model for the build that
    // does have a time to put in it.
    store.startBooking({ partner: assigned, pack: pack.value, slot: null })
    toast.success('Pack confirmed', {
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
          <h1 class="text-lg font-semibold text-ink-gray-8">Confirm selection</h1>
          <!-- ⚠️ Not the wireframe's subtitle, which read "This will connect
               you with the ideal Partner for your needs" — also the onboarding
               screen's line, two navigations earlier. -->
          <p class="mt-1 text-p-base text-ink-gray-6">Confirm, and we will assign your Partner.</p>

          <ol class="mt-6 space-y-5">
            <li v-for="(step, i) in STEPS" :key="step.title" class="flex items-start gap-3">
              <!-- `label` renders only its first character, so a digit needs no
                   slot of its own. Same treatment as "How it works" on the
                   catalogue, so the two numbered lists read as one device. -->
              <Avatar size="lg" :label="String(i + 1)" class="shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-base font-medium text-ink-gray-8">{{ step.title }}</p>
                <p v-if="step.body" class="mt-1 text-p-base text-ink-gray-6">{{ step.body }}</p>
              </div>
            </li>
          </ol>

          <div class="mt-8 flex items-center gap-2">
            <!-- ⚠️ "Confirm", not "Confirm and book call". Nothing here books
                 a call any more: the slot picker is gone, so the button would
                 have promised a time it does not collect. What is being
                 confirmed is on the screen and in the card beside it, and
                 Cancel sits next to it, so one word carries the whole meaning. -->
            <Button
              variant="solid"
              label="Confirm"
              :loading="booking"
              loading-text="Confirming"
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
