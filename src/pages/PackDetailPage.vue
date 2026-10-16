<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from 'reka-ui'
import ConnectShell from '../components/ConnectShell.vue'
import shotSession from '../assets/packs/session.webp'
import shotLaptop from '../assets/packs/laptop.webp'
import shotDesk from '../assets/packs/desk.webp'
import PackTermsDialog from '../components/PackTermsDialog.vue'
import { SCOPE_ICONS } from '../scopeIcons'
import IconSetup from '~icons/lucide/settings-2'
import IconData from '~icons/lucide/database'
import IconTrade from '~icons/lucide/arrow-right-left'
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
import IconPack from '~icons/lucide/package'
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
  ERPNEXT_SETUP,
  ERPNEXT_DATA,
  hostingLineFor,
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

// The cart sits beside Add, as the catalogue's sits beside its total: the
// count changes next to the click that changed it. Always shown, so the row
// doesn't jump when the first pack goes in.
const router = useRouter()
const viewCartLabel = computed(() =>
  store.packs.length ? `View cart (${store.packs.length})` : 'View cart',
)

// The terms — price and hours — sit together under the name, beside Add, as
// one statement of the deal.
const price = computed(() => facts.value.find((f) => f.key === 'price')?.value)
const effortLine = computed(() => facts.value.find((f) => f.key === 'effort')?.line)

// ── The buy area: images left, the pack right ─────────────────────────────
//
// ⚠️ TEMPORARY PHOTOS, the same three on every pack, standing in for each
// pack's own images. The session photo leads: the guidance is what the pack
// sells. The last one pins — see `pinTop`.
const SHOTS = [
  { key: 'session', src: shotSession, alt: 'Two people working through ERPNext on laptops at a shared table' },
  { key: 'laptop', src: shotLaptop, alt: 'Hands typing on a laptop at a desk' },
  { key: 'desk', src: shotDesk, alt: 'Someone at a desk working on a monitor, in silhouette' },
]

// Mixed sticky: BOTH columns are sticky, and whichever is shorter is the one
// that ends up pinned while the other scrolls past it. Each sticks by its
// BOTTOM edge: a `top` of "viewport minus the column's height" lets a tall
// column scroll until its end and pin there, and is capped at the gap under
// the bar, so a column shorter than the screen pins from the start. The
// taller column never pins — its grid row is its own height.
// The viewport is the page's own scroller, not the window: the shell's
// content frame is `overflow-hidden`.
// ⚠️ A SHORT COLUMN PINS WHERE IT STARTS, not at a fixed gap under the bar:
// pinned at 32px it first rode up the ~24px between there and where the page
// puts it, a small lurch before it stopped. `startTop` is the columns' own
// distance from the top of the scroller at rest.
const PIN_GAP = 32
const shotsCol = ref(null)
const packCol = ref(null)
const pinTop = ref({ shots: PIN_GAP, pack: PIN_GAP })
let resizer = null
let scroller = null
const measurePin = () => {
  if (!scroller || !shotsCol.value || !packCol.value) return
  // The grid both columns sit in isn't sticky, so its position (inside its
  // top padding) is the columns' resting one whatever the scroll.
  const grid = shotsCol.value.parentElement
  const startTop =
    grid.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop +
    parseFloat(getComputedStyle(grid).paddingTop)
  const topFor = (el) => Math.min(startTop, scroller.clientHeight - el.offsetHeight - PIN_GAP)
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
  package: IconPack,
  contact: IconEmployee,
  'calendar-days': IconLeave,
  receipt: IconExpense,
  percent: IconTax,
  wallet: IconSalary,
}

