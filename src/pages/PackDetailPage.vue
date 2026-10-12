<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Avatar, Button, TabButtons } from 'frappe-ui'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from 'reka-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PackCartPanel from '../components/PackCartPanel.vue'
import { appLogo } from '../data/apps'
import IconCheck from '~icons/lucide/check'
import IconBag from '~icons/lucide/shopping-bag'
import IconRupee from '~icons/lucide/receipt-indian-rupee'
import IconReconcile from '~icons/lucide/arrow-left-right'
import IconStatements from '~icons/lucide/chart-line'
import IconDocument from '~icons/lucide/file-text'
import IconBarcode from '~icons/lucide/scan-barcode'
import IconBom from '~icons/lucide/layers'
import IconWorkOrder from '~icons/lucide/clipboard-list'
import IconStock from '~icons/lucide/boxes'
import IconEmployee from '~icons/lucide/contact'
import IconLeave from '~icons/lucide/calendar-days'
import IconExpense from '~icons/lucide/receipt'
import IconTax from '~icons/lucide/percent'
import IconSalary from '~icons/lucide/wallet'
import {
  STARTER_PACKS,
  SESSIONS_PER_PACK,
  packFacts,
  marketFor,
  DEFAULT_REGION,
  PACK_SCOPE,
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
// nothing for a skimming eye to land on. So the page leads with the guidance
// the pack really sells, each module leads with three stars, and the rest of
// its scope is one plain line underneath.
//
// ⚠️ Confirm sits under the price rather than at the foot of the document. With
// the scope collapsed this page is still two screens, and a buying gesture two
// screens below the thing it buys is a scroll hunt. The consequence is that the
// terms are below the button, which is why they are on the page at all rather
// than a click away in a panel.
const store = useConnectStore()
const route = useRoute()

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

// ⚠️ THIS ADDS TO THE BASKET AND STAYS — it does not buy, go to a checkout, or
// leave the page. Packs are bought in combinations, and somebody reading the
// Manufacturing scope is very often about to read the HR one. Sending them back
// to the catalogue made the add invisible: the button flipping to "Added" and
// the bag's count going up are what show it worked.
//
// ⚠️ NO AUTH GATE. Adding a pack to a basket is not a fact about an account, and
// the catalogue it lands on, basket beside it, is open to a signed-out
// visitor. The gate is the checkout.
const addToBasket = () => {
  if (!pack.value) return
  if (!inBasket.value) store.togglePack(pack.value.value)
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

// The terms — price and hours — sit together under the name, beside Add, as
// one statement of the deal.
const price = computed(() => facts.value.find((f) => f.key === 'price')?.value)
const effortLine = computed(() => facts.value.find((f) => f.key === 'effort')?.line)

// ── The buy area: images left, the pack right ─────────────────────────────
//
// ⚠️ PLACEHOLDERS. Three frames for real images: the team in a session (the
// guidance is what the pack sells), ERPNext after setup, and a document the
// pack produces. The last one pins — see `pinTop`.
const SHOTS = [
  { key: 'session', icon: 'users', label: 'Photo placeholder: the implementation team in a session' },
  { key: 'erpnext', icon: 'dashboard', label: 'Image placeholder: ERPNext after setup' },
  { key: 'document', icon: 'invoice', label: 'Image placeholder: a GST invoice, close up' },
]

// Mixed sticky: BOTH columns are sticky, and whichever is shorter is the one
// that ends up pinned while the other scrolls past it. Each sticks by its
// BOTTOM edge: a `top` of "viewport minus the column's height" lets a tall
// column scroll until its end and pin there, and is capped at the gap under
// the bar, so a column shorter than the screen pins from the start. The
// taller column never pins — its grid row is its own height.
// The viewport is the page's own scroller, not the window: the shell's
// content frame is `overflow-hidden`.
const PIN_GAP = 32
const shotsCol = ref(null)
const packCol = ref(null)
const pinTop = ref({ shots: PIN_GAP, pack: PIN_GAP })
let resizer = null
let scroller = null
const topFor = (el) => Math.min(PIN_GAP, scroller.clientHeight - el.offsetHeight - PIN_GAP)
const measurePin = () => {
  if (!scroller || !shotsCol.value || !packCol.value) return
  pinTop.value = { shots: topFor(shotsCol.value), pack: topFor(packCol.value) }
}
onMounted(() => {
  scroller = shotsCol.value?.parentElement
  while (scroller && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) {
    scroller = scroller.parentElement
  }
  resizer = new ResizeObserver(measurePin)
  for (const el of [shotsCol.value, packCol.value, scroller]) if (el) resizer.observe(el)
  measurePin()
})
onBeforeUnmount(() => resizer?.disconnect())

// The highlight rows' marks — each the same icon its star had in the module
// cards, named in `highlights` in `data/packs.js`.
const HIGHLIGHT_ICONS = {
  'receipt-indian-rupee': IconRupee,
  'arrow-left-right': IconReconcile,
  'chart-line': IconStatements,
  'file-text': IconDocument,
  'scan-barcode': IconBarcode,
  layers: IconBom,
  'clipboard-list': IconWorkOrder,
  boxes: IconStock,
  contact: IconEmployee,
  'calendar-days': IconLeave,
  receipt: IconExpense,
  percent: IconTax,
  wallet: IconSalary,
}

// "Full scope": every module the pack covers, its items in three kinds —
// set up once, used every day, read from — see `fullScope` in `data/packs.js`.
const SCOPE_KINDS = [
  { key: 'setup', label: 'Setup' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'reports', label: 'Reports' },
]
// ⚠️ FULL SCOPE IS PARKED. Each module's scope is about to be cut down, and
// the right layout depends on how long the lists end up (short lists want
// everything visible; long ones want tabs). Until the scope is locked the
// section isn't rendered — a placeholder for developers stands in its place.
// Flip this to bring it back.
const SHOW_FULL_SCOPE = false

// ⚠️ REVIEW ONLY: two takes on Full scope, picked by `?scope=` so each has
// its own link. `tabs` (default) — module tabs over three filled cards;
// `cards` — one bordered accordion card per module, plain columns inside.
// Delete the loser and this switch once one is chosen.
const scopeLayout = computed(() => (route.query.scope === 'cards' ? 'cards' : 'tabs'))
const scopeTab = ref(null)
watch(
  () => pack.value?.value,
  () => (scopeTab.value = pack.value?.areas[0] ?? null),
  { immediate: true },
)
const scopeTabs = computed(() =>
  (pack.value?.areas ?? []).map((key) => ({ value: key, label: PACK_SCOPE[key].label })),
)

const scope = computed(() =>
  (pack.value?.areas ?? []).map((key) => ({
    key,
    label: PACK_SCOPE[key].label,
    ...PACK_SCOPE[key].fullScope,
  })),
)

// What customers said about each pack, in the partner profile's review format.
// ⚠️ PLACEHOLDER: every review, name and company below is INVENTED for the
// mock. Replace with real, consented reviews before this ships. They credit
// "the team", never Frappe, so they hold whoever implements the pack.
const REVIEWS = {
  'accounts-sales-purchase-stock': [
    {
      name: 'Priya Nair',
      company: 'Nair Textiles Pvt Ltd',
      text: 'We closed our first month in ERPNext with the bank reconciled and GST filed from it. Five sessions was enough to stop running two systems.',
    },
    {
      name: 'Arjun Mehta',
      company: 'Mehta Hardware Traders',
      text: 'Quotes, orders and invoices now come off one record. Item setup took longer than planned because our masters were messy, but the team sorted them with us.',
    },
  ],
  manufacturing: [
    {
      name: 'Rahul Deshmukh',
      company: 'Deshmukh Auto Components',
      text: 'Our BOMs lived in spreadsheets nobody trusted. By the last session, work orders were pulling materials from stock on their own.',
    },
    {
      name: 'Kavita Rao',
      company: 'Rao Packaging Industries',
      text: 'Job cards per workstation were the win for us. Ten hours felt tight for five modules, so come with your data ready.',
    },
  ],
  hrms: [
    {
      name: 'Anita Joseph',
      company: 'Brightpath Services',
      text: 'Payroll used to take us three days. Our first run took an afternoon, with every slip checked before it went out.',
    },
    {
      name: 'Sameer Khan',
      company: 'Khan Logistics',
      text: 'Leave policies and shifts are set up the way we actually work. Salary structures needed a second pass, but it was done within the sessions.',
    },
  ],
}
const reviews = computed(() => (pack.value && REVIEWS[pack.value.value]) ?? [])
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
    <div class="fc-page-wide py-8">
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
        <!-- ── The buy area ─────────────────────────────────────────────────
             Two columns from `md`: images on the left, the pack on the right —
             name, price, Add, then what it gets you, how it's delivered, and
             the full scope. One column below `md`, images first.

             ⚠️ Rules between the right column's parts, and only "Full scope"
             collapses: the checklist and How it works are the pitch and are
             always open. -->
        <div class="pt-6 md:grid md:grid-cols-2 md:items-start md:gap-12">
          <!-- The images. ⚠️ Placeholders — see `SHOTS`. Both columns are
               sticky from `md`; `pinTop` decides which one pins. -->
          <div
            ref="shotsCol"
            class="flex flex-col gap-4 md:sticky"
            :style="{ top: `${pinTop.shots}px` }"
          >
            <div
              v-for="shot in SHOTS"
              :key="shot.key"
              class="flex aspect-[4/3] w-full items-center justify-center rounded-7 bg-surface-gray-3"
              role="img"
              :aria-label="shot.label"
            >
              <LucideUsers v-if="shot.icon === 'users'" class="size-6 text-ink-gray-4" aria-hidden="true" />
              <LucideLayoutDashboard v-else-if="shot.icon === 'dashboard'" class="size-6 text-ink-gray-4" aria-hidden="true" />
              <LucideReceiptText v-else class="size-6 text-ink-gray-4" aria-hidden="true" />
            </div>
          </div>

          <div ref="packCol" class="mt-10 md:sticky md:mt-0" :style="{ top: `${pinTop.pack}px` }">
            <!-- The app's logo above the name, so the name, the facts and the
                 rows below all share one left edge. -->
            <div>
              <img :src="appLogo(pack.apps[0])" alt="" class="size-7 object-contain" />
              <div class="mt-4 min-w-0">
                <h1
                  class="text-balance text-[22px] font-semibold leading-[1.15] tracking-tight text-ink-gray-9"
                >
                  {{ pack.name }}
                </h1>
                <p class="mt-1 text-p-base text-ink-gray-6">
                  {{ pack.tagline }}
                </p>
              </div>
            </div>


            <!-- The terms under the name: the price as a figure (no icon, so it
                 can't read as a feature row) with the hours as its subline,
                 then Add across the column's full width with the bag at its
                 end — one solid width, matching the feature rows below. -->
            <div class="mt-8">
              <div>
                <!-- ⚠️ The figure alone, no tax: the basket and checkout add it. -->
                <p class="text-3xl font-semibold tabular-nums text-ink-gray-9">{{ price }}</p>
                <p class="mt-1 text-p-base text-ink-gray-6">{{ effortLine }}</p>
              </div>
            <div class="mt-4 flex items-center gap-2">
              <!-- Adds to the basket and stays; once in, "In cart" — see
                   `removeFromBasket`. -->
              <Button
                class="flex-1"
                size="md"
                :variant="inBasket ? 'subtle' : 'solid'"
                :label="inBasket ? 'In cart' : 'Add to cart'"
                @click="inBasket ? removeFromBasket() : addToBasket()"
              >
                <template v-if="inBasket" #prefix>
                  <IconCheck class="size-4" />
                </template>
              </Button>

              <!-- ⚠️ A BAG, not a cart: `shopping-cart` is the Buying module's
                   mark. The count is the DEFAULT SLOT, not `label`: frappe-ui
                   sets `aria-label` from `label`, so a label of "2" read "2". -->
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
            </div>

            <!-- What it gets you: five rows, each a plain line icon and one
                 sentence, ruled full width — no tiles, no heading. The icon
                 sits on the first line if a sentence wraps. See `highlights`
                 in `data/packs.js`. -->
            <ul class="mt-8" aria-label="What this pack gets you">
              <li
                v-for="h in pack.highlights"
                :key="h.text"
                class="flex items-start gap-3 border-t border-outline-gray-1 py-4 text-base font-medium leading-5 text-ink-gray-7 first:border-t-0"
              >
                <component
                  :is="HIGHLIGHT_ICONS[h.icon]"
                  class="size-5 shrink-0 text-ink-gray-7"
                  aria-hidden="true"
                />
                {{ h.text }}
              </li>
            </ul>

            <section class="mt-10" aria-labelledby="pack-how">
              <h2 id="pack-how" class="text-base font-medium text-ink-gray-8">How it works</h2>
              <p class="mt-2 text-pretty text-p-base text-ink-gray-6">
                Five sessions with people who’ve done this hundreds of times. You bring your data
                and one owner. ERPNext is set up around how you work, and your team learns to run
                it.
              </p>
            </section>

          </div>
        </div>

        <!-- ── Full scope ───────────────────────────────────────────────────
             The spec sheet, at 800px, centred, under the buy area and before
             the quotes. Each module's items in three groups: Setup,
             Transactions, Reports. ⚠️ Two layouts under review — see
             `scopeLayout`. -->
        <!-- Placeholder while the scope is parked — see `SHOW_FULL_SCOPE`. -->
        <div
          v-if="!SHOW_FULL_SCOPE"
          class="mx-auto mt-24 max-w-[800px] rounded-6 border border-dashed border-outline-gray-3 px-6 py-24 text-center"
        >
          <p class="text-base font-medium text-ink-gray-7">Full scope goes here</p>
          <p class="mx-auto mt-2 max-w-[520px] text-pretty text-p-sm text-ink-gray-6">
            For developers: this section will be added once each module’s scope is locked. The
            data is ready (<code>fullScope</code> in <code>data/packs.js</code>), and two candidate
            layouts are in this file behind <code>SHOW_FULL_SCOPE</code>.
          </p>
        </div>
        <section v-else class="mx-auto mt-24 max-w-[800px]" aria-labelledby="pack-scope">
          <h2 id="pack-scope" class="text-lg font-semibold text-ink-gray-8">Full scope</h2>

          <!-- Tabs: one module showing at a time, the first by default, so the
               section is never a list of closed names. Its three groups are
               filled cards, all as tall as the longest; stacked on a phone. -->
          <template v-if="scopeLayout === 'tabs'">
            <div class="mt-6 overflow-x-auto">
              <TabButtons v-model="scopeTab" :options="scopeTabs" />
            </div>
            <template v-for="m in scope" :key="m.key">
              <div v-if="m.key === scopeTab" class="mt-4 grid gap-2 sm:grid-cols-3">
                <div
                  v-for="k in SCOPE_KINDS.filter((kind) => m[kind.key].length)"
                  :key="k.key"
                  class="rounded-4 bg-surface-gray-1 p-4"
                >
                  <p class="text-sm font-medium text-ink-gray-5">{{ k.label }}</p>
                  <ul class="mt-2 space-y-1.5 text-p-sm text-ink-gray-7">
                    <li v-for="item in m[k.key]" :key="item">{{ item }}</li>
                  </ul>
                </div>
              </div>
            </template>
          </template>

          <!-- Cards: one bordered card per module, closed, any number open.
               The card is the only box, so inside the groups are plain
               labelled columns, no fill. -->
          <AccordionRoot v-else :key="pack.value" type="multiple" class="mt-6 space-y-3">
            <AccordionItem
              v-for="m in scope"
              :key="m.key"
              :value="m.key"
              class="group rounded-6 border border-outline-gray-1"
            >
              <AccordionHeader as="h3">
                <AccordionTrigger
                  class="flex w-full items-center justify-between gap-4 rounded-6 px-5 py-4 text-left text-base font-medium text-ink-gray-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
                >
                  {{ m.label }}
                  <LucideMinus
                    class="hidden size-4 shrink-0 text-ink-gray-5 group-data-[state=open]:block"
                    aria-hidden="true"
                  />
                  <LucidePlus
                    class="size-4 shrink-0 text-ink-gray-5 group-data-[state=open]:hidden"
                    aria-hidden="true"
                  />
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionContent class="fc-accordion-content overflow-hidden">
                <div class="grid gap-x-6 gap-y-5 px-5 pb-5 pt-1 sm:grid-cols-3">
                  <div v-for="k in SCOPE_KINDS.filter((kind) => m[kind.key].length)" :key="k.key">
                    <p class="text-sm font-medium text-ink-gray-5">{{ k.label }}</p>
                    <ul class="mt-2 space-y-1.5 text-p-sm text-ink-gray-7">
                      <li v-for="item in m[k.key]" :key="item">{{ item }}</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </AccordionRoot>
        </section>

        <!-- ── Reviews ────────────────────────────────────────────────────
             The partner profile's review row (`PartnerReviewsSection`): who
             wrote it, then what they said. No rating or date: these are picked,
             not a feed. The reviews are placeholders —
             see `REVIEWS`. -->
        <section v-if="reviews.length" class="mx-auto mt-24 max-w-[600px]" aria-label="What customers say">
          <div class="divide-y divide-outline-gray-1">
            <article v-for="r in reviews" :key="r.name" class="py-5">
              <div class="flex items-start gap-3">
                <!-- ⚠️ Placeholder: a plain circle, no initial — the person is
                     invented. -->
                <Avatar class="size-9 shrink-0" />
                <div class="min-w-0 flex-1">
                  <p class="text-base font-medium text-ink-gray-8">{{ r.name }}</p>
                  <p class="mt-1 text-base text-ink-gray-6">{{ r.company }}</p>
                </div>
              </div>
              <p class="mt-3 text-p-base text-ink-gray-7">{{ r.text }}</p>
            </article>
          </div>
        </section>


        <!-- Room under the last section; the closing Add row that sat here is
             gone, so the header's pair is the page's only one. -->
        <div class="pb-24" aria-hidden="true" />

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
