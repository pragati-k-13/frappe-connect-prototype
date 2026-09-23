<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PackScope from '../components/PackScope.vue'
import { FACT_ICONS } from '../packFactIcons'
import {
  STARTER_PACKS,
  packFacts,
  pricingFor,
  marketFor,
  DEFAULT_REGION,
} from '../data/packs'
import { useConnectStore } from '../stores/connect'

// SCREEN — the pack you are about to buy.
//
// Not the last screen any more: checkout is, and the confirmation after it.
// This one says what the pack is and hands over — see the note on `checkout()`
// below for what moved out of it.
//
// ⚠️ THE PACK IS THE PAGE, and now it is ONLY the pack. This carried four
// sections: the scope, How it works, True of every pack, and the terms. Every
// one of the last three is on the recommendation screen, and this page kept
// them on the argument that it was the screen where the money moved. It has not
// been for a while — a pack is added to a basket here and checked out two
// screens later — and four surfaces carrying the same two lists is four places
// for them to drift, which is the reason `PackTerms` was pulled into a
// component in the first place.
//
// What is left is what is true of THIS pack and no other: what it is for, what
// it costs, and what is in it. That is what a page per pack is for. A fixed
// scope is a contract somebody may want to cite or send to a colleague, and a
// URL is the only way to do either. The selling is done by the screens that
// sell.
//
// ⚠️ Confirm sits under the price rather than at the foot of the document. With
// the scope collapsed this page is still two screens, and a buying gesture two
// screens below the thing it buys is a scroll hunt. The consequence is that the
// terms are below the button, which is why they are on the page at all rather
// than a click away in a panel.
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
// ⚠️ THE URL IS THE ONLY SOURCE NOW. It used to fall back to a `store.pack`
// holding the one pack being bought; the basket is a list, and "which pack is
// this page about" is not answerable from a list. `:id` is the pack's own
// value, matching how a partner profile is addressed.
const pack = computed(() => STARTER_PACKS.find((p) => p.value === route.params.id) ?? null)

// ⚠️ Reading the basket, not writing it. Opening a pack's page is not adding it
// to anything — this screen is the scope document, and someone reads it to
// decide. The button below is the gesture that adds.
const inBasket = computed(() => Boolean(pack.value && store.packs.includes(pack.value.value)))

// Same market resolution as the catalogue — the intake's country first, since
// that is the question that asks it. See `marketFor` in `data/packs.js`.
const region = computed(
  () =>
    marketFor(store.company.country) ??
    marketFor(store.filters.countries[0]) ??
    store.answers.region[0] ??
    DEFAULT_REGION,
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
// ⚠️ The notes are kept short because the price leads. This band was a
// three-column `.fc-col-3` grid once and is a wrapping flex row now, so there
// are no equal cell heights left to absorb a long one: it wraps to a second
// line instead. Trim rather than add.
const facts = computed(() => (pack.value ? packFacts(pack.value, region.value) : []))

// The region's own word for its tax — "18% GST" in India, "local VAT" where no
// rate has been decided — read from the same rate card the checkout bills from.
const taxLabel = computed(() => pricingFor(region.value).tax)

// ⚠️ THIS ADDS TO THE BASKET AND GOES TO THE BASKET — it does not buy, and it
// does not go straight to a checkout either. Both were true of earlier versions
// of this button and both are wrong now that packs are bought in combinations:
// somebody reading the Manufacturing scope is very often about to read the HR
// one, and a button that jumps them to a payment screen ends that.
//
// ⚠️ NO AUTH GATE. Adding a pack to a basket is not a fact about an account, and
// the recommendation screen it lands on is deliberately open to a signed-out
// visitor. The gate is the checkout.
const addToBasket = () => {
  if (!pack.value) return
  if (!inBasket.value) store.togglePack(pack.value.value)
  router.push({ name: 'recommendation' })
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

               ⚠️ "Add to my packs", not "Continue to checkout" and not
               "Confirm". Each label matched what the button did at the time,
               and this one does too: packs are bought in combinations, so the
               gesture is adding one to a basket that already holds the others.
               The label changes once it is in, rather than the button
               disabling — a pack you have already added is still a route back
               to the total.
               ⚠️ And no "Cancel" beside it. Nothing has been started on this
               page, so that control was offering to undo reading; the
               breadcrumb is how you go back to the packs. -->
          <Button
            class="mt-5 shrink-0 sm:col-start-2 sm:row-start-1 sm:mt-1 sm:justify-self-end"
            variant="solid"
            :label="inBasket ? 'In your packs — review and check out' : 'Add to my packs'"
            @click="addToBasket"
          />
        </div>

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

        <!-- ⚠️ THREE SECTIONS USED TO FOLLOW THIS ONE — How it works, True
             of every pack, and the terms — and every one of them is now on the
             recommendation screen, which is where the money actually moves.
             This page kept them on the argument that it was that screen. It has
             not been for a while: packs are added to a basket here and checked
             out there, and four surfaces carrying the same two lists is four
             places for them to drift.

             What is left is the only thing that is TRUE OF THIS PACK AND NO
             OTHER: what it is for, what it costs, and what is in it. A pack's
             scope is a contract somebody may want to cite or send to a
             colleague, and that is what a page per pack is for. Selling is done
             by the screens that sell. -->
      </template>
    </div>
  </ConnectShell>
</template>
