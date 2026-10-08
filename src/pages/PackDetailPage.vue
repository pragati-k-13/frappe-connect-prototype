<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PackScope from '../components/PackScope.vue'
import PackCartPanel from '../components/PackCartPanel.vue'
import { FACT_ICONS } from '../packFactIcons'
import { appLogo } from '../data/apps'
import IconCheck from '~icons/lucide/check'
import IconPlus from '~icons/lucide/plus'
import IconBag from '~icons/lucide/shopping-bag'
import IconTime from '~icons/lucide/clock'
import IconPrice from '~icons/lucide/tag'
import IconInvoice from '~icons/lucide/receipt-text'
import IconPurchase from '~icons/lucide/truck'
import IconStock from '~icons/lucide/package'
import IconBooks from '~icons/lucide/landmark'
import IconBom from '~icons/lucide/layers'
import IconFactory from '~icons/lucide/factory'
import IconCore from '~icons/lucide/blocks'
import IconEmployee from '~icons/lucide/user-round'
import IconAttendance from '~icons/lucide/calendar-check'
import IconExpense from '~icons/lucide/receipt'
import IconSalary from '~icons/lucide/banknote'
import {
  STARTER_PACKS,
  SESSIONS_PER_PACK,
  packFacts,
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
// it costs, what it gets you, and what is in it. A fixed scope is a
// contract somebody may want to cite or send to a colleague, and a URL is the
// only way to do either.
//
// ⚠️ IT SELLS NOW, and it said it didn't. This page is read twice: skimmed on
// the first visit, checked line by line before checkout. The scope alone only
// served the second read — twenty rows of doctype names at one weight, with
// nothing for a skimming eye to land on. So the page leads with outcomes in
// the buyer's words, each module opens with one sentence, and the doctype
// lists are the layer underneath for the careful read.
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
// ⚠️ Price and effort only — the delivery window is dropped from the pack
// page. `packFacts` still returns it for the other surfaces that show it.
//
// ⚠️ Effort reads as hours AND sessions here: "10 hrs within 5 sessions".
// Every pack is delivered within `SESSIONS_PER_PACK`, a ceiling rather than a
// count. Only on this page;
// `packFacts` still words it in hours alone for the other surfaces. Its mark is
// the catalogue card's clock, not the shared hourglass, so the two pages a
// buyer moves between show time the same way.
const facts = computed(() =>
  pack.value
    ? packFacts(pack.value, region.value)
        .filter((f) => f.key !== 'delivery')
        .map((f) =>
          f.key === 'effort'
            ? { ...f, line: `${pack.value.hours} hrs within ${SESSIONS_PER_PACK} sessions` }
            : f,
        )
    : [],
)

// ⚠️ THIS ADDS TO THE BASKET AND GOES TO THE BASKET — it does not buy, and it
// does not go straight to a checkout either. Both were true of earlier versions
// of this button and both are wrong now that packs are bought in combinations:
// somebody reading the Manufacturing scope is very often about to read the HR
// one, and a button that jumps them to a payment screen ends that.
//
// ⚠️ NO AUTH GATE. Adding a pack to a basket is not a fact about an account, and
// the catalogue it lands on, basket beside it, is open to a signed-out
// visitor. The gate is the checkout.
const addToBasket = () => {
  if (!pack.value) return
  if (!inBasket.value) store.togglePack(pack.value.value)
  router.push({ name: 'packs' })
}

// ⚠️ Once added, the button is the catalogue card's: "Added" with a check,
// subtle, and clicking it takes the pack back out — here, on the page. Same
// state, same control, wherever a pack is shown.
const removeFromBasket = () => pack.value && store.togglePack(pack.value.value)

// The basket, from here: the count of packs in it, and the bag that opens it as
// a drawer — `PackCartPanel`, in the shell's right-hand panel — with the
// checkout at its foot.
const basketCount = computed(() => store.packs.length)
const cartOpen = ref(false)

// This page's marks for the price and time facts, over the shared set:
// see the notes where they render.
const PAGE_FACT_ICONS = { price: IconPrice, effort: IconTime }

// The marks for "What this pack gets you", keyed by each outcome's `icon`.
// Icons live here rather than in `data/packs.js`, which stays plain data.
const OUTCOME_ICONS = {
  invoice: IconInvoice,
  purchase: IconPurchase,
  stock: IconStock,
  books: IconBooks,
  bom: IconBom,
  factory: IconFactory,
  core: IconCore,
  employee: IconEmployee,
  attendance: IconAttendance,
  expense: IconExpense,
  salary: IconSalary,
}
</script>

<template>
  <!-- ⚠️ No `flush` any more. That prop existed to hand the region over to a
       page that ran its own scrollers side by side — content left, pack panel
       right. There is one column now, so the shell's own ScrollArea is the
       right one, and this page takes the same 800px measure as the catalogue
       it came from — it needs it now, for a screenshot beside each module's
       list. -->
  <!-- ⚠️ The crumb is the PACK, not "Confirm selection". That label named an
       action this page stopped performing when checkout took the purchase —
       it said Confirm while the button under it said Continue to checkout.
       Naming the current page after the thing it shows is also what the partner
       profile does ("Partners / Tridots Tech"). -->
  <ConnectShell
    root-label="Starter Packs"
    root-to="/connect/packs"
    :crumb="pack ? pack.name : 'Starter Pack'"
  >
    <div class="fc-page-list py-8">
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
        <!-- ── Hero ─────────────────────────────────────────────────────────
             The pack's name is the headline — it is what the breadcrumb, the
             basket and the checkout call it — and `tagline` is the line under
             it, the same one the catalogue card and the dialog print.

             Same vocabulary as the catalogue's hero — the app mark, a balanced
             semibold headline in gray-9 with tight tracking, a gray subline —
             set one step larger, because this is the page for one pack.

             ⚠️ The button sits level with the headline, at the right edge: the
             act is held beside the name it acts on, out of the column that
             describes it. A GRID so it can be placed there while staying LAST
             in the markup — below `sm` there is no grid, source order is the
             reading order, and the button lands after the facts instead of
             between the name and its tagline. -->
        <header class="pt-6 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8">
          <img
            :src="appLogo(pack.apps[0])"
            alt=""
            class="size-8 object-contain sm:col-span-2 sm:row-start-1"
          />

          <h1
            class="mt-5 max-w-[24ch] text-balance text-[22px] font-semibold leading-[1.15] tracking-tight text-ink-gray-9 sm:col-start-1 sm:row-start-2"
          >
            {{ pack.name }}
          </h1>
          <p class="mt-3 text-p-lg text-ink-gray-6 sm:col-span-2 sm:row-start-3">
            {{ pack.tagline }}
          </p>

          <!-- `items-baseline`: the price is 16px and the other two 14px, and
               centring them set the price's baseline a pixel off theirs. -->
          <ul
            class="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2 sm:col-span-2 sm:row-start-4"
          >
            <li v-for="f in facts" :key="f.key" class="flex items-center gap-2">
              <!-- ⚠️ The price's mark is a TAG, not the shared circled DOLLAR
                   sign, which sat beside a rupee figure. A tag names no
                   currency, and `banknote` is taken — it is Payroll's. -->
              <component
                :is="PAGE_FACT_ICONS[f.key] ?? FACT_ICONS[f.key]"
                class="size-4 shrink-0 text-ink-gray-6"
                aria-hidden="true"
              />
              <!-- ⚠️ The figure alone, no tax: this page says what the pack costs,
                   and the basket and checkout add and show the tax. -->
              <span
                v-if="f.key === 'price'"
                class="text-lg font-semibold tabular-nums text-ink-gray-9"
              >
                {{ f.value }}
              </span>
              <span v-else class="text-p-base text-ink-gray-8">{{ f.line }}</span>
            </li>
          </ul>

          <div
            class="mt-6 flex items-center gap-2 sm:col-start-2 sm:row-start-2 sm:mt-5 sm:self-center"
          >
            <!-- "Add" with a +, as on the catalogue card and in the pack
               dialog: packs are bought in combinations, so the gesture adds
               to a basket that holds the others. Once in, it is the card's
               "Added" — see `removeFromBasket`. -->
            <Button
              size="md"
              :variant="inBasket ? 'subtle' : 'solid'"
              :label="inBasket ? 'Added' : 'Add'"
              @click="inBasket ? removeFromBasket() : addToBasket()"
            >
              <template #prefix>
                <IconCheck v-if="inBasket" class="size-4" />
                <IconPlus v-else class="size-4" />
              </template>
            </Button>

            <!-- ⚠️ A BAG, not a cart: `shopping-cart` is the Buying module's
                 mark, and Buying is a module heading further down this page.
                 Subtle, so it never competes with the solid "Add"; the count
                 is text beside the icon rather than a coloured badge, and an
                 empty basket shows the bag alone — "0" is noise. -->
            <!-- ⚠️ The count is the DEFAULT SLOT, not `label`: frappe-ui sets
                 `aria-label` from `label` when there is one, so a label of "2"
                 had a screen reader announce "2". -->
            <Button
              size="md"
              variant="subtle"
              tooltip="Your packs"
              :aria-label="basketCount ? `Your packs, ${basketCount} added` : 'Your packs'"
              :icon="basketCount ? undefined : IconBag"
              :aria-expanded="cartOpen"
              @click="cartOpen = !cartOpen"
            >
              <template v-if="basketCount" #prefix>
                <IconBag class="size-4" aria-hidden="true" />
              </template>
              <span v-if="basketCount" class="tabular-nums">{{ basketCount }}</span>
            </Button>
          </div>
        </header>

        <!-- ── This pack, module by module ────────────────────────────────
             `PackScope` renders the scope document and knows nothing about
             where it is mounted — it has been a dialog body, a side panel and
             now a page section, without a line changing inside it. Everything
             is collapsed, which is what keeps a ~2000px document to a heading
             and a list of named modules. -->
        <section class="mt-24" aria-label="What this pack covers">
          <PackScope :pack="pack" />
        </section>

        <!-- ── What this pack gets you ───────────────────────────────────
             LAST, after the modules: the modules say what is in the pack, and
             this closes on what that adds up to.
             An icon, then the title on its own line and the body under it:
             four across, the titles level, the bodies free to take two lines
             without breaking the row's rhythm the way a run-in title did.
             Four across, one row: every pack has exactly four outcomes. Two
             columns below `lg`, where four would leave each ~150px wide. Written from the scope tables; see
             `outcomes` in the data. -->
        <!-- `pb-24`: the page ends here, and the last row wants air under it
             rather than stopping at the window's edge. -->
        <section class="mt-36 pb-24">
          <h2 class="text-lg font-semibold text-ink-gray-8">What this pack gets you</h2>
          <ul class="mt-8 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            <li v-for="item in pack.outcomes" :key="item.title">
              <component
                :is="OUTCOME_ICONS[item.icon]"
                class="size-5 text-ink-gray-7"
                aria-hidden="true"
              />
              <p class="mt-3 text-base font-medium text-ink-gray-8">{{ item.title }}</p>
              <p class="mt-1 text-pretty text-p-base text-ink-gray-6">{{ item.body }}</p>
            </li>
          </ul>
        </section>

        <!-- How it works, True of every pack and the terms are on the
             recommendation screen, where the basket is checked out — not
             repeated here, so the shared lists have one place to drift from. -->
      </template>
    </div>
    <template v-if="cartOpen && pack" #panel>
      <PackCartPanel :region="region" @close="cartOpen = false" />
    </template>
  </ConnectShell>
</template>
