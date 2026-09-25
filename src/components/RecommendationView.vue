<script setup>
import { computed, ref, watch } from 'vue'
import { Button, FormControl, Textarea, TextInput } from 'frappe-ui'
import IconCheck from '~icons/lucide/check'
import IconEdit from '~icons/lucide/square-pen'
import IconSend from '~icons/lucide/send'
import IconArrowRight from '~icons/lucide/arrow-right'
import IconMapPin from '~icons/lucide/map-pin'
import IconBriefcase from '~icons/lucide/briefcase'
import IconCalendar from '~icons/lucide/calendar'
import IconAward from '~icons/lucide/award'
import IconUsers from '~icons/lucide/users'
import frappeMark from '../assets/frappe.svg'
import PackBasket from './PackBasket.vue'
import PackCoverage from './PackCoverage.vue'
import PackFitTests from './PackFitTests.vue'
import PackPickList from './PackPickList.vue'
import PackScopeDialog from './PackScopeDialog.vue'
import PackSteps from './PackSteps.vue'
import PackTerms from './PackTerms.vue'
import PartnerFiltersDialog from './PartnerFiltersDialog.vue'
import { useConnectStore } from '../stores/connect'
import { recommendationFor } from '../data/recommendation'
import {
  PACK_STEPS,
  STARTER_PACKS,
  marketFor,
  DEFAULT_REGION,
} from '../data/packs'
import {
  briefErrors,
  budgetBandsFor,
  criteriaLines,
  matchingPartners,
  scopeHint,
} from '../data/custom'

// The recommendation, for whichever answers it is given: the verdict, the
// packs or the requirements, the rail that acts on them, and the reasoning.
//
// ⚠️ ONE COMPONENT, TWO OWNERS. The recommendation screen passes the account's
// answers, basket and requirements; a draft project passes its own. Nothing in
// here writes to the store — ticking a pack, typing the requirements and
// changing the criteria are all reported up — so the same screen can drive a
// draft without the draft's choices leaking into the account's, or the other
// way round. Only the feedback row is the account's, and a draft turns it off.
//
// ⚠️ CHECK OUT AND SHARE ARE REPORTED, NOT PERFORMED. What they do depends on
// the owner: from the recommendation screen they create a project, from a
// draft they start the one that exists. The requirements are still validated
// here, because the errors are drawn here.
const props = defineProps({
  // The landing's answers — country, size, industry, operations, problems.
  answers: { type: Object, required: true },
  // `{ scope, budget, cities, tiers, workStyle, timeline }`.
  brief: { type: Object, required: true },
  // Pack values ticked.
  packs: { type: Array, required: true },
  // 'packs' or 'custom' to open on, overriding the verdict.
  initialView: { type: String, default: null },
  // The account's recommendation-feedback row.
  showFeedback: { type: Boolean, default: true },
})

const emit = defineEmits(['toggle-pack', 'update-brief', 'checkout', 'share', 'edit-answers'])

const store = useConnectStore()

const reco = computed(() => recommendationFor(props.answers))
const view = ref(props.initialView ?? reco.value.verdict)
const overridden = computed(() => view.value !== reco.value.verdict)
const region = computed(() => marketFor(props.answers.country) ?? DEFAULT_REGION)

// ⚠️ FOUR HEADLINES, not two, and the split is who is speaking. Recommended,
// this is Frappe's opinion and says so; overridden, it drops to the plain noun,
// because we are not recommending what is on screen.
const headline = computed(() =>
  view.value === 'packs'
    ? overridden.value
      ? 'Starter Packs'
      : reco.value.packs.length > 1
        ? 'We recommend these Starter Packs'
        : 'We recommend a Starter Pack'
    : overridden.value
      ? 'Custom implementation'
      : 'We recommend a custom implementation',
)

// Why each pack is on the list, from the engine — see `PackPickList`.
const reasons = computed(() =>
  Object.fromEntries(reco.value.packs.map((r) => [r.pack.value, r.reason])),
)
// ⚠️ NO BADGES WHEN EVERY PACK HAS ONE. "Recommended" marks a pack out from
// the others; on all of them it marks nothing, and three identical chips are
// noise on the rows.
const badges = computed(() =>
  reco.value.packs.length < STARTER_PACKS.length ? reasons.value : null,
)
const nothingPicked = computed(() => props.packs.length === 0)