// "What the sessions cover": one flat accordion, every row closed and one open at a time, in the
// scope document's order — Setup, each module as the business runs it (sell,
// buy, stock, books, then make), Data and users. One level: the row names
// alone say what the pack covers, and any row opens to its points, one per
// line; a flow's steps are simply in order. Setup and Data and users are the
// ERPNext document's, so the HR pack has its two modules only.
const SCOPE_ORDER = ['selling', 'buying', 'inventory', 'accounting', 'manufacturing', 'hrms', 'payroll']
// ⚠️ BUYING AND SELLING ARE ONE ROW: mirror flows, each orders to payment.
// Inside, each flow keeps its own line, so the two "payment"s don't run
// together as one list.
const scope = computed(() => {
  let modules = [...(pack.value?.areas ?? [])]
    .sort((x, y) => SCOPE_ORDER.indexOf(x) - SCOPE_ORDER.indexOf(y))
    .map((key) => ({ key, icon: SCOPE_ICONS[key], ...PACK_SCOPE[key] }))
  const selling = modules.find((m) => m.key === 'selling')
  const buying = modules.find((m) => m.key === 'buying')
  if (selling && buying) {
    modules = [
      { key: 'trade', icon: IconTrade, label: 'Buying and selling', lines: [buying.flow, selling.flow] },
      ...modules.filter((m) => m !== selling && m !== buying),
    ]
  }
  if (!pack.value?.apps.includes('erpnext')) return modules
  return [
    { key: 'setup', icon: IconSetup, ...ERPNEXT_SETUP },
    ...modules,
    { key: 'data', icon: IconData, ...ERPNEXT_DATA },
  ]
})
// An open row's points run as one line of names joined by commas, in order,
// reports included. Names after the first lose their capital unless they're
// an acronym. Long points stay one per line.
// Setup and Data and users are written as a sentence (`sentence`).
// The left column under the heading: what order the rows run in, and the way
// to the full terms — where the exclusions live now that the page doesn't
// list them. The dialog opens for reading (`agreed`), so it offers no Agree;
// agreeing is the cart's.
const isErpnext = computed(() => !!pack.value?.apps.includes('erpnext'))
const termsOpen = ref(false)
const pointsOf = (m) => [...(m.flow ?? m.items), ...(m.reports ?? [])]
const isProse = (points) => points.every((p) => p.length <= 32)
const commas = (points) =>
  points.map((p, i) => (i && /^[A-Z][a-z]/.test(p) ? p[0].toLowerCase() + p.slice(1) : p)).join(', ')
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
        <div class="md:grid md:grid-cols-[minmax(0,1fr)_420px] md:items-start md:gap-12">
          <!-- The images. ⚠️ Temporary photos — see `SHOTS`. Both columns are
               sticky from `md`; `pinTop` decides which one pins. -->
          <div
            ref="shotsCol"
            class="flex flex-col gap-4 md:sticky"
            :style="{ top: `${pinTop.shots}px` }"
          >
            <img
              v-for="shot in SHOTS"
              :key="shot.key"
              :src="shot.src"
              :alt="shot.alt"
              class="aspect-[3/2] w-full rounded-7 bg-surface-gray-3 object-cover"
            />
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
                 can't read as a feature row) with the hours as its subline.
                 Add comes after the feature rows — see there. -->
            <div class="mt-8">
              <div>
                <!-- ⚠️ The figure alone, no tax: the basket and checkout add it. -->
                <p class="text-3xl font-semibold tabular-nums text-ink-gray-9">{{ price }}</p>
                <p class="mt-1 text-p-base text-ink-gray-6">{{ effortLine }}</p>
                <p class="mt-1 text-p-base text-ink-gray-6">{{ hostingLineFor(region) }}</p>
              </div>
            </div>

            <!-- What it gets you: three rows, each a plain line icon and one
                 sentence, ruled full width — no tiles, no heading. The icon
                 sits on the first line if a sentence wraps. See `highlights`
                 in `data/packs.js`. -->
            <ul class="mt-4" aria-label="What this pack gets you">
              <li
                v-for="h in pack.highlights"
                :key="h.text"
                class="flex items-start gap-3 border-t border-outline-gray-1 py-4 text-base font-medium leading-5 text-ink-gray-7 first:border-t-0"
              >
                <component
                  :is="HIGHLIGHT_ICONS[h.icon]"
                  class="mt-0.5 size-4 shrink-0 text-ink-gray-7"
                  aria-hidden="true"
                />
                {{ h.text }}
              </li>
            </ul>

            <!-- Add, after what the pack gets you: read, then buy. Adds to the
                 basket and stays; once in, "In cart" — see `removeFromBasket`.
                 Add takes the width; the cart is the subtle one beside it. -->
            <div class="mt-4 flex gap-2">
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
              <Button variant="subtle" size="md" :label="viewCartLabel" @click="router.push({ name: 'cart' })">
                <template #prefix><IconBag class="size-4" aria-hidden="true" /></template>
              </Button>
            </div>

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

        <!-- ── What the sessions cover ───────────────────────────────────────
             800px, in two columns from `md`: the heading on the left, scrolling
             with the page, and the rows on the right — so a
             closed row isn't an icon and a word on an 800px line. Rules
             between the rows only. An open row's points run with commas —
             see `commas`. -->
        <section
          class="mx-auto mt-36 max-w-[800px] md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-12"
          aria-labelledby="pack-scope"
        >
          <div class="md:self-start md:pt-5">
            <h2 id="pack-scope" class="text-lg font-semibold text-ink-gray-8">
              What the sessions cover
            </h2>
            <p v-if="isErpnext" class="mt-2 text-p-base text-ink-gray-6">
              Setup first, then each module, then your data and users.
            </p>
            <Button
              class="mt-4"
              variant="subtle"
              label="Read the full terms"
              @click="termsOpen = true"
            />
          </div>
          <!-- HR and Payroll: the same rows, but both open from the start and
               open together — two short modules closed would leave the
               section empty. -->
          <AccordionRoot
            :key="pack.value"
            :type="isErpnext ? 'single' : 'multiple'"
            :collapsible="isErpnext"
            :default-value="isErpnext ? undefined : scope.map((m) => m.key)"
            class="mt-4 divide-y divide-outline-gray-1 md:mt-0"
          >
            <AccordionItem v-for="m in scope" :key="m.key" :value="m.key" class="group py-5">
              <AccordionHeader as="h3">
                <AccordionTrigger
                  class="flex w-full items-center gap-3 rounded-4 text-left text-base font-semibold text-ink-gray-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
                >
                  <component :is="m.icon" class="size-4 shrink-0 text-ink-gray-6" aria-hidden="true" />
                  <span class="flex-1">{{ m.label }}</span>
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
                <div class="pt-3">
                  <p v-if="m.sentence" class="text-p-base text-ink-gray-7">{{ m.sentence }}</p>
                  <div v-else-if="m.lines" class="space-y-1.5 text-p-base text-ink-gray-7">
                    <p v-for="(line, i) in m.lines" :key="i">{{ commas(line) }}</p>
                  </div>
                  <!-- HR and Payroll always as a sentence, long points and all. -->
                  <p v-else-if="!isErpnext || isProse(pointsOf(m))" class="text-p-base text-ink-gray-7">
                    {{ commas(pointsOf(m)) }}
                  </p>
                  <ul v-else class="space-y-1.5 text-p-base text-ink-gray-7">
                    <li v-for="(point, i) in pointsOf(m)" :key="i">{{ point }}</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </AccordionRoot>
        </section>
        <PackTermsDialog v-model:open="termsOpen" :region="region" agreed />

        <!-- Room under the last section; the closing Add row that sat here is
             gone, so the header's pair is the page's only one. -->
        <div class="pb-16" aria-hidden="true" />

        <!-- How it works, True of every pack and the terms are on the
             recommendation screen, where the basket is checked out — not
             repeated here, so the shared lists have one place to drift from. -->
      </template>
    </div>
  </ConnectShell>
</template>
