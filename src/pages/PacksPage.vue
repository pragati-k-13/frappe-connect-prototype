<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Tooltip } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PackBasket from '../components/PackBasket.vue'
import PackPickList from '../components/PackPickList.vue'
import PackScopeDialog from '../components/PackScopeDialog.vue'
import IconPricing from '~icons/lucide/circle-dollar-sign'
import IconSpeed from '~icons/lucide/clock'
import IconOversight from '~icons/lucide/circle-check'
import { useConnectStore } from '../stores/connect'
import {
  INCLUDED_IN_ALL,
  STRICTLY_EXCLUDED,
  asExclusion,
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

// The three reasons a pack is the right shape for a small business, from the
// design. Kept as data so the row is one thing to render rather than three
// copies of the same markup.
//
// ⚠️ The only `.fc-col-3` row left on this page. "How it works" used the same
// class and sat under the packs; it moved to the pack page, where the button it
// describes is. The class is still shared across the two screens — see
// `index.css` for the column split, which is measured against both.
const POINTS = [
  { icon: IconPricing, title: 'Standardized pricing', body: 'Based on region' },
  // ⚠️ The middle cell is the tight one: it's the only one padded on both
  // sides, so it gets 48px less than its neighbours. This copy needs 180px for
  // the title and 185 for the subtext, which the 800px measure affords and 720
  // did not — narrow the page again and both of these wrap.
  { icon: IconSpeed, title: 'Faster implementation', body: '3x faster to get started' },
  { icon: IconOversight, title: 'Frappe oversee', body: 'Quality at every step' },
]

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


// ⚠️ THE GATE IS THE CHECKOUT, not this page. Reading and picking need no
// account; paying does. Same `?next=` as the recommendation screen, so the two
// entry points to the same purchase behave identically.
const checkout = () => {
  if (!store.packs.length) return
  if (!store.signedIn) {
    return router.push({ name: 'signup', query: { next: '/connect/checkout' } })
  }
  router.push({ name: 'checkout' })
}
</script>

<template>
  <ConnectShell root-label="Starter Packs" root-to="/connect/packs">
    <!-- ⚠️ 1080 NOW, AND IT WAS 800. The basket moved out of the page and
         into a rail beside it, which is 300px plus a `gap-8`; at 800 that would
         have taken the list down to 468 and turned a row with a price at its
         right edge into two lines. Same width as the recommendation screen,
         which is the other page in the app that carries one. -->
    <div class="mx-auto w-full max-w-[1080px] px-5 py-8 lg:px-10">
      <!-- ⚠️ THE COLUMN HOLDS THE WHOLE PAGE, not just the list. On the
           recommendation screen the rail sits beside one section and stops
           being sticky where that section ends; here the reader is picking
           packs the whole way down — the exclusions and the scope link below
           are part of that decision — so the rail runs the length of it and
           the total stays in view for all of it.
           ⚠️ NO RAIL UNTIL THERE IS A BASKET. An empty column of a "0 packs"
           card is a price tag for nothing, and the flex row simply gives the
           width back to the list. -->
      <div class="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div class="min-w-0 flex-1">
      <h1 class="text-2xl font-semibold text-ink-gray-8">
        Hit the ground running with Starter Packs for ERPNext
      </h1>
      <p class="mt-2 max-w-[560px] text-p-base text-ink-gray-6">
        Small businesses have limited needs, users and timelines. A no-frills implementation with
        minimal customization is usually enough, and that is what a Starter Pack is.
      </p>

      <!-- Rules BETWEEN the three, not around them: they're one row of three
           readings, and a box would make them a card. Stacked below `sm`, where
           the divider turns horizontal for the same reason. -->
      <dl class="fc-col-3 mt-7">
        <div v-for="point in POINTS" :key="point.title">
          <!-- `items-start`, so a title that wraps keeps its icon beside the
               FIRST line rather than centred against both. -->
          <dt class="flex items-start gap-2 text-base font-medium text-ink-gray-7">
            <component :is="point.icon" class="size-4 shrink-0 text-ink-gray-6" />
            {{ point.title }}
          </dt>
          <!-- `pl-6` is the icon's 16px plus the 8px gap, so the second line
               starts under the title rather than under the icon. -->
          <dd class="mt-1 pl-6 text-p-base text-ink-gray-6">{{ point.body }}</dd>
        </div>
      </dl>

      <section class="mt-24">
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="text-base font-semibold text-ink-gray-7">Starter Packs for your region</h2>
          <!-- ⚠️ ONE LINE SAYING THE LIST IS MULTI-SELECT, and it earns its
               place because checkboxes alone do not say it: four of them read
               as four independent yes/no purchases, not as one basket. It is
               here rather than as a standfirst under the h1 — the fact is about
               this list, and it is read on the way into it. -->
          <p class="shrink-0 text-p-sm text-ink-gray-5">Take as many as you need</p>
        </div>

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

      <!-- ── What every pack does and doesn't cover ─────────────────────
           Two columns either side of one rule, at equal weight. A pack is
           defined as much by its carve-outs as by its contents — that's why
           it's quick and cheap — so the right-hand column isn't a footnote.
           The rule sits on the grid's midline with the same 32px of air on
           each side, so it reads as between the two rather than attached to
           either. -->
      <section class="mt-24">
        <h2 class="text-base font-semibold text-ink-gray-8">
          True of every pack
        </h2>

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
              v-for="item in STRICTLY_EXCLUDED.map(asExclusion)"
              :key="item.label"
              class="flex items-start gap-2 text-p-base text-ink-gray-7"
            >
              <LucideX class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
              <span>
                {{ item.label }}
                <!-- The caveat rides in a tooltip rather than in the line: as
                     parenthetical text it was the longest item here by half
                     again, which made the one line with a condition on it the
                     loudest thing in the column. -->
                <!-- ⚠️ The trigger is the SPAN, not the icon. Lucide icons are
                     `fill="none"`, so the middle of a circle-i is a hole —
                     `elementFromPoint` at its centre returns nothing hoverable
                     and only the 1.5px strokes trigger. The wrapper gives it a
                     whole box to catch the pointer. -->
                <Tooltip v-if="item.hint" :text="item.hint">
                  <span class="ml-0.5 inline-flex -translate-y-px align-middle text-ink-gray-5">
                    <LucideInfo class="size-4 shrink-0" />
                  </span>
                </Tooltip>
              </span>
            </li>
          </ul>
        </div>

        <!-- ⚠️ Inert. It opens the Starter Pack scope document, which is where
             the commercial terms now live — payment in advance, GST, the extra
             hours rate, the under-50-users condition, the Frappe Cloud
             dependency. None of that appears on this page any more.
             The arrow leaves the app, same as the marketplace links. -->
        <div class="mt-6">
          <Button label="Read full scope">
            <template #suffix><LucideArrowUpRight class="size-4" /></template>
          </Button>
        </div>
      </section>
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
        <aside class="w-full shrink-0 lg:sticky lg:top-6 lg:w-[300px]">
          <PackBasket
            :packs="store.packs"
            :region="region"
            :signed-in="store.signedIn"
            @checkout="checkout"
          />
        </aside>
      </div>
    </div>
    <PackScopeDialog v-model:open="scopeOpen" :pack="scopeOf" />
  </ConnectShell>
</template>