const checkout = () => {
  if (!nothingPicked.value) emit('checkout')
}

const brief = computed(() => props.brief)
const tried = ref(false)
const briefProblems = computed(() => (tried.value ? briefErrors(brief.value) : {}))
const bands = computed(() => budgetBandsFor(props.answers.country))

const matches = computed(() => matchingPartners(props.answers, brief.value))

const showFilters = ref(false)

const CRITERIA_ICONS = {
  'map-pin': IconMapPin,
  briefcase: IconBriefcase,
  calendar: IconCalendar,
  award: IconAward,
  users: IconUsers,
}

const criteria = computed(() => criteriaLines(props.answers, brief.value))

// Read back as it is typed — a hint, never a gate. See `scopeHint`.
const hint = computed(() => scopeHint(brief.value.scope))

const CUSTOM_STEPS = [
  { title: 'Contact partners', body: 'Share your requirements' },
  { title: 'Hire a partner', body: 'Whichever quote fits' },
  { title: 'Pay per milestone', body: 'Agreed with them' },
]

const send = () => {
  if (Object.keys(briefErrors(brief.value)).length) {
    tried.value = true
    return
  }
  emit('share')
}

const note = ref('')
const noteSent = ref(false)
const answered = computed(() => store.recoFeedback !== null)
const done = computed(() => answered.value && (store.recoFeedback.ok || noteSent.value))
const sendNote = () => {
  store.recordRecoFeedback(false, note.value)
  noteSent.value = true
}

const scopeOf = ref(null)
const scopeOpen = ref(false)
const showScope = (pack) => {
  scopeOf.value = pack
  scopeOpen.value = true
}

const rethink = () => emit('edit-answers')

// Switching halves forgets a failed send: the errors belong to the half that
// was tried.
watch(view, () => {
  tried.value = false
})

// So a page can resume a send it interrupted for sign-up — see `RecommendPage`.
defineExpose({ send })
</script>

