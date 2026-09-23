<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Button, Checkbox, Tooltip } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import IconPricing from '~icons/lucide/circle-dollar-sign'
import IconSpeed from '~icons/lucide/clock'
import IconOversight from '~icons/lucide/circle-check'
import { FACT_ICONS } from '../packFactIcons'
import { useConnectStore } from '../stores/connect'
import {
  STARTER_PACKS,
  packFacts,
  INCLUDED_IN_ALL,
  STRICTLY_EXCLUDED,
  asExclusion,
  checkoutFor,
  priceFor,
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

const packs = computed(() =>
  STARTER_PACKS.map((pack) => ({
    ...pack,
    price: priceFor(pack, region.value),
    // ⚠️ Worded by `packFacts`, not here — four screens of one purchase were
    // describing the same pack four ways. The price is dropped from the list
    // because the row prints it large two lines above; effort and validity are
    // what the name and the price don't say.
    //
    // ⚠️ NO MODULE LINE either. Each pack is named by its modules, and the row
    // printed that name three lines above this list — "Accounts, Sales,
    // Purchase, Stock" as the heading, then "Accounts, Sales, Purchase and
    // Stock modules" as a fact about it.
    details: packFacts(pack, region.value).filter((f) => f.key !== 'price'),
  })),
)

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

const bill = computed(() => checkoutFor(store.packRecords(), region.value))

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
    <!-- 800 and `py-8`, matching the partner list and the profile. This screen
         briefly ran at 720/py-10 and was the only one in the app that did. -->
    <div class="mx-auto w-full max-w-[800px] px-5 py-8 lg:px-10">
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
        <ul>
          <li
            v-for="pack in packs"
            :key="pack.value"
            class="fc-partner-row group relative -mx-3 rounded-4 px-3 transition-colors hover:bg-surface-gray-1"
          >
            <!-- ⚠️ THE PLACEHOLDER TILE IS GONE. Each row led with a 160px grey
                 square standing in for an illustration nobody has drawn — four
                 of them down the page that sells the product, and every row's
                 words indented past it. A placeholder taking a quarter of the
                 row costs more than the art would earn. Bring it back as a
                 leading column when there is something to put in it. -->
            <!-- ⚠️ THE PRICE IS A COLUMN, not a line in the middle of the row.
                 Four fixed-price products in a list are read by comparing them,
                 and a figure stacked under each name can't be: the eye has to
                 hunt down four different vertical positions. Right-aligned and
                 top-aligned with the name, the four prices form a column you
                 read straight down — which is the one thing this screen is for.

                 It is also what gives the row two ends again. With the tile
                 gone and the buttons gone, everything had collected in a
                 narrow ribbon at the left with 60% of the row empty beside
                 it. -->
            <div
              class="fc-partner-row-body flex items-start gap-4 border-b border-outline-gray-1 py-6 sm:gap-6"
            >
              <!-- ⚠️ NO `label` ON THE CHECKBOX. The row prints the pack's name
                   itself, in a heading, and letting the control print it too
                   put every name on the screen twice. `aria-label` keeps the
                   control named for anyone who cannot see the row. Same
                   decision, same wording, as the recommendation screen's rows.
                   `mt-1` lands the 14px box on the cap-height of an 18px
                   heading rather than on its baseline. -->
              <Checkbox
                class="mt-1"
                size="md"
                :model-value="store.packs.includes(pack.value)"
                :aria-label="pack.name"
                @update:model-value="store.togglePack(pack.value)"
              />
              <div class="min-w-0 flex-1">
                <!-- ⚠️ The anchor wraps the NAME only and stretches over the row
                     with `after:absolute after:inset-0`, the same device the
                     partner list uses. A link around the whole row would read
                     its price and every detail line as part of its accessible
                     name; this way the name is the name, and the hit area is
                     still the row. Nothing else in here is interactive, so
                     nothing has to climb back above the stretched layer. -->
                <!-- ⚠️ THE STRETCHED ANCHOR IS GONE (`after:absolute
                     after:inset-0`). It made the whole row one link, which is
                     right for a list whose only gesture is "open this" and
                     impossible beside a checkbox — the stretched layer sits
                     over the row and swallows every click that is not the
                     name, including the tick. The link is the name now, and the
                     row's hover fill stays as the affordance that it is a row. -->
                <h3 class="text-lg font-medium text-ink-gray-8">
                  <RouterLink
                    :to="{ name: 'pack', params: { id: pack.value } }"
                    class="hover:underline"
                  >
                    {{ pack.name }}
                  </RouterLink>
                </h3>
                <p class="mt-1 text-p-base text-ink-gray-6">{{ pack.tagline }}</p>

                <ul class="mt-4 space-y-1">
                  <li
                    v-for="detail in pack.details"
                    :key="detail.key"
                    class="flex items-start gap-2 text-p-base text-ink-gray-6"
                  >
                    <component
                      :is="FACT_ICONS[detail.key]"
                      class="mt-0.5 size-4 shrink-0 text-ink-gray-6"
                    />
                    {{ detail.line }}
                  </li>
                </ul>
              </div>

              <!-- `text-ink-gray-8`, a step darker than it was at `-7`: it is
                   now the only thing in its column and the row's second
                   anchor, rather than one line among four. -->
              <p class="shrink-0 text-lg font-semibold tabular-nums text-ink-gray-8">
                {{ pack.price }}
              </p>
            </div>
          </li>
        </ul>

        <!-- ── What it comes to ─────────────────────────────────────────
             ⚠️ UNDER THE LIST, not sticky and not a rail. The recommendation
             screen carries a sticky rail because it is 1080 wide and its reader
             has already decided to buy; this page is 800 and its reader is
             still reading. A bar chasing them down a catalogue would be selling
             at somebody still browsing — and the recommendation screen rejected
             exactly that bar for the same reason before settling on the rail.
             ⚠️ IT DOES NOT LIST THE PACKS. The rows above ARE the line items,
             with a price on each; repeating them here would be the third
             printing of the same four figures.
             ⚠️ The tax is named, and dropped where a market has no decided rate
             rather than invented — see `checkoutFor`. -->
        <div
          v-if="store.packs.length"
          class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-6 border border-outline-gray-2 p-4"
        >
          <div class="min-w-0">
            <p class="text-p-sm text-ink-gray-5">
              {{ store.packs.length }} {{ store.packs.length === 1 ? 'pack' : 'packs' }}
            </p>
            <p class="mt-0.5 text-2xl font-semibold tabular-nums text-ink-gray-9">
              {{ bill.total }}
            </p>
            <p class="mt-1 text-p-sm leading-relaxed text-ink-gray-5">
              <template v-if="bill.exact">{{ bill.subtotal }} plus {{ bill.taxLabel }}</template>
              <template v-else>{{ bill.subtotal }} before {{ bill.taxLabel }}</template>
              · {{ bill.hours }} hours
            </p>
          </div>
          <div class="shrink-0">
            <Button variant="solid" size="md" label="Check out" @click="checkout" />
            <p class="mt-2 text-p-sm text-ink-gray-5">Paid to Frappe, in full and up front.</p>
          </div>
        </div>
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
  </ConnectShell>
</template>
