<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Button, Tooltip } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PackScope from '../components/PackScope.vue'
import IconChevronDown from '~icons/lucide/chevron-down'
import { FACT_ICONS } from '../packFactIcons'
import {
  STARTER_PACKS,
  packFacts,
  INCLUDED_IN_ALL,
  STRICTLY_EXCLUDED,
  CUSTOMER_RESPONSIBILITIES,
  asExclusion,
  commercialTermsFor,
  pricingFor,
  marketFor,
  DEFAULT_REGION,
} from '../data/packs'
import { useConnectStore } from '../stores/connect'
import { useAuthGate } from '../utils/auth'

// SCREEN — the pack you are about to buy.
//
// Not the last screen any more: checkout is, and the confirmation after it.
// This one says what the pack is and hands over — see the note on `checkout()`
// below for what moved out of it.
//
// ⚠️ THE PACK IS THE PAGE. This used to be a numbered "How this works" list at
// 700px with the pack held in a 352px aside — the sequence in front, the thing
// being bought in the margin. It is the other way round now: no steps at all,
// and the pack's own document runs the full measure. What someone needs before
// spending money is what they are spending it on.
//
// Three things in that order, and the order is the argument: what the pack
// covers module by module, what ships with every pack and what never does, then
// the terms. The first is this pack, the second is all four, the third is the
// contract — narrowest to widest, each one qualifying the one above it.
//
// ⚠️ Confirm sits under the price rather than at the foot of the document. With
// the scope collapsed this page is still two screens, and a buying gesture two
// screens below the thing it buys is a scroll hunt. The consequence is that the
// terms are below the button, which is why they are on the page at all rather
// than a click away in a panel.
const store = useConnectStore()
const { requireAccount } = useAuthGate()
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

// The three figures that decide whether to go on, worded by `packFacts` rather
// than here. This page used to compose its own — "10 hrs" over "Of
// implementation effort" while the catalogue two clicks back said "10 hrs of
// effort" and the booking panel two clicks forward said "60 days delivery
// time". One object, described one way, wherever it appears.
//
// ⚠️ Two lines per fact, which is what this row is for and the one-line lists
// elsewhere are not: each of these figures has a CONDITION on it — the price is
// ex-tax and goes to Frappe rather than the partner, the hours are the pack's
// and not the project's, the window runs from a date nobody has set yet — and
// this is the screen where those conditions are load-bearing.
//
// ⚠️ The notes are kept short because the price leads, and the price is in the
// narrow column: `.fc-col-3` is 0.85/1.15/1fr, tuned for the two rows that
// carry a long middle label. The notes either side take two lines at the 800px
// measure, which the equal cell heights absorb — but a longer one starts
// pushing the row's height around, so trim rather than add.
const facts = computed(() => (pack.value ? packFacts(pack.value, region.value) : []))

// The region's own word for its tax — "18% GST" in India, "local VAT" where no
// rate has been decided — read from the same rate card the checkout bills from.
const taxLabel = computed(() => pricingFor(region.value).tax)

// ⚠️ Region aware: the commercial terms name a tax and an hourly rate, and
// quoting a German buyer in rupees is the bug `commercialTermsFor` exists to
// prevent. Same two lists `PackPanel` shows on the screens after this one.
const terms = computed(() => [
  { key: 'commercial', label: 'Commercial terms', lines: commercialTermsFor(region.value) },
  { key: 'responsibilities', label: 'What we need from you', lines: CUSTOMER_RESPONSIBILITIES },
])

const notInScope = STRICTLY_EXCLUDED.map(asExclusion)

