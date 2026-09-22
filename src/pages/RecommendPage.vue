<script setup>
// SCREEN — the recommendation. What the three questions were for.
//
// ⚠️ THIS IS THE PIVOT OF THE WHOLE PRODUCT. Everything before it collects
// answers; everything after it sells something. It is the only screen that
// makes a claim, so it is the only screen that has to justify one — every
// assertion here is followed by the answer it came from, and the engine is
// built so that a rule and its sentence cannot drift apart. See
// `data/recommendation.js`.
//
// ⚠️ NOT GUARDED. Someone who has answered three questions is owed the answer
// before being asked to make an account; the gate is the checkout and the
// broadcast, which are the two gestures that actually need somewhere to live.
//
// TWO HALVES, one shown at a time. The verdict picks which, and a plain link
// swaps them — an override rather than a second recommendation. A screen that
// recommends both has recommended nothing, but a screen that refuses to show
// the other one is a wall.
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, Checkbox, FormControl, Textarea, TextInput, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import FilterChip from '../components/FilterChip.vue'
import { useConnectStore } from '../stores/connect'
import { recommendationFor } from '../data/recommendation'
import { STARTER_PACKS, checkoutFor, marketFor, priceFor, DEFAULT_REGION } from '../data/packs'
import {
  TIERS,
  WORK_STYLES,
  asksCity,
  briefErrors,
  budgetBandsFor,
  matchingPartners,
} from '../data/custom'
import { INDIA_CITIES } from '../data/partners'

const store = useConnectStore()
const router = useRouter()
const route = useRoute()

// ⚠️ RECOMPUTED FROM THE ANSWERS on every visit rather than stored when it was
// first made. Someone who goes back and changes an answer has to get a
// different recommendation, and a cached verdict is how a screen ends up
// arguing for packs using a size band the visitor has since corrected.
const reco = computed(() => recommendationFor(store.company))

// Which half is showing. Starts at the verdict and can be overridden; it does
// NOT follow `reco` afterwards, because someone who has deliberately switched
// to the other path should not be snapped back by a recomputation.
const view = ref(reco.value.verdict)

// ⚠️ IS THIS STILL THE RECOMMENDATION, OR THE OVERRIDE? The screen has to know,
// because everything above the fold is a CLAIM and a claim about the path the
// visitor picked for themselves would be a lie. Overridden, the headline stops
// asserting and the evidence list is replaced by one line saying what we would
// have said. The first version left the verdict's reasons in place under the
// other path's heading, which read as the page arguing against itself.
const overridden = computed(() => view.value !== reco.value.verdict)

const region = computed(() => marketFor(store.company.country) ?? DEFAULT_REGION)

onMounted(() => {
  store.seedRecommendedPacks()
  // Coming back from sign-up with the broadcast still to do — see `send()`.
  if (route.query.send && store.signedIn) send()
})

// ── The pack half ───────────────────────────────────────────────────────────
// Every pack in the catalogue is listed, not only the recommended ones: the
// recommendation is which ones are TICKED, and hiding the rest would turn
// advice into a decision made on somebody's behalf. The unrecommended ones sit
// below, unticked, with no reason attached — the absence of a reason is the
// honest label for "nothing you told us points at this".
const rows = computed(() => {
  const reasons = Object.fromEntries(reco.value.packs.map((r) => [r.pack.value, r.reason]))
  return STARTER_PACKS.map((pack) => ({
    pack,
    reason: reasons[pack.value] ?? null,
    price: priceFor(pack, region.value),
    checked: store.packs.includes(pack.value),
  }))
})

const bill = computed(() => checkoutFor(store.packRecords(), region.value))
const nothingPicked = computed(() => store.packs.length === 0)

// ⚠️ The gate, and the only one on this screen. Paying creates a project, a
// partner assignment and a conversation — three facts about an account — so
// there has to be one. `?next=` brings them straight back to the checkout
// rather than to the top of the funnel.
const checkout = () => {
  if (nothingPicked.value) return
  if (!store.signedIn) {
    return router.push({ name: 'signup', query: { next: '/connect/checkout' } })
  }
  router.push({ name: 'checkout' })
}

