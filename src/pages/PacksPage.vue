<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PackBasket from '../components/PackBasket.vue'
import PackPickList from '../components/PackPickList.vue'
import PackScopeDialog from '../components/PackScopeDialog.vue'
import PackCoverage from '../components/PackCoverage.vue'
import PackFitTests from '../components/PackFitTests.vue'
import PackSteps from '../components/PackSteps.vue'
import PackTerms from '../components/PackTerms.vue'
import frappeMark from '../assets/frappe.svg'
import { useConnectStore } from '../stores/connect'
import { basketReturnTo, useBasketReturn } from '../utils/auth'
import {
  packSteps,
  pricingFor,
  marketFor,
  DEFAULT_REGION,
} from '../data/packs'

// SCREEN — the Starter Pack catalogue.
//
// ── The idea ────────────────────────────────────────────────────────────────
// The four packs are DISJOINT and each is named by the modules in it, so the
// list is a menu rather than a ladder: a business that makes what it sells buys
// Accounts/Sales/Purchase/Stock and Manufacturing, and one that only needs to
// pay people buys Payroll on its own. Nothing here has to say what it adds to
// the row above, because no row contains another.
//
// That's what each row's `tagline` is for now — who the pack is for, since the
// heading already says what is in it.
//
// ── What lives here vs in the dialog ────────────────────────────────────────
// Anything TRUE OF EVERY PACK is on this page: what always ships and what never
// does. The dialog holds only what changes from pack to pack — the hours, the
// price, and the module-by-module scope. Repeating the common half in four
// dialogs made each one long enough to bury the part that actually differs.
//
// ⚠️ The commercial terms are on NEITHER any more. They're in the scope
// document behind "Read full scope", which means this page states no price
// condition at all: not the 18% GST on top, not payment in advance, not the
// under-50-users limit, not the Frappe Cloud dependency.
//
// There's no filter or search bar: four is the whole catalogue, and a control
// bar over four items is furniture.
const store = useConnectStore()

// The quiz asks for a region, so use it when it's been answered — pack prices
// are regional. Falls back to India, the only region whose pricing is real
// (see `data/packs.js`).
// ⚠️ The COUNTRY is read first, and it has to be. The geo dimension lives in
// two fields — `filters.countries` for the granular half, `answers.region` for
// the coarse one — and sign-up writes only the country. Reading regions alone
// meant anyone who arrived through sign-up fell through to the default and a
// German business was quoted in rupees under "for your region".
const region = computed(
  () => marketFor(store.filters.countries[0]) ?? store.answers.region[0] ?? DEFAULT_REGION,
)
const pricing = computed(() => pricingFor(region.value))


// "What's included", in a dialog over the list — as on the recommendation
// screen, so reading a scope does not cost the basket its place.
const scopeOf = ref(null)
const scopeOpen = ref(false)
const showScope = (pack) => {
  scopeOf.value = pack
  scopeOpen.value = true
}

// ── Picking more than one ───────────────────────────────────────────────────
// ⚠️ THE ROWS ARE MULTI-SELECT, and the catalogue was the last screen where
// they were not. The packs are DISJOINT slices of the module catalogue — that
// is the first thing said at the top of this file — so a business that makes
// what it sells needs two of them and one with staff needs three. A list of
// four one-at-a-time links made the reader buy the same way three times, and
// the recommendation screen four clicks away has had checkboxes and a total for
// weeks. Two screens selling the same four products disagreed about whether you
// could buy two.
//
// ⚠️ ONE BASKET, SHARED. `store.packs` is the same list the recommendation
// ticks and the checkout charges, so a pack ticked here is in the basket
// everywhere — and `seedRecommendedPacks` only fills an EMPTY basket, so
// visiting the recommendation afterwards will not overwrite what was chosen
// here.
//
// ⚠️ THE ROW IS NO LONGER ONE LINK. It used to be, with the anchor stretched
// over the whole row (`after:inset-0`) — which cannot survive a checkbox inside
// it: the stretched layer swallows every click that is not the name. So the
// name keeps the link and the row keeps the checkbox, and the two jobs the row
// now has — read this pack, buy this pack — have a target each.
const router = useRouter()
useBasketReturn()


// ⚠️ THE GATE IS THE CHECKOUT, not this page. Reading and picking need no
// account; paying does. Same `?next=` as the recommendation screen, so the two
// entry points to the same purchase behave identically.
const checkout = () => {
  if (!store.packs.length) return
  if (!store.signedIn) {
    return router.push({ name: 'signup', query: { next: basketReturnTo('/connect/packs') } })
  }
  router.push({ name: 'checkout' })
}
</script>

