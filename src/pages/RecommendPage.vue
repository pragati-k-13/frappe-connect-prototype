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
import EditAnswersDialog from '../components/EditAnswersDialog.vue'
import PartnerFiltersDialog from '../components/PartnerFiltersDialog.vue'
import { useConnectStore } from '../stores/connect'
import { recommendationFor } from '../data/recommendation'
import {
  PACK_STEPS,
  PACK_WONT_COVER,
  STARTER_PACKS,
  checkoutFor,
  marketFor,
  priceFor,
  DEFAULT_REGION,
} from '../data/packs'
import { briefErrors, budgetBandsFor, matchingPartners } from '../data/custom'
import { INDUSTRIES, GROUP_OF_SEGMENT, REGIONS, REGION_OF } from '../data/quiz'

const store = useConnectStore()
const router = useRouter()
const route = useRoute()

// Where the app is mounted — '/' locally, '/frappe-connect-prototype/' on
// GitHub Pages. Only the hand-written link out to the marketing site needs it;
// everything else here goes through the router.
const baseUrl = import.meta.env.BASE_URL

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

// ⚠️ THE REACH IS STATED AS A FACT, not implied by a control. "6 partners match
// right now" left the reader to work out what the criteria were from the filter
// chips above it; this names them — the region and the industry — so the
// sentence is complete without anything being opened.
const reachLine = computed(() => {
  const region = REGIONS.find((r) => r.value === REGION_OF[store.company.country])
  const group = INDUSTRIES.find((i) => i.value === GROUP_OF_SEGMENT[store.company.segments?.[0]])
  const parts = []
  if (region) parts.push(`in ${region.label}`)
  // ⚠️ "working in", not "who work in". The count in front of this changes —
  // "1 certified partner ... who work in manufacturing" is wrong and "who
  // works" is wrong the rest of the time. A participle agrees with both.
  if (group) parts.push(`working in ${group.label.toLowerCase()}`)
  return parts.length ? ` ${parts.join(' ')}` : ''
})

// ⚠️ A DIALOG, not a disclosure on the page. See `PartnerFiltersDialog`.
const showFilters = ref(false)

// What the trigger says. It COUNTS rather than labelling, because somebody who
// narrowed the list and closed the dialog needs to see that they did without
// opening it again.
const filterCount = computed(
  () =>
    brief.value.cities.length + brief.value.tiers.length + (brief.value.workStyle ? 1 : 0),
)

const filterSummary = computed(() =>
  filterCount.value
    ? `${filterCount.value} ${filterCount.value === 1 ? 'filter' : 'filters'} on`
    : 'Send it to fewer partners',
)

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

