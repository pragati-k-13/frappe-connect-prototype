<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Button, ScrollArea, toast } from 'frappe-ui'
import IconPlus from '~icons/lucide/plus'
import ConnectShell from '../components/ConnectShell.vue'
import PackPanel from '../components/PackPanel.vue'
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

// ⚠️ The whole sequence, from this click to the work starting — not just the
// part Frappe does. Steps 5 to 7 are the CUSTOMER's, and they are lifted from
// `CUSTOMER_RESPONSIBILITIES` in the scope document rather than invented: a
// pack is fast because the buyer nominates someone, brings clean data and
// approves without delay, and finding that out after paying is the complaint
// this screen exists to prevent.
//
// ⚠️ Only the first step carries an action. Everything else describes; this
// screen does exactly two things, add project details and confirm.
//
// ⚠️ The partner is unnamed, and cannot be named: nobody is assigned until this
// screen is confirmed. "Frappe matches you" is the step, not a name.
const STEPS = [
  {
    title: 'Create and add Project details',
    body: 'This helps us understand your needs and lets you track your Project updates',
    action: 'Add Project details',
  },
  {
    title: 'Frappe matches you with a Partner based on your needs',
    body: 'Matched on your industry, your region and the modules in this pack',
  },
  {
    title: 'Schedule a discovery call to get acquainted with your Partner',
    body: 'Meet the people who would run the implementation, before any money changes hands',
  },
  { title: 'Pay in full before kickoff', body: '3x faster to get started' },
  {
    title: 'Nominate a Project Champion',
    body: 'One person on your side who can answer questions and sign things off',
  },
  { title: 'Ensure data readiness', body: 'Clean Excel or CSV data, ready to import' },
  {
    title: 'Continue with approvals and training',
    body: 'Approve internally without delay and keep your users available',
  },
]

// ⚠️ Inert, and saying so. The design greys Confirm out until this is done;
// here Confirm stays live, because the form behind this button has not been
// designed and a disabled Confirm would dead-end the only route to the screen
// after this one.
const addDetails = () =>
  toast.info('Project details are not built yet', {
    id: 'confirm',
    description: 'This is where you would describe the project for your Partner.',
  })

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
  <!-- ⚠️ `flush`: the pack panel is chrome, not a card in the page. It runs the
       full height beside the content with its own scroll, and it is the SAME
       panel the screen after this one shows — only the heading changes, from
       selected to booked. -->
  <ConnectShell flush root-label="Starter packs" root-to="/connect/packs" crumb="Confirm selection">
    <div class="flex min-h-0 min-w-0 flex-1">
      <ScrollArea class="min-h-0 min-w-0 flex-1">
        <div class="w-full px-10 py-8">
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

          <!-- ── What you are doing ───────────────────────────────────────── -->
          <div v-else class="w-full">
            <h1 class="text-lg font-semibold text-ink-gray-8">How this works</h1>
            <!-- ⚠️ Not the wireframe's subtitle, which read "This will connect
               you with the ideal Partner for your needs" — also the onboarding
               screen's line, two navigations earlier. -->
            <p class="mt-1 text-p-base text-ink-gray-6">
              Confirm, and we will assign your Partner.
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
                </div>
                <!-- The one step you can act on, and the action sits IN the step
                     rather than under the list: it belongs to that line, not to
                     the sequence. -->
                <Button
                  v-if="step.action"
                  class="shrink-0"
                  variant="subtle"
                  size="sm"
                  :label="step.action"
                  @click="addDetails"
                >
                  <template #prefix><IconPlus class="size-4" /></template>
                </Button>
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

            <!-- Below `lg` the panel stacks under the page instead of beside it.
               `-mx-5` cancels the page padding so its own rules run edge to
               edge. -->
            <div class="-mx-10 mt-8 border-t border-outline-gray-1 lg:hidden">
              <PackPanel :pack="pack" :region="region" />
            </div>
          </div>
        </div>
      </ScrollArea>

      <aside
        v-if="pack"
        class="hidden w-[360px] shrink-0 flex-col border-l border-outline-gray-1 lg:flex"
      >
        <ScrollArea class="min-h-0 flex-1">
          <PackPanel :pack="pack" :region="region" />
        </ScrollArea>
      </aside>
    </div>
  </ConnectShell>
</template>