<template>
  <ConnectShell root-label="Starter Packs" root-to="/connect/packs">
    <!-- ⚠️ NO MEASURE HERE: the rail sits at the page's right edge and the
         column centres itself in what is left, as on the recommendation
         screen. -->
    <div class="w-full px-5 py-8 lg:px-8">
      <!-- ⚠️ THE COLUMN HOLDS THE WHOLE PAGE, not just the list. The
           reader is picking packs the whole way down — the exclusions and the scope link below
           are part of that decision — so the rail runs the length of it and
           the total stays in view for all of it.
           The column is capped and centred between the sidebar and the rail,
           so it sits midway whatever the window's width. -->
      <div class="grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:pl-8">
      <div class="w-full lg:mx-auto lg:max-w-[720px]">
      <h1 class="text-2xl font-semibold text-ink-gray-8">
        Hit the ground running with Starter Packs for ERPNext
      </h1>

      <!-- ⚠️ THE PACKS COME STRAIGHT AFTER THE HEADLINE, with no standfirst and
           no list heading: the headline already says what they are, and the
           rows are the page. `aria-label` stands in for the heading. -->
      <section class="mt-2" aria-label="Starter Packs">

        <!-- `divide-y` puts a rule BETWEEN rows and none after the last, which
             is exactly what the design asks for — no wrapper border to undo. -->
        <!-- ⚠️ THE ROW IS THE CONTROL. It used to end in two buttons — info to
             read, Get started to buy — which made a row of four packs carry
             eight targets for what is one decision each. Now the whole row
             opens the pack, and the page it opens holds both jobs: the scope
             to read and the Confirm to press.

             ⚠️ `fc-partner-row` / `fc-partner-row-body` are BORROWED from
             `PartnerRow`, as `ProjectRow` borrows them — same two-box
             arrangement, same CSS in `index.css`. The outer box carries the
             hover fill and bleeds 12px each side so the fill has room around
             the content; the inner box carries the rule at the content
             column's own width. The CSS hides the rules touching a hovered
             row, which is why there is no `divide-y` here. -->
        <!-- The same list as the recommendation screen and a draft — see
             `PackPickList`. No reasons here, so each row reads its tagline. -->
        <PackPickList
          :packs="store.packs"
          :region="region"
          @toggle="store.togglePack"
          @scope="showScope"
        />

      </section>

      <!-- ── Below the list: the recommendation screen's sections ─────
           ⚠️ THE SAME COMPONENTS, IN THE SAME ORDER, as `RecommendationView`
           under its list — how it works, what every pack covers, when custom
           work is the better fit, the terms, and a way to talk to someone.
           Both pages sell the same packs; drawing them twice was how the
           exclusions came to disagree. -->
      <PackSteps class="mt-24" title="How this works" :steps="packSteps(store.packsByFrappe)" />

      <PackCoverage class="mt-24 block" />
      <PackFitTests class="mt-24 block" side="packs">
        <Button
          class="mt-5"
          variant="subtle"
          label="Get quotes from partners instead"
          :route="{ name: 'contact-partners' }"
        />
      </PackFitTests>
      <PackTerms class="mt-24 block" :region="region" />
      <!-- ⚠️ Inert. It opens the Starter Pack scope document, the contract the
           terms above summarise. The arrow leaves the app, same as the
           marketplace links. -->
      <div class="mt-4">
        <Button label="Read full scope">
          <template #suffix><LucideArrowUpRight class="size-4" /></template>
        </Button>
      </div>

      <div class="mt-24">
        <h2 class="text-lg font-semibold text-ink-gray-8">Still unsure?</h2>
        <Button class="mt-3" variant="subtle" label="Contact Frappe" :route="{ path: '/contact' }">
          <template #prefix><img :src="frappeMark" alt="" class="size-4" /></template>
          <template #suffix><LucideArrowRight class="size-4" /></template>
        </Button>
      </div>
      </div>

        <!-- ── What it comes to ─────────────────────────────────────────
             ⚠️ A RAIL, AND IT WAS A BAND UNDER THE LIST. The note that used to
             sit here argued the opposite: a sticky total is selling at somebody
             who is still browsing, and this page is a catalogue rather than a
             decision. What that missed is that the list is MULTI-SELECT now.
             Ticking a fourth pack four rows below the total means the figure
             the ticking is about has left the screen, so the one thing the
             control needs to report is the one thing it cannot.
             ⚠️ IT DOES NOT LIST THE PACKS. The rows beside it ARE the line
             items, each with its price; repeating them here would be the third
             printing of the same four figures.
             ⚠️ The tax is named, and dropped where a market has no decided rate
             rather than invented — see `checkoutFor`. -->
        <!-- Always shown, like the recommendation screen's — see `PackBasket`. -->
        <aside class="lg:sticky lg:top-6 lg:self-start">
          <PackBasket
            :packs="store.packs"
            :region="region"
            @checkout="checkout"
          />
        </aside>
      </div>
    </div>
    <PackScopeDialog v-model:open="scopeOpen" :pack="scopeOf" />
  </ConnectShell>
</template>