// ⚠️ A DIALOG OVER THIS SCREEN, not a trip back to the landing page. The
// redirect dropped somebody out of a purchase onto a marketing page and made
// them walk three steps to fix one field; the recommendation stays behind this
// and re-runs the moment it saves. See `EditAnswersDialog`.
const editing = ref(false)
const rethink = () => (editing.value = true)

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
          We'd have pointed you at a scoped implementation instead — packs are ERPNext as it ships.
        </template>
        <template v-else>
          We'd have said a pack covers this, cheaper and faster.
        </template>
      </p>

      <!-- ⚠️ The override reads as a question the visitor might be asking, not
           as a tab. Tabs say "these are two equal things"; this screen has just
           said they are not. -->
      <!-- ⚠️ DIRECTLY UNDER THE EVIDENCE, because this is where an answer is
           noticed to be wrong. The reasons above print the facts the
           recommendation was built from — "11 to 50 people, and no ERP to
           migrate off" — and the reader who is now sixty people finds out at
           exactly this line. It spent a while at the foot of the screen beside
           the feedback row, which put a correction three sections away from the
           thing it corrects.
           Quiet: body type, underlined, no button. Louder than this and it
           competes with the recommendation it sits under. -->
      <button
        class="mt-3 text-p-base text-ink-gray-6 underline hover:text-ink-gray-8"
        @click="rethink"
      >
        Change my answers
      </button>

      <!-- ── Packs ───────────────────────────────────────────────────── -->
      <section v-if="view === 'packs'" class="mt-8">
        <!-- ⚠️ NO STANDFIRST. It read "Ticked already. They are separate
             modules, so take one, two or all three." — a sentence explaining
             checkboxes to somebody looking at checkboxes. The ticks say what is
             recommended and the total below says they add up. -->
        <!-- ⚠️ ONE COLUMN, and a two-column version was built and taken out.
             A summary card in a right-hand rail keeps the button on screen —
             that is its whole argument — but at this page's 800px measure it
             leaves the list 488px, which is not enough for a row carrying a
             pack name and a price at opposite edges. Widening the page for one
             screen was the other way out, and that is a reading measure being
             set by a button.
             What actually solved it was ORDER: the total and the button sit
             directly under the list, and everything explanatory moved below
             them. Nobody scrolls past an explanation to reach the action, so
             the action never needs following down the page. -->
        <h2 class="text-p-lg font-semibold text-ink-gray-9">What we'd buy</h2>

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
              <p v-else class="mt-1 text-p-base text-ink-gray-5">Not suggested by your answers</p>
              <p class="mt-1 text-p-sm text-ink-gray-5">
                {{ row.pack.hours }} hours · {{ row.pack.validity }} to deliver
              </p>
            </div>
          </li>
        </ul>


        <!-- ── What it costs, and the button ───────────────────────────
             ⚠️ DIRECTLY UNDER THE LIST, before anything explanatory. This has
             been three things: a line-item table repeating the list, a sticky
             bar chasing the reader down the page, and a summary card in a
             right-hand rail. All three were solving "the button is below the
             fold", and the thing that actually solved it was putting the button
             where the decision is made — under the packs, above the reading.
             ⚠️ IT DOES NOT LIST THE PACKS. Every version that has been drawn,
             including the reference, repeats each pack and its price beside a
             list of each pack and its price. The rows are the line items; what
             only this can say is what leaves the account.
             ⚠️ The tax is named here and only here before the checkout. Where a
             market has no decided rate the line drops the figure rather than
             inventing one — see `checkoutFor`. -->
        <!-- ⚠️ STACKED, not a `justify-between` row. The composition line runs
             long enough to wrap the button group at this measure, so the two
             ends of that row met at some widths and not others — the button
             moved depending on how many packs were ticked. Underneath, it is in
             the same place every time. -->
        <div v-if="!nothingPicked" class="mt-5">
          <p class="text-2xl font-semibold tabular-nums text-ink-gray-9">{{ bill.total }}</p>
          <p class="mt-0.5 text-p-sm text-ink-gray-5">
            <template v-if="bill.exact">{{ bill.subtotal }} plus {{ bill.taxLabel }}</template>
            <template v-else>{{ bill.subtotal }} before {{ bill.taxLabel }}</template>
            · {{ bill.hours }} hours · paid to Frappe up front
          </p>
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="solid" size="md" label="Check out" @click="checkout" />
            <span v-if="!store.signedIn" class="text-p-sm text-ink-gray-5">
              You'll make an account on the way.
            </span>
          </div>
        </div>

        <!-- Nothing ticked. The empty state says what to do rather than
             printing a total of zero. -->
        <p v-else class="mt-5 text-p-base text-ink-gray-6">
          Tick a pack to see what it comes to.
        </p>

        <!-- ── How this works ─────────────────────────────────────
             ⚠️ ADDED BACK ON THIS SCREEN, and it belongs here more than
             anywhere. The recommendation is where somebody decides to pay,
             and until now the one question it left unanswered was WHO does
             the work — the answer arrived two screens later, on the
             confirmation. Three lines settle it before the money.
             ⚠️ NUMBERED, which this app avoids by default. It is earned
             here: these are not three features, they are three things that
             happen in order, and the order is the point — you pay Frappe
             first, and a partner is assigned against that. Reversing them
             would describe a different product.
             The same three beats as the pack page's own "How it works";
             both read `PACK_STEPS` so they cannot drift. -->
        <section class="mt-8">
          <h2 class="text-p-lg font-semibold text-ink-gray-9">How this works</h2>
          <ol class="mt-3 grid gap-4 sm:grid-cols-3">
            <li v-for="(step, i) in PACK_STEPS" :key="step.title" class="flex gap-2.5">
              <span
                class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-surface-gray-2 text-p-xs font-medium tabular-nums text-ink-gray-6"
                aria-hidden="true"
              >
                {{ i + 1 }}
              </span>
              <span class="min-w-0">
                <span class="block text-p-base font-medium text-ink-gray-8">
                  {{ step.title }}
                </span>
                <span class="mt-0.5 block text-p-sm text-ink-gray-5">{{ step.body }}</span>
              </span>
            </li>
          </ol>
        </section>
      </section>

      <!-- ── Custom ──────────────────────────────────────────────────── -->
      <section v-else class="mt-8">
        <!-- ⚠️ NO STANDFIRST HERE EITHER. It argued for the two fields —
             "without them the first reply from every partner is the same two
             questions, and you lose a week" — which is a case made to somebody
             who has already agreed to fill them in. The heading says who the
             answers are for, which is the only part that was load-bearing. -->
        <h2 class="text-p-lg font-semibold text-ink-gray-9">What partners need from you</h2>

        <div class="mt-4 max-w-[62ch] space-y-4">
          <div>
            <Textarea
              :model-value="brief.scope"
              label="What do you need built?"
              placeholder="Processes, integrations, and anything you have already tried."
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
        <!-- ── Who it reaches, and the send ─────────────────────────── -->
        <!-- ⚠️ THE FILTERS WERE A SECTION OF THEIR OWN, open by default: a
             heading, a standfirst and ten chips across three groups, sitting
             above the button and below two questions that had not been answered
             yet. It made a screen with one thing to do look like a screen with
             fifteen, and it offered to REFINE a search before the thing being
             searched for had been written.
             They are behind one line now. The sentence states who this reaches
             as a fact, in words rather than as a control, and the control opens
             only for the person who disagrees with it. -->
        <div class="mt-8 rounded-6 border border-outline-gray-2 p-4">
          <p class="max-w-[62ch] text-p-base leading-relaxed text-ink-gray-8">
            This goes to
            <span class="font-medium tabular-nums">{{ matches.length }}</span>
            certified {{ matches.length === 1 ? 'partner' : 'partners' }}{{ reachLine }}.
          </p>
          <!-- ⚠️ THE PRIVACY LINE STAYS, cut to one sentence. It is the only
               copy on this screen that tells somebody what they are giving away
               by pressing the button under it, so it earns its line — but it ran
               to three, and the middle one listed the fields the card above
               already lists. -->
          <p class="mt-1 max-w-[62ch] text-p-base leading-relaxed text-ink-gray-6">
            They see the requirements and the budget, not your company name — that is shared when
            you approve a reply.
          </p>

          <!-- ⚠️ The label counts what is ON rather than saying "Filters", so
               somebody who narrowed the list and closed the dialog can see that
               they did without opening it again. -->
          <button
            class="mt-3 text-p-base text-ink-gray-6 underline hover:text-ink-gray-8"
            @click="showFilters = true"
          >
            {{ filterSummary }}
          </button>
        </div>

        <div class="mt-5">
          <Button
            variant="solid"
            size="md"
            :disabled="matches.length === 0"
            :label="`Send requirements to ${matches.length} ${matches.length === 1 ? 'partner' : 'partners'}`"
            @click="send"
          />
        </div>
        <!-- ── How this works ─────────────────────────────────────
             ⚠️ ADDED BACK ON THIS SCREEN, and it belongs here more than
             anywhere. The recommendation is where somebody decides to pay,
             and until now the one question it left unanswered was WHO does
             the work — the answer arrived two screens later, on the
             confirmation. Three lines settle it before the money.
             ⚠️ NUMBERED, which this app avoids by default. It is earned
             here: these are not three features, they are three things that
             happen in order, and the order is the point — you pay Frappe
             first, and a partner is assigned against that. Reversing them
             would describe a different product.
             The same three beats as the pack page's own "How it works";
             both read `PACK_STEPS` so they cannot drift. -->
        <section class="mt-8">
          <h2 class="text-p-lg font-semibold text-ink-gray-9">How this works</h2>
          <ol class="mt-3 grid gap-4 sm:grid-cols-3">
            <li v-for="(step, i) in PACK_STEPS" :key="step.title" class="flex gap-2.5">
              <span
                class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-surface-gray-2 text-p-xs font-medium tabular-nums text-ink-gray-6"
                aria-hidden="true"
              >
                {{ i + 1 }}
              </span>
              <span class="min-w-0">
                <span class="block text-p-base font-medium text-ink-gray-8">
                  {{ step.title }}
                </span>
                <span class="mt-0.5 block text-p-sm text-ink-gray-5">{{ step.body }}</span>
              </span>
            </li>
          </ol>
        </section>
      </section>

      <!-- ── The other path ──────────────────────────────────────────── -->
      <!-- ⚠️ IT USED TO SIT UNDER THE HEADLINE, three lines after a verdict
           that had just said there was one answer — a second option offered
           before the first had been read, on a screen whose whole job is to
           stop somebody choosing from a menu. It belongs after the thing being
           recommended and after the button that acts on it: read the
           recommendation, act on it, or, if it is wrong, here is the other
           route.
           ⚠️ Still a sentence and not a tab. Tabs say "these are two equal
           things"; this screen has just said they are not. -->
      <!-- ⚠️ THE LIST IS THE POINT, and the link used to stand without it. It
           read "Bigger job? Get quotes from partners instead", which asks
           somebody to self-diagnose against a criterion nobody has given them —
           three lines after being told a pack fits. Nobody knows whether their
           job is "bigger". Everybody knows whether they need their data
           migrated across.
           These four are the scope document's own exclusions plus the user
           limit from its commercial terms, matched by fragment rather than
           retyped — see `PACK_WONT_COVER`. They are the four with no version
           that fits inside a fixed scope; the other exclusions are add-ons you
           can buy against a pack, and listing those would send people to custom
           work over a print format.
           ⚠️ Only on the PACKS half. On the custom half the verdict's own
           reasons already name which trigger fired, so the same question
           ("would a fixed price do it?") is already answered above. -->
      <div v-if="view === 'packs' && !overridden" class="mt-10 max-w-[62ch]">
        <p class="text-p-base text-ink-gray-7">A pack won't cover you if you need</p>
        <ul class="mt-2 space-y-1">
          <li
            v-for="item in PACK_WONT_COVER"
            :key="item"
            class="flex gap-2.5 text-p-base text-ink-gray-6"
          >
            <span class="mt-2 size-1 shrink-0 rounded-full bg-[var(--outline-gray-3)]" aria-hidden="true" />
            {{ item }}
          </li>
        </ul>
        <button class="mt-3 text-p-base text-ink-gray-6 underline hover:text-ink-gray-8" @click="view = 'custom'">
          Get quotes from partners instead
        </button>
      </div>

      <p v-else class="mt-10 max-w-[62ch] text-p-base text-ink-gray-6">
        <template v-if="view === 'packs'">
          <button class="underline hover:text-ink-gray-8" @click="view = 'custom'">
            Back to what we recommend
          </button>
        </template>
        <template v-else>
          <template v-if="!overridden">Would a fixed price do it? </template>
          <button class="underline hover:text-ink-gray-8" @click="view = 'packs'">
            {{ overridden ? 'Back to what we recommend' : 'Look at the packs anyway' }}
          </button>
        </template>
      </p>

      <!-- ── Neither of them ─────────────────────────────────────────── -->
      <!-- ⚠️ THE THIRD ANSWER, and the screen was missing it. It offered two
           paths and a way to correct the answers, all of which assume the
           recommendation is nearly right. Somebody whose situation is not in
           the three questions had nowhere to go but away.
           ⚠️ It is a LINK, not a form, and it goes to the contact page's own
           triage — the one that routes an implementation question here and a
           product question to the team. Sending a message from this screen
           would be a second contact route, answered by a different inbox, with
           no idea what the person had already been shown.
           Quiet: below the path switch, above the feedback, in body type. A
           "talk to us" offer at the weight of the buy button is a product that
           does not believe its own recommendation. -->
      <p class="mt-3 max-w-[62ch] text-p-base text-ink-gray-6">
        Neither of these?
        <a
          :href="`${baseUrl}contact`"
          target="_blank"
          rel="noreferrer"
          class="underline hover:text-ink-gray-8"
        >
          Talk to someone at Frappe
        </a>
      </p>

      <!-- ── Was this right? ─────────────────────────────────────────── -->
      <!-- ⚠️ ONE LINE, at the bottom, and it disappears once answered. It is
           the highest-value feedback in the app — the only signal that the
           engine rather than a partner got something wrong — and it is worth
           exactly one line of a screen whose job is something else. -->
      <div class="mt-5 border-t border-outline-gray-2 pt-5">
        <!-- ⚠️ "Change my answers" IS NOT HERE, and it was. Both it and this
             row are about the answers rather than the products, which is why
             they were paired — but they are different ACTS. This asks Frappe a
             question; that one changes your own data and re-runs the engine.
             On one line the correction read as a third response to "Does this
             look right?", which is the one thing it is not. It sits under the
             reasons now, where an answer is actually noticed to be wrong. -->
        <div v-if="!answered" class="flex flex-wrap items-center gap-3">
          <p class="text-p-base text-ink-gray-6">Does this look right?</p>
          <Button variant="subtle" label="Yes" @click="store.recordRecoFeedback(true)" />
          <Button variant="subtle" label="Not really" @click="store.recordRecoFeedback(false)" />
        </div>
        <div v-else-if="done" class="text-p-base text-ink-gray-6">
          Thanks — that helps us get the next one right.
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

    <EditAnswersDialog v-model:open="editing" />
    <PartnerFiltersDialog v-model:open="showFilters" />
  </ConnectShell>
</template>
