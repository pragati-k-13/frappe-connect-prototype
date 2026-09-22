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
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'
import ConnectShell from '../components/ConnectShell.vue'
import EditAnswersDialog from '../components/EditAnswersDialog.vue'
import PackScopeDialog from '../components/PackScopeDialog.vue'
import PartnerFiltersDialog from '../components/PartnerFiltersDialog.vue'
import { useConnectStore } from '../stores/connect'
import { recommendationFor } from '../data/recommendation'
import {
  INCLUDED_IN_ALL,
  PACK_ADD_ONS,
  PACK_BLOCKERS,
  PACK_STEPS,
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

// ⚠️ THE GATE, and the only one on this half. Paying creates a project, a
// partner assignment and a conversation — three facts about an account — so
// there has to be one. `?next=` brings them back to the checkout rather than to
// the top of the funnel.
//
// ⚠️ THIS WAS DELETED AND ITS BUTTON WAS NOT. `@click="checkout"` against an
// undefined name compiles to no handler at all, silently, so the primary action
// on the pivot screen of the product did nothing from `1efe037` until now — the
// commit that rebuilt this area as a sticky bar took the function with it. Vue
// will not warn about this; nothing but pressing the button will.
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
  // ⚠️ A RECEIPT, not the tracker. Sending used to land on the project page —
  // a screen about work that has not started, reached from a decision screen,
  // with nothing in between to say what had just happened. Twelve companies had
  // been written to and the product never mentioned it. See `BriefSentPage`.
  router.push({ name: 'brief-sent', query: { project: id } })
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
// Which pack's scope document the dialog holds, and whether it is open.
//
// ⚠️ TWO REFS, NOT ONE. Deriving `open` from `scopeOf !== null` and nulling it
// on close empties the dialog while it is still fading out — for a couple of
// frames it reads "What this covers" over nothing, which is the fallback title
// for a dialog with no pack. The pack simply stays until another row is
// pressed; nothing reads it while the dialog is shut.
const scopeOf = ref(null)
const scopeOpen = ref(false)

const showScope = (pack) => {
  scopeOf.value = pack
  scopeOpen.value = true
}

const editing = ref(false)
const rethink = () => (editing.value = true)

watch(view, () => {
  tried.value = false
})
</script>

<template>
  <ConnectShell>
    <!-- ⚠️ THE MEASURE CHANGES WITH THE HALF, which no other screen in the app
         does and is worth the exception. The custom half is a form and some
         prose, so it takes the app's usual 800px. The packs half carries a
         summary rail beside the list, and at 800px that rail leaves the rows
         488px — not enough for a pack name and a price at opposite edges. 1080
         gives the list about 720 and the rail 300.
         The reading measure itself does not move: prose is capped at 62ch in
         both, so what widens is the part that is a table, not the part that is
         a paragraph. -->
    <div
      class="mx-auto w-full px-5 py-10 lg:px-10"
      :class="view === 'packs' ? 'max-w-[1080px]' : 'max-w-[800px]'"
    >
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

      <!-- ── Packs ───────────────────────────────────────────────────── -->
      <section v-if="view === 'packs'" class="mt-8">
        <!-- ⚠️ NO STANDFIRST. It read "Ticked already. They are separate
             modules, so take one, two or all three." — a sentence explaining
             checkboxes to somebody looking at checkboxes. The ticks say what is
             recommended and the total below says they add up. -->
        <!-- ⚠️ TWO COLUMNS from `lg`: the packs and everything explaining them
             on the left, what it costs on the right, sticking. The rail's whole
             argument is that the figure and the button never leave the screen
             while somebody reads four sections about what they are buying.
             Below `lg` it stacks directly under the list, which is where the
             total sat when this was one column — so the small-screen order is
             unchanged and only the wide one gains a rail. -->
        <div class="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div class="min-w-0 flex-1">
            <h2 class="text-p-lg font-semibold text-ink-gray-9">What we'd buy</h2>

            <ul class="mt-4 divide-y divide-outline-gray-2 rounded-6 border border-outline-gray-2">
              <li v-for="row in rows" :key="row.pack.value" class="flex gap-3 p-4">
                <!-- ⚠️ NO `label` ON THE CHECKBOX. The row prints the pack's
                     name itself, beside the price, and letting the control
                     print it too put every name on the screen twice.
                     `aria-label` keeps the control named for anyone who cannot
                     see the row. -->
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
                  <!-- The per-pack why. Present only where a rule fired — see
                       the note on `rows`. -->
                  <p v-if="row.reason" class="mt-1 text-p-base leading-relaxed text-ink-gray-6">
                    {{ row.reason }}
                  </p>
                  <!-- ⚠️ The un-recommended row keeps its sentence and loses its
                       weight. It is still a real option and still says honestly
                       why it is not ticked, but at `gray-5` against the
                       recommended rows' `gray-6` the eye can take the
                       recommendation in without reading three paragraphs to
                       find which two were argued for. -->
                  <p v-else class="mt-1 text-p-base text-ink-gray-5">
                    Not suggested by your answers
                  </p>
                  <p class="mt-1 flex flex-wrap items-center gap-x-2 text-p-sm text-ink-gray-5">
                    <span>{{ row.pack.hours }} hours · {{ row.pack.validity }} to deliver</span>
                    <!-- ⚠️ THE SCOPE, ON THE ROW. "Is payment reconciliation in
                         this or not" is the question somebody has while looking
                         at a price, and the only answer used to be the pack's
                         own page — a navigation out of the purchase whose way
                         back is the browser's Back button. It opens the
                         contract over this screen instead.
                         Sits on the facts line rather than as a button of its
                         own: three rows each carrying a second control read as
                         three things to do, and the thing to do here is tick a
                         box. -->
                    <button
                      class="underline hover:text-ink-gray-8"
                      @click="showScope(row.pack)"
                    >
                      What's included
                    </button>
                  </p>
                </div>
              </li>
            </ul>



          </div>

          <!-- ── What it costs ─────────────────────────────────────────
               ⚠️ A RAIL, and this figure has now been four things: a line-item
               table repeating the list, a bare total under it, a sticky bar
               chasing the reader down the page, and this. The rail is what the
               page can afford once it is 1080 wide, and it answers the same
               problem the other three were built for — the button leaving the
               screen while somebody reads four sections about what they are
               buying — without the figure ever appearing twice.
               ⚠️ IT DOES NOT LIST THE PACKS. Every version that has been drawn,
               including the reference, repeats each pack and its price beside a
               list of each pack and its price. The rows ARE the line items;
               what only this can say is what leaves the account.
               ⚠️ The tax is named here and only here before the checkout. Where
               a market has no decided rate the line drops the figure rather
               than inventing one — see `checkoutFor`. -->
          <aside class="w-full shrink-0 lg:sticky lg:top-6 lg:w-[300px]">
            <div class="rounded-6 border border-outline-gray-2 p-4">
              <template v-if="nothingPicked">
                <p class="text-p-base text-ink-gray-7">Nothing picked</p>
                <!-- An empty state that says what to do, rather than a total of
                     zero. -->
                <p class="mt-1 text-p-sm leading-relaxed text-ink-gray-5">
                  Tick a pack on the left to see what it comes to.
                </p>
              </template>
              <template v-else>
                <p class="text-p-sm text-ink-gray-5">Total</p>
                <p class="mt-0.5 text-2xl font-semibold tabular-nums text-ink-gray-9">
                  {{ bill.total }}
                </p>
                <p class="mt-1 text-p-sm leading-relaxed text-ink-gray-5">
                  <template v-if="bill.exact">
                    {{ bill.subtotal }} plus {{ bill.taxLabel }}
                  </template>
                  <template v-else>{{ bill.subtotal }} before {{ bill.taxLabel }}</template>
                  · {{ bill.hours }} hours
                </p>
                <Button
                  class="mt-4 w-full"
                  variant="solid"
                  size="md"
                  label="Check out"
                  @click="checkout"
                />
                <!-- ⚠️ ONE CONDITION, not two. The hosting sentence went — it is
                     the project's business and it is stated twice downstream.
                     What survives is the one term that changes what this button
                     does: the money goes to Frappe, up front. -->
                <p class="mt-2 text-p-sm leading-relaxed text-ink-gray-5">
                  Paid to Frappe, in full and up front.
                  <template v-if="!store.signedIn">You'll make an account on the way.</template>
                </p>
              </template>
            </div>
          </aside>
        </div>
      </section>

      <!-- ── Custom ──────────────────────────────────────────────────── -->
      <section v-else class="mt-8">
        <!-- ⚠️ ONE SURFACE, AND IT WAS THREE THINGS FLOATING. The two fields
             sat unbordered at 62ch, a bordered card stating the reach sat below
             them at the page's full width, and the send button sat naked under
             that — read as a form, then a notice, then an action, with nothing
             saying they were the same errand. The mismatched widths did half
             the damage on their own.
             ⚠️ AND THE FIX IS NOT A STRONGER LINK BETWEEN THEM, because the
             dependency people expect is not there: the count comes from the
             intake and from the filters inside the foot, and NOTHING the two
             fields collect narrows it — see the note on `matchingPartners`.
             Drawing an arrow from the budget to the number would be drawing a
             claim that is false.
             What is true is that this is ONE OUTGOING ITEM. A brief going to a
             list of firms is a dispatch: the message, then who it is addressed
             to, then send — and in every tool that does this, the address block
             and the send control sit on the same surface as the body. So they
             do here. The hairline is card anatomy, not decoration: above it is
             content, below it is addressing.
             ⚠️ NO HEADING. It read "What partners need from you", which labels
             the fields and mislabels the foot under them — the foot is about
             who the partners ARE. Its stated job was saying who the answers
             were for, and the foot now does that by naming them. -->
        <div class="max-w-[62ch] rounded-6 border border-outline-gray-2">
          <div class="space-y-4 p-4">
            <Textarea
              :model-value="brief.scope"
              label="What do you need built?"
              placeholder="Processes, integrations, and anything you have already tried."
              :rows="5"
              required
              :error="briefProblems.scope"
              @update:model-value="store.saveBrief({ scope: $event })"
            />
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

          <!-- ── Addressed to ───────────────────────────────────────────
               ⚠️ THE FILTERS WERE A SECTION OF THEIR OWN, open by default: a
               heading, a standfirst and ten chips across three groups, above
               the button and below two questions nobody had answered yet. It
               made a screen with one thing to do look like a screen with
               fifteen, and it offered to refine a search before the thing being
               searched for had been written. They are behind one line now: the
               sentence states who this reaches in words, and the control opens
               only for the person who disagrees with it.
               ⚠️ THE COUNT IS ON THE BUTTON AND NOWHERE ELSE. It used to be in
               both — "This goes to 13 certified partners" two lines above "Send
               requirements to 13 partners" — which was tolerable while a gap
               separated them and is a stutter now they share a foot. The
               sentence keeps the criteria, which is the part a number cannot
               carry; the button keeps the figure, because the button is the
               commitment and a send control that does not name what it is about
               to do is how twelve firms hear from somebody who meant three. -->
          <!-- ⚠️ THE HAIRLINE ONLY, NO FILL. The foot was tinted
               `surface-gray-1` to read as a different register, and it could
               not: the fields above it are `surface-gray-2`, so the foot came
               out LIGHTER than the inputs it sits under, and a band that is
               paler than the thing above it reads as a rendering artefact
               rather than as a second part. Matching them would have made the
               card heavy at both ends. The stroke says where the message stops
               and the addressing starts, which is all that needed saying. -->
          <div class="border-t border-outline-gray-2 p-4">
            <template v-if="matches.length">
              <p class="text-p-base leading-relaxed text-ink-gray-8">
                Going to certified partners{{ reachLine }}.
              </p>
              <!-- ⚠️ THE PRIVACY LINE STAYS, cut to one sentence. It is the
                   only copy here that says what you give away by pressing the
                   button beside it, so it earns its line — but it ran to three,
                   and the middle one listed the fields above it. -->
              <p class="mt-1 text-p-base leading-relaxed text-ink-gray-6">
                They see the requirements and the budget, not your company name — that is shared
                when you approve a reply.
              </p>
            </template>
            <!-- Nobody left. A real state — the filters can narrow to zero —
                 and it names the control that caused it, because the only way
                 back is the one link under it. -->
            <p v-else class="text-p-base leading-relaxed text-ink-gray-8">
              No partners match these filters.
            </p>

            <!-- ⚠️ The label counts what is ON rather than saying "Filters", so
                 somebody who narrowed the list and closed the dialog can see
                 that they did without opening it again. -->
            <button
              class="mt-3 block text-p-base text-ink-gray-6 underline hover:text-ink-gray-8"
              @click="showFilters = true"
            >
              {{ filterSummary }}
            </button>

            <Button
              class="mt-4"
              variant="solid"
              size="md"
              :disabled="matches.length === 0"
              :label="`Send requirements to ${matches.length} ${matches.length === 1 ? 'partner' : 'partners'}`"
              @click="send"
            />
          </div>
        </div>
      </section>

      <!-- ── Everything below belongs to the LIST, not to the page ───
           ⚠️ CONSTRAINED TO THE LEFT COLUMN'S MEASURE. The reasoning, "How
           this works", what a pack won't cover and the feedback row all ran
           the full 1000px, sliding out from under the rows and passing
           beneath the rail — and the rule above the feedback row made it
           plain, a full-width stroke drawn under a card it has nothing to do
           with. A right-hand rail is a sidebar; text that runs underneath one
           reads as text the sidebar is a part of.
           332px is the 300px rail plus the flex `gap-8`, left as the
           expression rather than the 668 it works out to, so the two numbers
           that produce it are the two numbers on the block above.
           Only on the packs half: the custom half has no rail and takes the
           app's usual 800px, where full width already is the measure. -->
      <div :class="view === 'packs' ? 'lg:max-w-[calc(100%-332px)]' : ''">
        <!-- ── Why, after the thing itself ─────────────────────────────
             ⚠️ THIS USED TO SIT UNDER THE HEADLINE, above everything. The
             reasoning was that a recommendation whose justification is below the
             price list is a price list — which is true of a screen with no
             headline. This one opens with the verdict as its first line, so the
             claim IS made before anything can be bought; what sat under it was
             the WORKING, and two sentences of working between a claim and the
             thing it is about delays the only part most people came for.
             Someone who accepts the recommendation never needs to read this.
             Someone who doubts it scrolls, and finds it directly under the
             button they declined to press. -->
        <section class="mt-10">
          <!-- ⚠️ A HEADING, which this block did not need when it sat under the
               headline — the position said what it was. Below a price and a
               button it needs saying.
               ⚠️ TWO OF THEM, because the block holds two different things. On
               the recommended path it is the case FOR what is above it. On the
               overridden one it is the case AGAINST — "we'd have said a pack
               covers this" — and printing that under "Why we're recommending
               this" would have the screen arguing against its own heading. -->
          <h2 class="text-p-lg font-semibold text-ink-gray-9">
            {{ overridden ? "What we'd have recommended" : "Why we're recommending this" }}
          </h2>

          <!-- ⚠️ NO TICKS. Each reason carried a check icon, which reads as
               "included" — the vocabulary of a feature list. These are EVIDENCE
               for a claim, and dressing an argument as a spec sheet makes it
               skimmable in exactly the way an argument should not be.
               ⚠️ `max-w-[62ch]`, against the page's own 800px. At the full measure
               these ran to about 110 characters a line. Only the PROSE is capped —
               the pack rows keep the width, because a row with a price at its
               right edge needs one. -->
          <ul v-if="!overridden" class="mt-3 max-w-[62ch] space-y-2">
            <li
              v-for="(reason, i) in reco.reasons"
              :key="i"
              class="text-p-base leading-relaxed text-ink-gray-7"
            >
              {{ reason }}
            </li>
          </ul>

          <!-- The override's one line. It says what we would have said and why,
               without repeating the argument — the visitor has read it and
               decided against it, and making them read it again is nagging. -->
          <p v-else class="mt-3 max-w-[62ch] text-p-base leading-relaxed text-ink-gray-6">
            <template v-if="view === 'packs'">
              We'd have pointed you at a scoped implementation instead — packs are ERPNext as it
              ships.
            </template>
            <template v-else>We'd have said a pack covers this, cheaper and faster.</template>
          </p>

          <!-- ⚠️ DIRECTLY UNDER THE EVIDENCE, because this is where an answer is
               noticed to be wrong: the sentences above print the facts the
               recommendation was built from, and the reader who is now sixty
               people finds out at exactly that line.
               Quiet: body type, underlined, no button. Louder than this and it
               competes with the recommendation it explains. -->
          <button
            class="mt-3 text-p-base text-ink-gray-6 underline hover:text-ink-gray-8"
            @click="rethink"
          >
            Change my answers
          </button>
        </section>

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
             both read `PACK_STEPS` so they cannot drift.
             ⚠️ PACKS ONLY. It describes buying a fixed scope from Frappe and
             being assigned somebody to deliver it, which is not what happens on
             the custom path — there you choose the partner and pay them. It sat
             inside the packs branch until the justification moved below the
             button and pushed it out; the guard is what that move cost. -->
        <section v-if="view === 'packs'" class="mt-8">
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
        <!-- ⚠️ ONCE, FOR ALL THREE PACKS, and it used to be three times. Every
             row's "What's included" opened a dialog that printed the pack's own
             scope and then the same eight inclusions and eight exclusions —
             true of every pack, and therefore not an answer to "what is in THIS
             one". Somebody comparing two packs read the identical two lists
             twice and learned nothing from the second. The dialog keeps the
             part that differs; the part that never does is here, where it is
             read once and applies to whatever ends up ticked.
             ⚠️ THE EXCLUSIONS ARE IN TWO GROUPS, and that is the whole reason
             this can replace the old "A pack won't cover you if you need" list.
             Section 5 sells five of them back to you as add-ons and four are
             the ones no fixed scope can hold — printing all eight under one
             heading would send somebody to get quotes over a print format, and
             printing only the four hid half the contract. The split is derived
             from `PACK_WONT_COVER`, not typed — see `PACK_ADD_ONS`.
             ⚠️ The link hangs off the second group rather than standing alone.
             It used to read "Bigger job? Get quotes from partners instead",
             which asks somebody to self-diagnose against a criterion nobody has
             given them. Nobody knows whether their job is "bigger"; everybody
             knows whether they need their data migrated across. -->
        <section v-if="view === 'packs'" class="mt-10">
          <h2 class="text-p-lg font-semibold text-ink-gray-9">True of every pack</h2>

          <div class="mt-4 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <div>
              <h3 class="text-p-base font-medium text-ink-gray-8">Included</h3>
              <ul class="mt-2 space-y-1.5">
                <li
                  v-for="item in INCLUDED_IN_ALL"
                  :key="item"
                  class="flex gap-2 text-p-base text-ink-gray-6"
                >
                  <IconCheck class="mt-1 size-3.5 shrink-0 text-ink-gray-5" />
                  {{ item }}
                </li>
              </ul>
            </div>

            <div class="space-y-6">
              <div>
                <h3 class="text-p-base font-medium text-ink-gray-8">Not included</h3>
                <ul class="mt-2 space-y-1.5">
                  <li
                    v-for="item in PACK_ADD_ONS"
                    :key="item.label"
                    class="flex gap-2 text-p-base text-ink-gray-6"
                  >
                    <IconX class="mt-1 size-3.5 shrink-0 text-ink-gray-5" />
                    <span class="min-w-0">
                      {{ item.label }}
                      <span v-if="item.hint" class="block text-p-sm text-ink-gray-5">
                        {{ item.hint }}
                      </span>
                    </span>
                  </li>
                </ul>
                <p class="mt-2 text-p-sm text-ink-gray-5">
                  Each can be bought against a pack.
                </p>
              </div>

              <div>
                <h3 class="text-p-base font-medium text-ink-gray-8">Not possible in a pack</h3>
                <ul class="mt-2 space-y-1.5">
                  <li
                    v-for="item in PACK_BLOCKERS"
                    :key="item.label"
                    class="flex gap-2 text-p-base text-ink-gray-6"
                  >
                    <IconX class="mt-1 size-3.5 shrink-0 text-ink-gray-5" />
                    <span class="min-w-0">
                      {{ item.label }}
                      <span v-if="item.hint" class="block text-p-sm text-ink-gray-5">
                        {{ item.hint }}
                      </span>
                    </span>
                  </li>
                </ul>
                <!-- ⚠️ Only when this is still the recommendation. Overridden,
                     the visitor is already looking at packs against our advice
                     and the line below offers them the way back instead. -->
                <button
                  v-if="!overridden"
                  class="mt-2 text-p-base text-ink-gray-6 underline hover:text-ink-gray-8"
                  @click="view = 'custom'"
                >
                  Get quotes from partners instead
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ── The other path ──────────────────────────────────────────── -->
        <!-- ⚠️ Still a sentence and not a tab. Tabs say "these are two equal
             things"; this screen has just said they are not.
             On the packs half the switch lives on the exclusions above, so this
             is only the two cases that block has no room for: an overridden
             packs view, and the custom half. -->
        <p
          v-if="view !== 'packs' || overridden"
          class="mt-10 max-w-[62ch] text-p-base text-ink-gray-6"
        >
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
          <!-- ⚠️ THROUGH THE ROUTER, and it used to open a new tab. The
               contact page is mocked inside this prototype, so the tab was not
               leaving for the real site — it was opening a second copy of the
               same prototype beside the one under review. See the note in
               `FrappeSitePage`. -->
          <RouterLink to="/contact" class="underline hover:text-ink-gray-8">
            Talk to someone at Frappe
          </RouterLink>
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
    </div>

    <PackScopeDialog v-model:open="scopeOpen" :pack="scopeOf" />
    <EditAnswersDialog v-model:open="editing" />
    <PartnerFiltersDialog v-model:open="showFilters" />
  </ConnectShell>
</template>
