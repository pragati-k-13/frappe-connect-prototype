<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Badge, Button } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PackDetailDialog from '../components/PackDetailDialog.vue'
import { useConnectStore } from '../stores/connect'
import {
  STARTER_PACKS,
  SCOPE_AREAS,
  INCLUDED_IN_ALL,
  STRICTLY_EXCLUDED,
  commercialTermsFor,
  priceFor,
  pricingFor,
  DEFAULT_REGION,
} from '../data/packs'

// SCREEN — the Starter Pack catalogue.
//
// ── The idea ────────────────────────────────────────────────────────────────
// Three of the four packs NEST. Core ERPNext is the first four module areas,
// Manufacturing is those plus one, All in one is those plus two more; Frappe HR
// is the only one that isn't a prefix of the others — it's the last two areas
// on their own. That relationship is the most useful thing a buyer can know
// here, and as four lines of prose ("Core ERPNext + Manufacturing") it's
// invisible: four packs read as four unrelated products.
//
// So every row carries the SAME seven area tags, in the same order. A filled
// tag is an area the partner configures, an outlined one is an area this pack
// doesn't reach. Because the labels are identical in every row, the tags land
// at the same x-positions without a grid holding them there — so you can read
// coverage accumulate down the page, four of seven, five, seven, and see at a
// glance that Frappe HR overlaps the others in nothing but its own two.
//
// ── What lives here vs in the dialog ────────────────────────────────────────
// Anything TRUE OF EVERY PACK is on this page: what always ships, what never
// does, and the commercial terms. The dialog holds only what changes from pack
// to pack — the hours, the price, and the module-by-module scope. Repeating the
// common half in four dialogs made each one long enough to bury the part that
// actually differs.
//
// There's no filter or search bar: four is the whole catalogue, and a control
// bar over four items is furniture.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

// The quiz asks for a region, so use it when it's been answered — pack prices
// are regional. Falls back to India, the only region whose pricing is real
// (see `data/packs.js`).
const region = computed(() => store.answers.region[0] ?? DEFAULT_REGION)
const pricing = computed(() => pricingFor(region.value))
const terms = computed(() => commercialTermsFor(region.value))

const packs = computed(() =>
  STARTER_PACKS.map((pack) => ({
    ...pack,
    price: priceFor(pack, region.value),
    coverage: SCOPE_AREAS.map((area) => ({ ...area, included: pack.areas.includes(area.key) })),
  })),
)

// How you actually get one. Numbered because this genuinely is a sequence —
// each step is gated on the one before it — not because numbers look tidy.
//
// ⚠️ The steps are NOT four equal beats, and drawing them as four identical
// markers would say they were. A pack is a block of hours against a clock, so
// the two questions a buyer actually arrives with are "when do I pay?" and
// "when do my hours start?" — and the answers are not the same step. The first
// three cost nothing and are reversible; `commits` marks the one that charges
// you, and the clock starts later still, at the kickoff.
//
// Step three carries the other thing they'll want: Frappe picks the partner,
// and you see who it is BEFORE you pay. That's the whole difference between
// this route and the custom one.
const STEPS = [
  {
    title: 'Pick a pack',
    body: 'Choose the one that covers what you run today.',
  },
  {
    title: 'Tell us about your business',
    body: 'Sign in, then answer a few questions about your industry, region and company.',
  },
  {
    title: 'Meet your partner',
    body: 'Frappe assigns a certified partner in your region, matched on the work you do. You see who it is before you decide.',
  },
  {
    title: 'Pay, then book your kickoff',
    body: 'Pay in full and pick a time with your partner. Your hours start at the kickoff, not at payment, so the clock does not run while you are getting ready.',
    commits: true,
  },
]

// The open pack lives in the URL, so the detail is linkable and Back closes it.
// An unknown `?pack=` resolves to null, which reads as "no dialog" rather than
// an error — a stale link lands you on the catalogue, which is where you want
// to be anyway.
const openPack = computed(() => STARTER_PACKS.find((p) => p.value === route.query.pack) ?? null)
const open = (value) => router.push({ query: { ...route.query, pack: value } })
const close = () => {
  const { pack, ...rest } = route.query
  router.push({ query: rest })
}
</script>

