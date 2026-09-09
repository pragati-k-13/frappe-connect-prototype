<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Button, Tooltip } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PackDrawer from '../components/PackDrawer.vue'
import IconModules from '~icons/lucide/package'
import IconEffort from '~icons/lucide/hourglass'
import IconDelivery from '~icons/lucide/calendar'
import IconPricing from '~icons/lucide/circle-dollar-sign'
import IconSpeed from '~icons/lucide/clock'
import IconOversight from '~icons/lucide/circle-check'
import { useConnectStore } from '../stores/connect'
import { useAuthGate } from '../utils/auth'
import {
  STARTER_PACKS,
  INCLUDED_IN_ALL,
  STRICTLY_EXCLUDED,
  asExclusion,
  priceFor,
  pricingFor,
  DEFAULT_REGION,
} from '../data/packs'

// SCREEN — the Starter Pack catalogue.
//
// ── The idea ────────────────────────────────────────────────────────────────
// Three of the four packs NEST. Core ERPNext is the base, Manufacturing adds
// production, All in one adds HR and payroll; Frappe HR is the only one that
// stands alone. Each row's `tagline` names the pack by what it ADDS to the one
// above it, so the ladder reads down the list rather than having to be
// reconstructed from four module lists.
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
const { requireAccount } = useAuthGate()
const route = useRoute()
const router = useRouter()

// The quiz asks for a region, so use it when it's been answered — pack prices
// are regional. Falls back to India, the only region whose pricing is real
// (see `data/packs.js`).
const region = computed(() => store.answers.region[0] ?? DEFAULT_REGION)
const pricing = computed(() => pricingFor(region.value))

// The three reasons a pack is the right shape for a small business, from the
// design. Kept as data so the row is one thing to render rather than three
// copies of the same markup.
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
    // ⚠️ This is the document's VALIDITY: the window the hours are used across,
    // running from the project start date. The figure leads the line so it
    // scans against the hours above it — both open with their number.
    //
    // "to deliver", not "delivery time": the scope document puts data
    // readiness, approvals and user availability on the CUSTOMER, and runs the
    // validity clock regardless. "30 days delivery time" reads as Frappe
    // committing to finish inside the window, so a customer slow with their own
    // data has been promised something the terms don't give them. "Use within"
    // was the other end of it — a shelf life on a service.
    details: [
      { icon: IconModules, text: pack.moduleList },
      { icon: IconEffort, text: `${pack.hours} hrs of effort` },
      { icon: IconDelivery, text: `${pack.validity} to deliver` },
    ],
  })),
)

// What happens after "Get started" — the three beats between picking a pack
// and the work beginning. Numbered because this is genuinely a sequence, each
// step gated on the one before it, not because numbers look tidy.
//
// ⚠️ The order is the reassuring part, and it's easy to get backwards: you meet
// the partner Frappe assigned you BEFORE any money changes hands. That's the
// whole difference between this route and being handed an invoice with a name
// on it.
const STEPS = [
  { title: 'Introductory call', body: 'Get to know your partner' },
  { title: 'Pay in full', body: 'Just before kickoff' },
  { title: 'Coordinate with partner', body: 'Share data and processes' },
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

// "Get started" is the buying gesture, so it's gated where the info button
// isn't: reading a pack's scope needs no account, committing to one does.
//
// Signed out, this sends the visitor to SIGN UP — someone pressing Get started
// on a fixed-price pack is new business, and a log-in form in front of them is a
// wrong guess with a form attached. Signed in, it opens the panel, which is
// still all there is; see the seam in `PackDrawer`.
//
// The held action is `open(value)` rather than the `?pack=` being carried in
// `next`, because the gate captures the path as it is at the click — the panel
// isn't open yet at that moment. Coming back, the action opens it.
const start = (value) => requireAccount(() => open(value), { screen: 'signup' })
</script>

<template>
  <ConnectShell root-label="Starter packs" root-to="/connect/packs">
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
        <h2 class="text-base font-semibold text-ink-gray-7">Starter Packs for your region</h2>

        <!-- `divide-y` puts a rule BETWEEN rows and none after the last, which
             is exactly what the design asks for — no wrapper border to undo. -->
        <ul class="divide-y divide-outline-gray-1">
          <li v-for="pack in packs" :key="pack.value" class="flex gap-6 py-6">
            <!-- ⚠️ Placeholder. Illustrations land here; until they do this is
                 a plain 160px tile rather than invented art. -->
            <div class="size-40 shrink-0 rounded-6 bg-surface-gray-2" aria-hidden="true" />

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <h3 class="text-lg font-medium text-ink-gray-8">{{ pack.name }}</h3>
                  <p class="mt-1 text-p-base text-ink-gray-6">{{ pack.tagline }}</p>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                  <Button
                    :aria-label="`What's in scope for ${pack.name}`"
                    @click="open(pack.value)"
                  >
                    <template #icon><LucideInfo class="size-4" /></template>
                  </Button>
                  <!-- ⚠️ Signed in, this opens the same panel the info button
                       does. Once the booking flow exists it should skip the
                       scope and go straight to it; today there is nowhere else
                       to go. -->
                  <Button label="Get started" @click="start(pack.value)" />
                </div>
              </div>

              <!-- 16px between the title block, the price and the details. -->
              <p class="mt-4 text-lg font-semibold tabular-nums text-ink-gray-7">
                {{ pack.price }}
              </p>

              <ul class="mt-4 space-y-1">
                <li
                  v-for="detail in pack.details"
                  :key="detail.text"
                  class="flex items-start gap-2 text-p-base text-ink-gray-6"
                >
                  <component :is="detail.icon" class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
                  {{ detail.text }}
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </section>

      <!-- ── How it works ────────────────────────────────────────────────
           The same three-across row as the header block, with numbered avatars
           where that one has icons. If one changes, change both. -->
      <section class="mt-24">
        <h2 class="text-base font-semibold text-ink-gray-8">How it works</h2>

        <!-- ⚠️ An `<ol>`, not the `<dl>` the header row uses, and the number
             sits BESIDE the text rather than inside the title's line. The
             avatar is 28px against a 17px line, so with it inside the title the
             title's row was avatar-height and the 4px below it got measured
             from the avatar's bottom, not the text's. Out here the title and
             body are the only things in that column's flow, so the gap is
             exactly 4px whatever size the avatar is.
             `<ol>` is also the truer element: the numbers are a sequence. -->
        <ol class="fc-col-3 mt-7">
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

      <!-- ── What every pack does and doesn't cover ─────────────────────
           Two columns either side of one rule, at equal weight. A pack is
           defined as much by its carve-outs as by its contents — that's why
           it's quick and cheap — so the right-hand column isn't a footnote.
           The rule sits on the grid's midline with the same 32px of air on
           each side, so it reads as between the two rather than attached to
           either. -->
      <section class="mt-24">
        <h2 class="text-base font-semibold text-ink-gray-8">
          What&rsquo;s included in all Packs, and what&rsquo;s not
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

    <!-- Rendered only when a pack is open: the slot's presence is what makes
         the shell give up the column, so an always-present empty panel would
         narrow the page for nothing. -->
    <template v-if="openPack" #panel>
      <PackDrawer :pack="openPack" @close="close" />
    </template>
  </ConnectShell>
</template>