// What happens after "Continue to checkout" — the three beats between picking a
// pack and the work beginning. Numbered because this is genuinely a sequence,
// each step gated on the one before it, not because numbers look tidy.
//
// ⚠️ MOVED HERE FROM THE CATALOGUE, where it sat under the four packs. It is an
// answer to "what happens if I press this", and the button it is about is on
// this page — on the catalogue it explained a purchase you could not yet make,
// three sections below the rows that start one.
//
// ⚠️ Payment is FIRST, and it used to be second. The list ran introductory call
// → pay → coordinate, on the argument that meeting the partner Frappe assigned
// you before any money changed hands was the whole difference between this and
// being handed an invoice with a name on it. The order is the other way round
// now — you buy the pack from Frappe, and a partner is assigned against it — so
// the introductory call is no longer one of the three beats. It still exists in
// the flow, as the project's first task.
//
// ⚠️ Step 1 names WHO is paid, and this is the page's only statement of it.
// Step 2 hands you a partner, so an unqualified "pay in full" at the head of a
// list about partners reads as paying one.
const STEPS = [
  { title: 'Pay in full', body: 'To Frappe, upfront' },
  // ⚠️ The middle cell is the tight one — it is the only one padded on both
  // sides, so it gets 48px less than its neighbours, and 155px is what a title
  // has to fit. `.fc-col-3` is 0.85/1.15/1fr partly because of this line:
  // "Frappe assigns you a partner" measured 195 and took two lines while its
  // neighbours took one, and "Frappe assigns a partner" is still 167. See
  // `index.css`, and the points row on the catalogue, which shares the class.
  { title: 'Frappe assigns a partner', body: 'By industry and region' },
  { title: 'Coordinate with partner', body: 'Share data and processes' },
]

// ⚠️ THIS NO LONGER BUYS ANYTHING. It used to assign the partner, open the
// conversation, create the project and push the confirmed screen, all on one
// click — a purchase behind a button labelled Confirm, with no payment anywhere
// in the flow. It walks to the checkout now, and every one of those things
// happens there, after the money.
//
// ⚠️ The gate HOLDS the navigation, which the booking version deliberately did
// not: completing a purchase automatically on the far side of a sign-up form
// would spend someone's money for them, so that one made them come back and
// press it again. Landing on a checkout is not spending anything, so a new
// visitor signs up, verifies, and arrives where they were going. See
// `VerifyPage`, which routes the pack path here.
const checkout = () => {
  if (!pack.value) return
  requireAccount(() => router.push({ name: 'checkout', query: { pack: pack.value.value } }))
}
</script>