<template>
  <ConnectShell root-label="Starter packs" root-to="/connect/packs">
    <!-- 720. The binding constraint is the tag row, which needs 470px to
           hold all seven on one line; at this measure it gets 616, so there's
           real headroom before the tags start wrapping and the columns stop
           lining up across rows. -->
    <div class="mx-auto w-full max-w-[720px] px-5 py-10 lg:px-10">
      <h1 class="text-lg font-semibold text-ink-gray-8">Starter packs</h1>
      <p class="mt-1.5 max-w-[560px] text-p-base text-ink-gray-6">
        Four slices of the same catalogue, each configured by a certified partner Frappe assigns
        you. Pick the one that covers what you run today.
      </p>

      <ul class="mt-7 divide-y divide-outline-gray-1 border-y border-outline-gray-1">
        <!-- The row is content; the Button is the control. Nothing else in the
             row is clickable, so there's no hover fill and no second target
             competing with the one real affordance. -->
        <li v-for="pack in packs" :key="pack.value" class="py-5">
          <div>
            <div class="flex items-baseline justify-between gap-4">
              <h2 class="text-base font-medium text-ink-gray-8">{{ pack.name }}</h2>
              <p class="shrink-0 text-base font-medium tabular-nums text-ink-gray-8">
                {{ pack.price }}
              </p>
            </div>

            <div class="mt-1 flex items-baseline justify-between gap-4">
              <p class="text-p-base tabular-nums text-ink-gray-6">
                {{ pack.hours }} hours, to use within {{ pack.validity }}
              </p>
              <p class="shrink-0 text-p-sm text-ink-gray-5">+ {{ pricing.tax }}</p>
            </div>

            <!-- Natural flow rather than a grid: the seven labels are identical
                 in every row, so the tags come out the same width and land in
                 the same columns anyway — and they wrap sensibly on a phone
                 instead of squeezing a fixed seven-column grid until
                 "Manufacturing" breaks mid-word.
                 ⚠️ `ghost`, NOT `outline`, for the areas a pack doesn't reach.
                 `outline` adds a 1px border each side, so an absent tag is 2px
                 wider than a present one and the drift accumulates along the
                 row: measured 6px of skew by the last tag on Frappe HR, which
                 has five absent areas before its two. `ghost` and `subtle`
                 share a box, so the columns line up exactly. -->
            <div class="mt-3 flex flex-wrap gap-1.5">
              <Badge
                v-for="area in pack.coverage"
                :key="area.key"
                size="md"
                theme="gray"
                :variant="area.included ? 'subtle' : 'ghost'"
                :class="area.included ? '' : 'opacity-60'"
                :label="area.label"
              />
            </div>

            <div class="mt-3">
              <Button size="md" label="See what's in scope" @click="open(pack.value)">
                <template #suffix><LucideArrowRight class="size-4" /></template>
              </Button>
            </div>
          </div>
        </li>
      </ul>

      <p class="mt-3 text-p-sm text-ink-gray-5">
        Filled tags are what the partner sets up. Faded ones aren't in that pack, and are available
        as paid work. Priced for {{ pricing.label }}.
      </p>

      <!-- ── How it works ────────────────────────────────────────────────
           Vertical, not the reference's horizontal run: that page is far wider,
           and at this measure four columns leave each description ~145px, which
           makes every one a four-line ribbon.
           The markers are not all alike, and that's the point. Hollow steps
           cost nothing and can be walked back; the filled one is where you pay.
           The threshold is called out on the connector, because "when does this
           start costing me" is the question a buyer reads a process explainer
           to answer. -->
      <section class="mt-12">
        <h2 class="text-base font-medium text-ink-gray-8">How it works</h2>

        <ol class="mt-5">
          <li
            v-for="(step, i) in STEPS"
            :key="step.title"
            class="relative flex gap-4 pb-6 last:pb-0"
          >
            <!-- The connector, from this marker down to the next.
                 ⚠️ `border-l`, not `bg-outline-gray-2`: `outline-*` is
                 frappe-ui's BORDER scale, and as a background it compiles to
                 nothing. See FRAPPE-UI-NOTES.md. -->
            <span
              v-if="i < STEPS.length - 1"
              class="absolute bottom-0 left-3 top-7 border-l border-outline-gray-2"
              aria-hidden="true"
            />
            <span
              class="relative grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium tabular-nums"
              :class="
                step.commits
                  ? 'bg-surface-gray-7 text-white'
                  : 'border border-outline-gray-3 text-ink-gray-6'
              "
              aria-hidden="true"
            >
              {{ i + 1 }}
            </span>
            <div class="min-w-0 pt-0.5">
              <p class="text-base font-medium text-ink-gray-7">
                {{ step.title }}
                <!-- Said once, on the step where it becomes true, rather than
                     as a reassurance line under the heading that nobody would
                     tie to a particular moment. -->
                <span v-if="step.commits" class="font-normal text-ink-gray-5">
                  — nothing to pay before here
                </span>
              </p>
              <p class="mt-1 max-w-[52ch] text-p-base text-ink-gray-6">{{ step.body }}</p>
            </div>
          </li>
        </ol>
      </section>

      <!-- ── True of every pack ──────────────────────────────────────────
           On the page rather than in each dialog: it doesn't vary, so saying it
           four times would pad every dialog with the half that never changes.
           Same in/out reading as a pack's own scope, so the two agree. -->
      <section class="mt-12">
        <h2 class="text-base font-medium text-ink-gray-8">True of every pack</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <p class="text-p-sm font-medium text-ink-gray-7">Always included</p>
            <ul class="mt-1 space-y-0.5">
              <li v-for="item in INCLUDED_IN_ALL" :key="item" class="text-p-base text-ink-gray-6">
                {{ item }}
              </li>
            </ul>
          </div>
          <div class="self-start rounded-6 bg-surface-gray-2 px-3 py-2.5">
            <p class="text-p-sm font-medium text-ink-gray-6">Never included</p>
            <ul class="mt-1 space-y-0.5">
              <li v-for="item in STRICTLY_EXCLUDED" :key="item" class="text-p-base text-ink-gray-5">
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
        <p class="mt-2 text-p-sm text-ink-gray-5">
          Anything on the right is available as paid work, quoted separately.
        </p>
      </section>

      <section class="mt-10">
        <h2 class="text-base font-medium text-ink-gray-8">Terms</h2>
        <ul class="mt-3 space-y-1">
          <li v-for="term in terms" :key="term" class="text-p-base text-ink-gray-6">{{ term }}</li>
        </ul>
      </section>
    </div>

    <PackDetailDialog :pack="openPack" :region="region" @close="close" />
  </ConnectShell>
</template>