<template>
  <div>
  <!-- ⚠️ ONE GRID FOR THE WHOLE SCREEN, so the rail runs its full height and
       stays in view to the last section. It used to sit beside the list only,
       and scrolled away with it. The column is capped and centred in what the
       rail leaves, so it sits midway between the sidebar and the rail however
       wide the window is; the rail itself goes to the page's right edge.
       `lg:pl-8` tops the page's 32px up to the 64px gap, so the two sides of
       the column measure the same.
       Below `lg` it is one column and the rail falls between the work and the
       reference, where the button still follows the list. -->
  <div class="grid gap-x-16 lg:grid-cols-[minmax(0,1fr)_300px] lg:pl-8">
  <div class="w-full lg:mx-auto lg:max-w-[720px]">
  <!-- ── The verdict ─────────────────────────────────────────────── -->
  <!-- ⚠️ NO EYEBROW. There was a tracked-out "BASED ON YOUR ANSWERS" above
       this headline, and it was redundant twice over: the two lines beneath
       it quote the answers word for word, and an all-caps label above a
       heading is the most generic device on the page. Nothing was lost by
       deleting it — the sentences underneath are the label. -->
  <!-- The page's own heading can replace this one — a draft project puts its
       name there — and still read the verdict from `headline`. -->
  <slot name="header" :headline="headline">
    <h1 class="text-2xl font-semibold text-ink-gray-8">{{ headline }}</h1>
  </slot>

  <!-- ── Packs ───────────────────────────────────────────────────── -->
  <!-- ⚠️ THE LIST STRAIGHT UNDER THE VERDICT, with no "What we'd buy" over it
       and no box around it — the same open rows as the Starter Packs page, via
       `PackPickList`, and the same basket beside them via `PackBasket`. -->
  <section v-if="view === 'packs'" class="mt-4">
    <PackPickList
      :packs="packs"
      :region="region"
      :reasons="badges"
      @toggle="emit('toggle-pack', $event)"
      @scope="showScope"
    />
  </section>

  <!-- ── Custom ──────────────────────────────────────────────────── -->
  <section v-else class="mt-8">
    <!-- ⚠️ THE SAME SHAPE AS THE PACKS HALF, and it should have been from
         the start: a column of what you are deciding, and a rail carrying
         the number and the button that acts on it. Both halves of this
         screen end in one commitment made against one figure, and they were
         laying that out two different ways. -->
    <div class="rounded-6 border border-outline-gray-2 p-5">
      <!-- ⚠️ THE CRITERIA ARE ON THE PAGE, not behind a counted link
           reading "3 filters on". A number is not a criterion: somebody
           who narrowed to Pune and came back an hour later could not
           tell what the brief was about to do without opening a dialog.
           Five lines say it, and the button beside them is for changing
           them rather than for finding out what they are. -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-ink-gray-8">
            Share requirements with every partner that matches
          </h2>
          <p class="mt-1 text-p-base text-ink-gray-6">
            Sent as a message, never posted publicly.
          </p>
        </div>
        <Button variant="subtle" label="Edit criteria" @click="showFilters = true">
          <template #prefix><IconEdit class="size-4" /></template>
        </Button>
      </div>

      <ul class="mt-4 space-y-2">
        <li
          v-for="line in criteria"
          :key="line.text"
          class="flex items-center gap-2.5 text-p-base text-ink-gray-7"
        >
          <component :is="CRITERIA_ICONS[line.icon]" class="size-4 text-ink-gray-5" />
          {{ line.text }}
        </li>
      </ul>

      <!-- ── What you tell them ──────────────────────────────────── -->
      <div class="mt-6">
        <h3 class="text-p-base font-semibold text-ink-gray-8">
          Tell us about your project
        </h3>
        <p class="mt-1 text-p-base text-ink-gray-6">
          The more you write, the more partners can quote a figure instead of a meeting.
        </p>
      </div>

      <div class="mt-4 space-y-4">
        <!-- ⚠️ A BAND, NOT A FIGURE. See the note in `data/custom.js` —
             a free number invites a placeholder, and partners price
             against placeholders. -->
        <FormControl
          type="select"
          :model-value="brief.budget"
          label="Your budget"
          placeholder="Select a range"
          required
          :options="bands"
          :error="briefProblems.budget"
          @update:model-value="emit('update-brief', { budget: $event })"
        />
        <div>
          <!-- ⚠️ ONE BOX, AND THE PLACEHOLDER DOES THE WORK. The three
               named prompts this replaces are still the right
               questions; asking them as three fields on a card that
               also carries the criteria and the budget made it read as
               a form. They prompt from inside the placeholder instead,
               where they occupy nothing. -->
          <Textarea
            :model-value="brief.scope"
            label="What do you want built?"
            placeholder="What do you make or sell, who are your customers, how does it run today, what keeps going wrong, and what must it connect to or prove?"
            :rows="6"
            required
            :error="briefProblems.scope"
            @update:model-value="emit('update-brief', { scope: $event })"
          />
          <!-- ⚠️ LIVE, AND IT REPLACES A FIXED `description`. A static
               line of advice is read once, before there is anything to
               advise about, and is invisible by the time it applies.
               This answers what is in the box: nothing yet, not
               language, too short, or specific about some of it and
               silent on the rest. See `scopeHint`.
               ⚠️ NOT THE `error` SLOT, and not a blocker. A brief that
               trips every heuristic here still sends, because the
               heuristic is a word list and the person writing knows
               their business. Amber says "this will cost you a
               workshop", red would say "you may not".
               ⚠️ SHADE 7 OF BOTH, measured rather than picked. The ink
               scales run light to dark and the low shades are pale
               enough to fail against white at this size: amber 5 is
               oklch lightness .72, amber 7 is .61. -->
          <p
            class="mt-1.5 text-p-sm leading-relaxed"
            :class="{
              'text-ink-gray-5': hint.tone === 'neutral',
              'text-ink-amber-7': hint.tone === 'warn',
              'text-ink-green-7': hint.tone === 'good',
            }"
          >
            {{ hint.text }}
          </p>
        </div>
      </div>
    </div>

    <!-- ⚠️ THE OTHER WAY THROUGH, in the column rather than the rail.
         The rail holds one commitment and its number; a second button
         up there would make them a pair of options and halve the first.
         Down here it reads as what it is, the route for somebody who
         would rather choose the firms themselves. -->
    <div class="mt-4">
      <Button
        variant="subtle"
        label="View all partners"
        :route="{ name: 'results' }"
      >
        <template #suffix><IconArrowRight class="size-4" /></template>
      </Button>
    </div>
  </section>

  </div>

  <aside
    class="mt-8 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-start"
  >
    <PackBasket
      v-if="view === 'packs'"
      :packs="packs"
      :region="region"
      :signed-in="store.signedIn"
      @checkout="checkout"
    />
    <!-- ── Who it reaches ──────────────────────────────────────────
         ⚠️ A RAIL, AND STICKY, for the reason the packs half has one: the
         button was at the foot of a card, so it left the screen while
         somebody read four sections about what they were about to do. The
         figure and the commitment stay in view instead, and neither is
         ever printed twice. -->
    <div v-else class="rounded-6 border border-outline-gray-2 p-4">
      <template v-if="matches.length">
        <p class="text-3xl font-semibold tabular-nums text-ink-gray-8">
          {{ matches.length }}
        </p>
        <p class="mt-0.5 text-p-base text-ink-gray-7">
          {{ matches.length === 1 ? 'partner matches' : 'partners match' }} your criteria
        </p>
      </template>
      <template v-else>
        <p class="text-p-base text-ink-gray-7">No partner matches</p>
        <p class="mt-1 text-p-sm text-ink-gray-6">
          Loosen a criterion and the number comes back.
        </p>
      </template>

      <!-- ⚠️ NO COUNT IN THE LABEL, and it used to read "Send
           requirements to 13 partners". The count was on the button
           because the button is the commitment, but a label that grows
           with the data is a control whose width nobody designed. The
           figure above it is the same number from the same function. -->
      <Button
        class="mt-4 w-full"
        variant="solid"
        size="md"
        :disabled="matches.length === 0"
        label="Share requirements"
        @click="send"
      >
        <template #prefix><IconSend class="size-4" /></template>
      </Button>
      <p class="mt-3 text-p-sm text-ink-gray-6">
        They see your answers and requirements, not your company name or contact details.
      </p>
    </div>
  </aside>

  <!-- ── Everything below belongs to the LIST, not to the page ───
       ⚠️ IN THE COLUMN, NOT UNDER THE RAIL. The reasoning, "How this
       works", what a pack won't cover and the feedback row all ran the full
       width once, passing beneath the rail — and the rule above the feedback
       row made it plain, a full-width stroke drawn under a card it has
       nothing to do with. A right-hand rail is a sidebar; text that runs
       underneath one reads as text the sidebar is a part of. -->
  <!-- ⚠️ `mt-4` HERE PLUS `mt-16` ON EACH SECTION. The sections below are
       reference and reasoning, and they were separated from each other and
       from the thing above them by the same 32 to 40px the parts INSIDE a
       section use. At that spacing a page of eight headings reads as one
       long column of text with bold lines in it; the eye needs a gap it can
       tell from a paragraph break to know a subject has changed. -->
  <div class="mt-4 w-full lg:mx-auto lg:max-w-[720px]">
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
    <PackSteps
      class="mt-16"
      :title="view === 'packs' ? 'How this works' : 'How custom implementations work'"
      :steps="view === 'packs' ? PACK_STEPS : CUSTOM_STEPS"
    />

    <!-- ── Why, after the thing itself and after how it works ─────
         ⚠️ IT NOW SITS BELOW "How this works", and it sat directly under
         the card before that. The old note argued that somebody who doubts
         the recommendation scrolls and should find the working immediately
         under the button they declined to press, which is true and is not
         the first question: before "why me" comes "what am I being asked to
         do". The three beats answer that in one line each, and the case for
         the choice reads better after them than in front of them.
         ⚠️ THIS ALSO USED TO SIT UNDER THE HEADLINE, above everything. The
         reasoning was that a recommendation whose justification is below the
         price list is a price list — which is true of a screen with no
         headline. This one opens with the verdict as its first line, so the
         claim IS made before anything can be bought; what sat under it was
         the WORKING, and two sentences of working between a claim and the
         thing it is about delays the only part most people came for.
         Someone who accepts the recommendation never needs to read this.
         Someone who doubts it scrolls, and finds it directly under the
         button they declined to press. -->
    <section class="mt-16">
      <!-- ⚠️ A HEADING, which this block did not need when it sat under the
           headline — the position said what it was. Below a price and a
           button it needs saying.
           ⚠️ TWO OF THEM, because the block holds two different things. On
           the recommended path it is the case FOR what is above it. On the
           overridden one it is the case AGAINST — "we'd have said a pack
           covers this" — and printing that under "Why we're recommending
           this" would have the screen arguing against its own heading. -->
      <h2 class="text-lg font-semibold text-ink-gray-8">
        {{ overridden ? "What we'd have recommended" : 'Why we think this is the best choice for you' }}
      </h2>

      <!-- ⚠️ TICKS, AND THEY WERE REMOVED ONCE. The argument then was that a
           check reads as "included" and dresses evidence as a spec sheet.
           What the unmarked list actually produced was three sentences with
           no left edge, indistinguishable from the standfirst above them —
           the section had a heading and no structure. The design marks each
           reason, and a mark is what makes a list of reasons scannable as a
           list. The generic block below carries a different mark for the
           same reason: these two lists are not the same kind of claim.
           ⚠️ `max-w-[62ch]`, against the page's own 800px. At the full
           measure these ran to about 110 characters a line. -->
      <ul v-if="!overridden" class="mt-3 max-w-[62ch] space-y-2.5">
        <li v-for="(reason, i) in reco.reasons" :key="i" class="flex gap-2.5">
          <IconCheck class="mt-1 size-4 shrink-0 text-ink-gray-5" />
          <span class="text-p-base leading-relaxed text-ink-gray-7">{{ reason }}</span>
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
      <!-- ⚠️ A frappe-ui `Button`, and it was a bare `<button>` with an
           underline class. There is no underlined text button in the design
           system, so every one of them here was a control this page drew
           itself: same job as a `Button`, different height, different focus
           ring, no disabled state.
           ⚠️ `subtle`, not `ghost`, and every secondary control on this page
           matches. A ghost button is a label with a hover state, which is
           the thing the underlined text already was. -->
      <Button class="mt-3" variant="subtle" label="Change my answers" @click="rethink" />
    </section>

    <!-- ── Why each pack ─────────────────────────────────────────
         ⚠️ ITS OWN SECTION, and it was a second group inside the one above.
         Those reasons say why a pack at all, these say why THIS one — two
         kinds of claim that read as one list with a hole in it when they
         shared a heading. It used to hide in a tooltip on the Recommended
         badge before that. Each leads with the pack's name so the line can
         be matched to its row. Packs only, and not once overridden: then
         nothing on screen is our recommendation. -->
    <section v-if="!overridden && view === 'packs' && reco.packs.length" class="mt-16">
      <h2 class="text-lg font-semibold text-ink-gray-8">
        {{ reco.packs.length > 1 ? 'Why we recommend these packs' : 'Why we recommend this pack' }}
      </h2>
      <ul class="mt-3 max-w-[62ch] space-y-3">
        <li v-for="r in reco.packs" :key="r.pack.value">
          <p class="text-p-base font-medium text-ink-gray-8">{{ r.pack.name }}</p>
          <p class="mt-0.5 text-p-base leading-relaxed text-ink-gray-7">{{ r.reason }}.</p>
        </li>
      </ul>
    </section>

    <!-- ── True of every pack ──────────────────────────────────────
         ⚠️ ONCE, FOR ALL THREE PACKS, and it used to be three times. Every
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
         ⚠️ THE SWITCH TO THE OTHER SERVICE IS NOT IN HERE ANY MORE. It
         hung off the second group, which put the way out of packs inside a
         block about what packs include; it is in the fit tests below, under
         the four lines that are the argument for taking it. -->
    <PackCoverage v-if="view === 'packs'" class="mt-16 block" />

    <!-- ── Which service, and when the other one is right ─────────
         ⚠️ ITS OWN SECTION, AND IT WAS THE SECOND HALF OF A COLUMN. It sat
         under "Not included" inside "True of every pack", which made the
         single most consequential thing on the screen — this pack cannot do
         your job, go and talk to somebody — read as the tail of a
         specification.

         ⚠️ IT ARGUES FOR THE OTHER SERVICE, AND IT BRIEFLY ARGUED FOR THIS
         ONE. Both halves were printing "Consider a custom implementation
         if" off one list, which is right on the packs half and absurd on
         the custom half: a screen recommending custom work, listing the
         reasons to choose custom work, under a heading inviting you to
         consider it. The four tests are the LINE between the services, so
         which side of it is worth printing is decided by which side the
         reader is on. See `PACK_FIT_TESTS` — one list, two readings.

         ⚠️ THE SWITCH IS IN HERE, and it was a naked button 64px below.
         The list is the argument and the button is what you do about it;
         separated by a section gap they read as two subjects, and the
         button lost the four lines that were its whole reason.

         ⚠️ THE QUALIFIERS ARE TOOLTIPS. "You provide clean Excel or CSV
         data" is the sentence that decides whether data migration is your
         problem, and as a grey sub-line under every second item it turned a
         scannable list into a paragraph. On hover it is there for the
         person whose eye stopped on that row. -->
    <PackFitTests class="mt-16 block" :side="view">
      <!-- ⚠️ ONE BUTTON FOR FOUR CASES, and it was two buttons in two
           places. Whichever half you are on it does the same thing, swap to
           the other one, and the only thing that changes is whether that is
           a step away from our advice or back to it.
           ⚠️ Still a button and not a tab. Tabs say "these are two equal
           things"; this screen has just said they are not. -->
      <Button
        class="mt-5"
        variant="subtle"
        :label="
          overridden
            ? 'Back to what we recommend'
            : view === 'packs'
              ? 'Get quotes from partners instead'
              : 'Look at the packs anyway'
        "
        @click="view = view === 'packs' ? 'custom' : 'packs'"
      />
        </PackFitTests>

    <!-- ── What you are agreeing to ───────────────────────────────
         ⚠️ THE TERMS ARE ON THE SCREEN THAT SELLS, and until now they were
         one navigation away on the pack's own page. This is where Check out
         is pressed: a price, a total and a button, with the hourly rate for
         an overrun, the 50 user ceiling and "anything outside this is a
         change request" all on a page somebody had no reason to open.
         Disclosed rather than printed, for the reason `PackTerms` gives.
         ⚠️ PACKS ONLY. There is nothing to agree to yet on the custom half:
         the terms of that engagement are the partner's and do not exist
         until one has quoted. -->
    <PackTerms v-if="view === 'packs'" class="mt-16 block" :region="region" />

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
    <div class="mt-16">
      <h2 class="text-lg font-semibold text-ink-gray-8">Still unsure?</h2>
      <!-- ⚠️ THROUGH THE ROUTER, and it used to open a new tab. The
           contact page is mocked inside this prototype, so the tab was not
           leaving for the real site — it was opening a second copy of the
           same prototype beside the one under review. See the note in
           `FrappeSitePage`. -->
      <Button class="mt-3" variant="subtle" label="Contact Frappe" :route="{ path: '/contact' }">
        <template #prefix><img :src="frappeMark" alt="" class="size-4" /></template>
        <template #suffix><IconArrowRight class="size-4" /></template>
      </Button>
    </div>

    <!-- ── Was this right? ─────────────────────────────────────────── -->
    <!-- ⚠️ ONE LINE, at the bottom, and it disappears once answered. It is
         the highest-value feedback in the app — the only signal that the
         engine rather than a partner got something wrong — and it is worth
         exactly one line of a screen whose job is something else. -->
    <div v-if="showFeedback" class="mt-16 border-t border-outline-gray-2 pt-6">
      <!-- ⚠️ "Change my answers" IS NOT HERE, and it was. Both it and this
           row are about the answers rather than the products, which is why
           they were paired — but they are different ACTS. This asks Frappe a
           question; that one changes your own data and re-runs the engine.
           On one line the correction read as a third response to "Does this
           look right?", which is the one thing it is not. It sits under the
           reasons now, where an answer is actually noticed to be wrong. -->
      <div v-if="!answered" class="flex flex-wrap items-center gap-3">
        <p class="text-p-base text-ink-gray-6">Help us improve our recommendations. Was this one right for you?</p>
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
    <PartnerFiltersDialog
      v-model:open="showFilters"
      :brief="brief"
      :answers="answers"
      @patch="emit('update-brief', $event)"
    />
  </div>
</template>