<template>
  <!-- ⚠️ No `flush` any more. That prop existed to hand the region over to a
       page that ran its own scrollers side by side — content left, pack panel
       right. There is one column now, so the shell's own ScrollArea is the
       right one, and this page takes the same 800px measure as the catalogue
       it came from. -->
  <!-- ⚠️ The crumb is the PACK, not "Confirm selection". That label named an
       action this page stopped performing when checkout took the purchase —
       it said Confirm while the button under it said Continue to checkout.
       Naming the current page after the thing it shows is also what the partner
       profile does ("Partners / Tridots Tech"). -->
  <ConnectShell
    root-label="Starter packs"
    root-to="/connect/packs"
    :crumb="pack ? pack.name : 'Starter pack'"
  >
    <div class="mx-auto w-full max-w-[800px] px-5 py-8 lg:px-10">
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

      <template v-else>
        <!-- ── What you are buying, and what it costs ─────────────────────
             ⚠️ ONE HORIZONTAL BAND, and the price is in it. This has now been
             three things, and the last two are why it is this one:

             A three-across `fc-col-3` row of price / hours / validity — the
             same ruled device the steps row uses sixty pixels below, so the
             page printed one shape twice, and the price was one of three equal
             columns on a screen whose next click is a payment.

             Then a two-column header with the price and the button boxed at the
             right. The box fixed a button that hung in mid-air, but it bought
             that by splitting the offer in half: the name and the work on one
             side, the money on the other, with the reader's eye crossing 300px
             of nothing between "30 days to deliver" and what it costs.

             Now the three facts are one line under the pitch — they are the
             same KIND of thing, the terms of one offer, and a row is what says
             so — and the action sits beside the title, level with the name it
             acts on. Everything that DESCRIBES the pack runs down the left at
             the page's own alignment; the one thing that acts on it is held out
             of that column.

             ⚠️ Gaps, not separators. Middots and ruled columns are both
             available and both wrong here: the first is meta-string furniture,
             the second is the device this row was already mistaken for.

             ⚠️ A GRID, not two flex columns, and the facts band is the reason.
             As a left column beside the button it lost the ~190px the button
             takes and wrapped its three items onto two lines — the one thing
             that row exists to avoid. Here the button is placed in row 1,
             column 2, and the band spans both columns, so it keeps the full
             measure.

             ⚠️ The button is LAST in the markup and placed back up by the grid.
             Below `sm` there is no grid, so source order is the reading order:
             title, pitch, facts, then the act. Written into the title's row it
             would land between the name and the pitch on a phone — the act
             before the description. -->
        <div class="sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8">
          <h1 class="text-2xl font-semibold text-ink-gray-8 sm:col-start-1 sm:row-start-1">
            {{ pack.name }}
          </h1>
          <!-- `pitch`, not `tagline`: this is the one line that says what the
               pack is FOR, and the scope below says what is in it. -->
          <p class="mt-2 max-w-[46ch] text-p-base text-ink-gray-6 sm:col-start-1 sm:row-start-2">
            {{ pack.pitch }}
          </p>

          <ul class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 sm:col-span-2 sm:row-start-3">
            <li
              v-for="f in facts"
              :key="f.key"
              class="flex items-center gap-2"
              :class="
                f.key === 'price'
                  ? 'text-base font-medium text-ink-gray-8'
                  : 'text-p-base text-ink-gray-6'
              "
            >
              <component
                :is="FACT_ICONS[f.key]"
                class="size-4 shrink-0 text-ink-gray-6"
                aria-hidden="true"
              />
              <!-- ⚠️ The price carries its tax and nothing else. "To Frappe,
                   before 18% GST" was two conditions in a column that has room
                   for one; the payee is the very next thing on the page — step
                   1 of How it works is "Pay in full / To Frappe, upfront" — and
                   the tax is the half a reader cannot work out for themselves.
                   The phrase comes from the region's own rate card, so a market
                   with no decided rate reads "+ local VAT". -->
              <span :class="f.key === 'price' && 'tabular-nums'">
                {{ f.key === 'price' ? `${f.value} + ${taxLabel}` : f.line }}
              </span>
            </li>
          </ul>

          <!-- ⚠️ `sm:mt-1` is optical, not structural: the grid puts the
               button's box on the heading's box, which sets it three pixels
               above the cap height it is meant to line up with.

               ⚠️ "Continue to checkout", not "Confirm". The click used to
               complete a purchase; it now opens the screen where the purchase
               is made, and a button that ends in a payment sheet should say
               where it is going.
               ⚠️ And no "Cancel" beside it. Nothing has been started on this
               page, so that control was offering to undo reading; the
               breadcrumb is how you go back to the packs. -->
          <Button
            class="mt-5 shrink-0 sm:col-start-2 sm:row-start-1 sm:mt-1 sm:justify-self-end"
            variant="solid"
            label="Continue to checkout"
            @click="checkout"
          />
        </div>

        <!-- ── How it works ───────────────────────────────────────────────
             Directly under the button it describes: this is what pressing it
             sets off, and on the catalogue it was three sections away from
             anything that could start it.

             ⚠️ An `<ol>`, not a `<dl>`, and the number sits BESIDE the text
             rather than inside the title's line. The avatar is 28px against a
             17px line, so with it inside the title the title's row was
             avatar-height and the 4px below it got measured from the avatar's
             bottom, not the text's. Out here the title and body are the only
             things in that column's flow, so the gap is exactly 4px whatever
             size the avatar is. `<ol>` is also the truer element: the numbers
             are a sequence.

             ⚠️ `mt-10`, not the `mt-24` the sections below it take. Those are
             three separate readings of the pack; this belongs to the button
             above it, and a 96px gap would file it as a fourth. -->
        <section class="mt-10">
          <h2 class="text-base font-semibold text-ink-gray-8">How it works</h2>

          <ol class="fc-col-3 mt-5">
            <li v-for="(step, i) in STEPS" :key="step.title" class="flex items-start gap-2">
              <!-- `label` renders only its first character, so a digit needs no
                   slot of its own. No vertical offset: the avatar and the title
                   share a top edge. -->
              <Avatar size="lg" :label="String(i + 1)" class="shrink-0" />
              <div class="min-w-0">
                <p class="text-base font-medium text-ink-gray-7">{{ step.title }}</p>
                <p class="mt-1 text-p-base text-ink-gray-6">{{ step.body }}</p>
              </div>
            </li>
          </ol>
        </section>

        <!-- ── This pack, module by module ────────────────────────────────
             `PackScope` renders the scope document and knows nothing about
             where it is mounted — it has been a dialog body, a side panel and
             now a page section, without a line changing inside it. Everything
             is collapsed, which is what keeps a ~2000px document to a heading
             and a list of named modules. -->
        <section class="mt-16">
          <h2 class="text-base font-semibold text-ink-gray-8">What this pack covers</h2>
          <div class="mt-5">
            <PackScope :pack="pack" />
          </div>
        </section>

        <!-- ── True of all four packs ─────────────────────────────────────
             Lifted from the catalogue, where its own note explains the split:
             what ships with every pack and what never does belongs to the
             range, not to this pack. It repeats here because this is the
             screen where the money moves, and a carve-out first read after
             paying is the complaint the whole flow exists to avoid. -->
        <section class="mt-16">
          <h2 class="text-base font-semibold text-ink-gray-8">True of every pack</h2>

          <div class="fc-col-2 mt-5">
            <ul class="space-y-2.5">
              <li
                v-for="item in INCLUDED_IN_ALL"
                :key="item"
                class="flex items-start gap-2 text-p-base text-ink-gray-7"
              >
                <LucideCheck class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
                {{ item }}
              </li>
            </ul>

            <ul class="space-y-2.5">
              <li
                v-for="item in notInScope"
                :key="item.label"
                class="flex items-start gap-2 text-p-base text-ink-gray-7"
              >
                <LucideX class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
                <span>
                  {{ item.label }}
                  <!-- ⚠️ The trigger is the SPAN, not the icon. Lucide icons are
                       `fill="none"`, so the middle of a circle-i is a hole and
                       only the 1.5px strokes would catch the pointer. Same
                       device as the catalogue. -->
                  <Tooltip v-if="item.hint" :text="item.hint">
                    <span class="ml-0.5 inline-flex -translate-y-px align-middle text-ink-gray-5">
                      <LucideInfo class="size-4 shrink-0" />
                    </span>
                  </Tooltip>
                </span>
              </li>
            </ul>
          </div>
        </section>

        <!-- ── What you are agreeing to ───────────────────────────────────
             ⚠️ Still disclosures, not printed lists, and they are below the
             Confirm button. Both are deliberate: the terms are on the page
             rather than behind a panel one navigation away, which is the
             change, but printing thirteen lines of contract under a purchase
             would bury the scope that answers what you are actually buying. -->
        <section class="mt-16">
          <h2 class="text-base font-semibold text-ink-gray-8">Terms and conditions</h2>

          <div class="mt-3 divide-y divide-outline-gray-1 border-y border-outline-gray-1">
            <!-- ⚠️ `<details>`, not a hand-rolled toggle: this version of
                 frappe-ui ships no accordion, and the native element brings the
                 open state, the keyboard behaviour and the semantics for free.
                 Same device as `PackScope` above it and `PackPanel` after it. -->
            <details v-for="t in terms" :key="t.key" class="group">
              <summary
                class="flex cursor-pointer list-none items-center gap-2 py-3 text-p-base font-medium text-ink-gray-7 [&::-webkit-details-marker]:hidden"
              >
                <span class="min-w-0 flex-1">{{ t.label }}</span>
                <IconChevronDown
                  class="size-4 shrink-0 text-ink-gray-5 motion-safe:transition-transform group-open:rotate-180"
                />
              </summary>
              <!-- Bulleted: each line is a separate term, read one at a time.
                   Without a mark, a term that wraps and the term after it look
                   the same. -->
              <ul class="list-disc space-y-1 pb-4 pl-5 marker:text-ink-gray-4">
                <li v-for="line in t.lines" :key="line" class="text-p-base text-ink-gray-6">
                  {{ line }}
                </li>
              </ul>
            </details>
          </div>
        </section>
      </template>
    </div>
  </ConnectShell>
</template>