// ── The custom half ─────────────────────────────────────────────────────────
// ⚠️ THE TWO MANDATORY ANSWERS ARE ASKED HERE, inline, rather than on a screen
// of their own. They are what the partner count below them is computed from —
// the budget in particular — so putting them a navigation away would mean
// showing a number derived from answers that aren't on screen. See
// `data/custom.js` for why they are mandatory at all.
const brief = computed(() => store.brief)
const tried = ref(false)
const briefProblems = computed(() => (tried.value ? briefErrors(brief.value) : {}))
const bands = computed(() => budgetBandsFor(store.company.country))

const matches = computed(() => matchingPartners(store.company, brief.value))

const toggleIn = (key, value) => {
  const list = brief.value[key]
  store.saveBrief({
    [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
  })
}

// ⚠️ THE COUNT IS THE COMMITMENT. The button names the number it is about to
// message, and the number comes from the same function the send does — see
// `broadcastBrief`. A button reading "Send requirements" with the count
// somewhere above it is how twelve firms get contacted by someone who thought
// they were contacting three.
const send = () => {
  if (Object.keys(briefErrors(brief.value)).length) {
    tried.value = true
    return
  }
  if (!store.signedIn) {
    return router.push({
      name: 'signup',
      query: { next: '/connect/recommendation?send=1' },
    })
  }
  const id = store.startCustomProject()
  const result = store.broadcastBrief(id)
  toast.success(`Sent to ${result.sent} partners`, {
    description: 'Their replies come back as quotes you can approve or pass on.',
  })
  router.push({ name: 'project', params: { id } })
}

// ── Was this right? ─────────────────────────────────────────────────────────
// ⚠️ ASKED HERE AND NOWHERE EARLIER. This is the first moment the app has made
// a claim, and the last moment before somebody spends money on it — feedback
// collected at any other point in the flow is about a form.
const note = ref('')
// ⚠️ Three states, not two: unanswered, answered-yes, and answered-no-with-a-
// field-still-open. A `no` that collapsed straight to "thanks" would throw away
// the sentence that is the entire reason for asking, and one that never
// collapsed would leave a text field sitting open forever.
const noteSent = ref(false)
const answered = computed(() => store.recoFeedback !== null)
const done = computed(() => answered.value && (store.recoFeedback.ok || noteSent.value))

const sendNote = () => {
  store.recordRecoFeedback(false, note.value)
  noteSent.value = true
}

// Changing an answer sends you back to the questions, which is where they are.
// The intake keeps its draft, so this is a genuine edit rather than a restart.
const rethink = () => router.push({ name: 'connect' })

watch(view, () => {
  tried.value = false
})
</script>

<template>
  <ConnectShell>
    <!-- 800px, the same measure as every other reading surface in the app. The
         hero is the only screen that opts out, because the map needs width. -->
    <div class="mx-auto w-full max-w-[800px] px-5 py-10 lg:px-10">
      <!-- ── The verdict ─────────────────────────────────────────────── -->
      <!-- ⚠️ NO EYEBROW. There was a tracked-out "BASED ON YOUR ANSWERS" above
           this headline, and it was redundant twice over: the two lines beneath
           it quote the answers word for word, and an all-caps label above a
           heading is the most generic device on the page. Nothing was lost by
           deleting it — the sentences underneath are the label. -->
      <h1 class="text-2xl font-semibold text-ink-gray-9">
        <!-- ⚠️ FOUR HEADLINES, not two. The recommended path asserts; the
             overridden one describes. "This needs a partner to scope it
             properly" is a judgement, and printing it over a path somebody
             chose against our advice puts our words in their mouth. -->
        {{
          view === 'packs'
            ? overridden
              ? 'Starter packs'
              : 'Start with a starter pack'
            : overridden
              ? 'Get quotes from partners'
              : 'This needs a partner to scope it properly'
        }}
      </h1>

      <!-- ⚠️ THE REASONS ARE THE HEADLINE'S EVIDENCE and they sit directly
           under it, before anything can be bought. A recommendation whose
           justification is below the price list is a price list. -->
      <!-- ⚠️ NO TICKS. Each reason carried a check icon, which reads as
           "included" — the vocabulary of a feature list. These are EVIDENCE for
           a claim, and dressing an argument as a spec sheet makes it skimmable
           in exactly the way an argument should not be. Plain sentences.
           ⚠️ `max-w-[62ch]`, against the page's own 800px. Set to the full
           measure these ran to about 110 characters a line, which is half again
           the length anybody reads comfortably. Only the PROSE is capped — the
           pack rows keep the width, because a row with a price at its right
           edge needs one. -->
      <ul v-if="!overridden" class="mt-4 max-w-[62ch] space-y-2">
        <li
          v-for="(reason, i) in reco.reasons"
          :key="i"
          class="text-p-base leading-relaxed text-ink-gray-7"
        >
          {{ reason }}
        </li>
      </ul>

      <!-- The override's one line. It says what we would have said and why,
           without repeating the argument — the visitor has read it and decided
           against it, and making them read it again is nagging. -->
      <p v-else class="mt-4 max-w-[62ch] text-p-base leading-relaxed text-ink-gray-6">
        <template v-if="view === 'packs'">
          We'd have pointed you at a scoped implementation rather than a fixed-price pack — the
          packs are ERPNext as it ships, with no custom scripting or workflows. Here they are
          anyway.
        </template>
        <template v-else>
          We'd have said a fixed-price pack covers what you described, and it would be cheaper and
          faster. Here is the scoped route anyway.
        </template>
      </p>

      <!-- ⚠️ The override reads as a question the visitor might be asking, not
           as a tab. Tabs say "these are two equal things"; this screen has just
           said they are not. -->
      <!-- ⚠️ TWO LINKS OF DIFFERENT WEIGHT, and they were joined by a middot,
           which made them peers. Changing path is a decision about what to buy;
           changing your answers is a correction. The first stays here, phrased
           as the question a doubting reader is already asking. The second moves
           to the foot of the screen, beside the other thing that belongs to the
           answers rather than to the products — "Does this look right?". -->
      <p class="mt-4 max-w-[62ch] text-p-base text-ink-gray-6">
        <template v-if="view === 'packs'">
          <template v-if="!overridden">Bigger job than that? </template>
          <button class="underline hover:text-ink-gray-8" @click="view = 'custom'">
            {{ overridden ? 'Back to what we recommend' : 'Get quotes from partners instead' }}
          </button>
        </template>
        <template v-else>
          <template v-if="!overridden">Think a fixed-price pack would do it? </template>
          <button class="underline hover:text-ink-gray-8" @click="view = 'packs'">
            {{ overridden ? 'Back to what we recommend' : 'Look at the packs anyway' }}
          </button>
        </template>
      </p>

      <!-- ── Packs ───────────────────────────────────────────────────── -->
      <section v-if="view === 'packs'" class="mt-8">
        <h2 class="text-p-lg font-semibold text-ink-gray-9">What we'd buy</h2>
        <p class="mt-1 max-w-[62ch] text-p-base text-ink-gray-6">
          Ticked already. They are separate modules, so take one, two or all three.
        </p>

        <ul class="mt-4 divide-y divide-outline-gray-2 rounded-6 border border-outline-gray-2">
          <li v-for="row in rows" :key="row.pack.value" class="flex gap-3 p-4">
            <!-- ⚠️ NO `label` ON THE CHECKBOX. The row prints the pack's name
                 itself, beside the price, and letting the control print it too
                 put every name on the screen twice. `aria-label` keeps the
                 control named for anyone who cannot see the row. -->
            <Checkbox
              class="mt-0.5"
              size="md"
              :model-value="row.checked"
              :aria-label="row.pack.name"
              @update:model-value="store.togglePack(row.pack.value)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline justify-between gap-4">
                <p class="text-p-base font-medium text-ink-gray-8">{{ row.pack.name }}</p>
                <p class="shrink-0 text-p-base font-medium tabular-nums text-ink-gray-9">
                  {{ row.price }}
                </p>
              </div>
              <!-- The per-pack why. Present only where a rule fired — see the
                   note on `rows`. -->
              <p v-if="row.reason" class="mt-1 text-p-base leading-relaxed text-ink-gray-6">
                {{ row.reason }}
              </p>
              <!-- ⚠️ The un-recommended row keeps its sentence and loses its
                   weight. It is still a real option and still says honestly why
                   it is not ticked, but at `gray-5` against the recommended
                   rows' `gray-6` the eye can take the recommendation in without
                   reading three paragraphs to find which two were argued for. -->
              <p v-else class="mt-1 text-p-base text-ink-gray-5">
                Nothing you told us points at this one.
              </p>
              <p class="mt-1 text-p-sm text-ink-gray-5">
                {{ row.pack.hours }} hours · {{ row.pack.validity }} to deliver
              </p>
            </div>
          </li>
        </ul>

        <!-- ── The total ─────────────────────────────────────────────── -->
        <!-- ⚠️ THIS PRINTED THE PACK NAMES A SECOND TIME. It was a proper
             line-item table — every pack, every price — sitting immediately
             under a list of every pack and every price. Two identical lists
             stacked, and the second one taught the reader nothing the first had
             not already said.
             The rows above ARE the line items. What only this can say is the
             number that leaves the account, so that is all it says: one figure,
             with its composition under it in a line small enough to be checked
             and ignored.
             ⚠️ The tax is NAMED here and only here before the checkout. Every
             other surface quotes a pack ex-tax and says so; this is the first
             screen with a total on it. Where a market has no decided rate the
             line drops the figure rather than inventing one — see
             `checkoutFor`. -->
        <!-- ⚠️ Hidden when the basket is empty. Unticking everything left
             "₹0 / ₹0 plus 18% GST, for 0 hours of implementation" sitting under
             the list — four zeroes stating that nothing costs nothing. The
             button below says what to do instead. -->
        <div
          v-if="!nothingPicked"
          class="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1"
        >
          <div>
            <p class="text-2xl font-semibold tabular-nums text-ink-gray-9">{{ bill.total }}</p>
            <p class="mt-0.5 text-p-sm text-ink-gray-5">
              <template v-if="bill.exact">
                {{ bill.subtotal }} plus {{ bill.taxLabel }}, for {{ bill.hours }} hours of
                implementation
              </template>
              <template v-else>
                {{ bill.subtotal }} before {{ bill.taxLabel }}, for {{ bill.hours }} hours of
                implementation
              </template>
            </p>
          </div>
          <p class="max-w-[34ch] text-p-sm leading-relaxed text-ink-gray-5">
            Paid in full to Frappe, in advance. Frappe Cloud hosting is billed separately by your
            partner.
          </p>
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-3">
          <Button
            variant="solid"
            size="md"
            :disabled="nothingPicked"
            :label="nothingPicked ? 'Pick at least one pack' : `Check out · ${bill.total}`"
            @click="checkout"
          />
          <span v-if="!store.signedIn" class="text-p-sm text-ink-gray-5">
            You'll make an account on the way through.
          </span>
        </div>
      </section>

      <!-- ── Custom ──────────────────────────────────────────────────── -->
      <section v-else class="mt-8">
        <h2 class="text-p-lg font-semibold text-ink-gray-9">What partners need from you</h2>
        <p class="mt-1 max-w-[62ch] text-p-base text-ink-gray-6">
          These two go out with your requirements. Without them the first reply from every partner
          is the same two questions, and you lose a week.
        </p>

        <div class="mt-4 max-w-[62ch] space-y-4">
          <div>
            <Textarea
              :model-value="brief.scope"
              label="What do you need built?"
              placeholder="The processes you want in ERPNext, anything that has to integrate with it, and anything that has already been tried."
              :rows="5"
              required
              :error="briefProblems.scope"
              @update:model-value="store.saveBrief({ scope: $event })"
            />
          </div>
          <!-- ⚠️ A BAND, NOT A FIGURE. See the note in `data/custom.js` — a
               free number invites a placeholder, and partners price against
               placeholders. -->
          <FormControl
            type="select"
            :model-value="brief.budget"
            label="What can you spend?"
            placeholder="Select a range"
            required
            :options="bands"
            :error="briefProblems.budget"
            @update:model-value="store.saveBrief({ budget: $event })"
          />
        </div>

        <!-- ── Narrowing ─────────────────────────────────────────────── -->
        <h2 class="mt-8 text-p-lg font-semibold text-ink-gray-9">Who should see it</h2>
        <p class="mt-1 max-w-[62ch] text-p-base text-ink-gray-6">
          Optional. Left alone, this goes to every certified partner in your region who works in
          your industry.
        </p>

        <div class="mt-4 space-y-5">
          <!-- ⚠️ INDIA ONLY, and the absence is explained rather than silent —
               see `asksCity`. -->
          <div v-if="asksCity(store.company.country)">
            <p class="text-sm text-ink-gray-7">City</p>
            <div class="mt-1.5 flex flex-wrap gap-2">
              <FilterChip
                v-for="city in INDIA_CITIES"
                :key="city"
                :label="city"
                :selected="brief.cities.includes(city)"
                @toggle="toggleIn('cities', city)"
              />
            </div>
          </div>

          <div>
            <p class="text-sm text-ink-gray-7">Partner tier</p>
            <div class="mt-1.5 flex flex-wrap gap-2">
              <FilterChip
                v-for="t in TIERS"
                :key="t.value"
                :label="t.label"
                :selected="brief.tiers.includes(t.value)"
                @toggle="toggleIn('tiers', t.value)"
              />
            </div>
          </div>

          <div>
            <p class="text-sm text-ink-gray-7">How you want to work</p>
            <div class="mt-1.5 flex flex-wrap gap-2">
              <!-- Single-select, and re-pressing clears it: "no preference" is
                   the absence of an answer rather than a third chip, because a
                   third chip would make the empty state look unanswered. -->
              <FilterChip
                v-for="w in WORK_STYLES"
                :key="w.value"
                :label="w.label"
                :selected="brief.workStyle === w.value"
                @toggle="store.saveBrief({ workStyle: brief.workStyle === w.value ? '' : w.value })"
              />
            </div>
          </div>
        </div>

        <!-- ── The count, and the send ───────────────────────────────── -->
        <div class="mt-6 rounded-6 border border-outline-gray-2 p-4">
          <p class="text-p-base text-ink-gray-8">
            <span class="font-medium tabular-nums">{{ matches.length }}</span>
            {{ matches.length === 1 ? 'partner matches' : 'partners match' }} right now.
          </p>
          <p class="mt-1 max-w-[62ch] text-p-base leading-relaxed text-ink-gray-6">
            Each one gets your requirements, your budget range and your industry — not your company
            name or contact details. Those are shared only with the partners whose replies you
            approve.
          </p>
          <div class="mt-4">
            <Button
              variant="solid"
              size="md"
              :disabled="matches.length === 0"
              :label="`Send requirements to ${matches.length} partners`"
              @click="send"
            />
          </div>
        </div>
      </section>

      <!-- ── Was this right? ─────────────────────────────────────────── -->
      <!-- ⚠️ ONE LINE, at the bottom, and it disappears once answered. It is
           the highest-value feedback in the app — the only signal that the
           engine rather than a partner got something wrong — and it is worth
           exactly one line of a screen whose job is something else. -->
      <div class="mt-10 border-t border-outline-gray-2 pt-5">
        <!-- ⚠️ "Change my answers" LIVES HERE NOW, not up beside the path
             switch. Both of these belong to the ANSWERS rather than to the
             products, and pairing a correction with a purchase decision under a
             middot made them read as two versions of the same move. -->
        <div v-if="!answered" class="flex flex-wrap items-center gap-3">
          <p class="text-p-base text-ink-gray-6">Does this look right?</p>
          <Button variant="subtle" label="Yes" @click="store.recordRecoFeedback(true)" />
          <Button variant="subtle" label="Not really" @click="store.recordRecoFeedback(false)" />
          <button
            class="ms-1 text-p-base text-ink-gray-6 underline hover:text-ink-gray-8"
            @click="rethink"
          >
            Change my answers
          </button>
        </div>
        <div v-else-if="done" class="flex flex-wrap items-center gap-3 text-p-base text-ink-gray-6">
          <span>Thanks — that helps us get the next one right.</span>
          <button class="underline hover:text-ink-gray-8" @click="rethink">Change my answers</button>
        </div>
        <div v-else class="max-w-md">
          <p class="text-p-base text-ink-gray-7">What did we miss?</p>
          <div class="mt-2 flex gap-2">
            <TextInput
              v-model="note"
              class="flex-1"
              placeholder="Anything — one line is plenty"
              @keydown.enter="sendNote"
            />
            <Button variant="subtle" label="Send" @click="sendNote" />
          </div>
        </div>
      </div>
    </div>
  </ConnectShell>
</template>
