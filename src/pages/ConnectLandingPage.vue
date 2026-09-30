<script setup>
// `/connect` — the home screen once signed in, and for a visitor, the two ways
// to go live.
//
// ⚠️ A HERO, THEN ONE SECTION PER WAY TO GO LIVE. Each section says what that
// way gives you in three short features and ends on its own button, with room
// enough between them that the two buttons are never read side by side. The
// hero carries no button: it states the promise, and the sections keep it.
//
// ⚠️ NO QUIZ. This page used to open on a three-question intake ending on a
// recommendation. The recommendation route still exists; nothing links to it.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, Badge, Button } from 'frappe-ui'
import IconBadge from '~icons/lucide/badge-check'
import IconClock from '~icons/lucide/clock'
import IconCoins from '~icons/lucide/coins'
import IconMilestone from '~icons/lucide/milestone'
import IconSparkles from '~icons/lucide/sparkles'
import IconHandshake from '~icons/lucide/handshake'
import IconUsers from '~icons/lucide/users'
import IconPackage from '~icons/lucide/package'
import ConnectShell from '../components/ConnectShell.vue'
import HomeDashboard from '../components/HomeDashboard.vue'
import { STARTER_PACKS, priceFor } from '../data/packs'
import { PARTNERS } from '../data/partners'
import { logoFor } from '../data/logos'
import { useConnectStore } from '../stores/connect'

const store = useConnectStore()
const router = useRouter()

// ⚠️ ONE ADDRESS, TWO FACES. The rail's Home row points here, and a returning
// customer who bookmarked it should land on their projects.
const showDashboard = computed(() => store.signedIn)

const fromPrice = priceFor(STARTER_PACKS.reduce((a, b) => (b.hours < a.hours ? b : a)))

const SECTIONS = [
  {
    // ⚠️ `id` is a link target: the estimate modal links to
    // `/connect#starter-packs`, and the router's `scrollBehavior` finds it.
    id: 'starter-packs',
    title: 'Starter Packs',
    // ⚠️ THE HEADLINE IS WHAT IT DOES FOR YOU; the name sits above it as a
    // label. Small businesses buy this to start fast and spend little.
    headline: 'Start fast. Spend less.',
    features: [
      { icon: IconCoins, title: 'One fixed price', body: `From ${fromPrice}, known before you start.` },
      // Getters, read at render, so the line follows the Demo menu's
      // "implemented by" switch.
      {
        icon: IconBadge,
        get title() {
          return store.packsByFrappe ? 'Implemented by Frappe' : 'Implemented by a partner'
        },
        get body() {
          return store.packsByFrappe
            ? 'Our own team, start to finish.'
            : 'Certified, and assigned by industry and region.'
        },
      },
      { icon: IconClock, title: 'Live in weeks', body: 'Defined modules, defined hours.' },
    ],
    action: { label: 'View packs', go: () => (store.setPacks([]), router.push('/connect/packs')) },
  },
  {
    id: 'custom',
    title: 'Custom implementation',
    // For businesses whose way of working is the point: software that bends.
    headline: 'Software that adapts to you.',
    features: [
      { icon: IconSparkles, title: 'Any customization', body: 'On any Frappe app.' },
      { icon: IconUsers, title: 'Quotes that fit', body: 'One brief, sent to the partners that match.' },
      { icon: IconMilestone, title: 'Pay per milestone', body: 'Agreed with the partner you hire.' },
    ],
    action: { label: 'Contact partners', go: () => router.push({ name: 'contact-partners' }) },
    more: { label: 'View all partners', go: () => router.push('/connect/partners') },
  },
]

// See the note on the reviews section: invented, at fictional companies.
const REVIEWS = [
  {
    name: 'Ananya Rao',
    role: 'Finance lead, Meridian Foods',
    service: 'Starter Pack',
    get quote() {
      return `We were on spreadsheets in March and closing our books in ERPNext by May. The price was the price, and ${store.packsByFrappe ? 'Frappe’s team' : 'our partner'} handled the setup end to end.`
    },
  },
  {
    name: 'Karan Mehta',
    role: 'Founder, Kestrel Textiles',
    service: 'Custom implementation',
    quote:
      'Our dyeing process does not look like anyone else’s. Four partners quoted from one brief, and the one we hired built the job cards around how the floor actually works.',
  },
  {
    name: 'Sara Thomas',
    role: 'Operations, Halcyon Retail',
    service: 'Starter Pack',
    quote:
      'Stock and sales across three stores, live in five weeks. We added HR later with a second pack, without starting over.',
  },
]

// ── The pictures ────────────────────────────────────────────────────────────
// Starter Packs: the real catalogue as a cascade — each pack a card, each one
// lower and in front of the last, so every name reads and the front card shows
// what a pack is: its modules, its price, its hours. The picture is the
// product rather than a drawing of one.
const cascade = STARTER_PACKS.slice(0, 3).map((p, i) => ({
  name: p.name,
  line: `${priceFor(p)} · ${p.hours} hrs`,
  style: { transform: `translate(${i * 16}px, ${i * 60}px)`, zIndex: i },
}))

// Custom: Connect at the centre, partners on dotted rings around it. Real
// logos from the directory, seated at hand-picked angles so no two share a
// spoke and the picture reads as a network rather than a clock face.
const RINGS = [90, 150, 210]
const SEATS = [
  { ring: 0, deg: -30 },
  { ring: 0, deg: 150 },
  { ring: 1, deg: -110 },
  { ring: 1, deg: 20 },
  { ring: 1, deg: 95 },
  { ring: 1, deg: 200 },
  { ring: 2, deg: -60 },
  { ring: 2, deg: 55 },
  { ring: 2, deg: 160 },
  { ring: 2, deg: -135 },
]
const orbit = PARTNERS.filter((p) => logoFor(p.id))
  .slice(0, SEATS.length)
  .map((p, i) => {
    const { ring, deg } = SEATS[i]
    const a = (deg * Math.PI) / 180
    // Positions in the 480-unit viewBox the rings are drawn in, as percentages
    // so the logos track the SVG at any size.
    return {
      partner: p,
      left: `${50 + (Math.cos(a) * RINGS[ring] * 100) / 480}%`,
      top: `${50 + (Math.sin(a) * RINGS[ring] * 100) / 480}%`,
    }
  })
</script>

<template>
  <ConnectShell :root-label="showDashboard ? 'Home' : 'Get started'" root-to="/connect">
    <HomeDashboard v-if="showDashboard" />

    <div v-else class="mx-auto w-full max-w-[1120px] px-5 lg:px-10">
      <!-- ── Hero ────────────────────────────────────────────────────────
           Text only, centred, with the room to be read slowly. Newsreader for
           the headline and nowhere else; the first line is quieter than the
           second so the promise lands on the second. -->
      <header class="mx-auto max-w-[720px] pb-12 pt-20 text-center lg:pb-16 lg:pt-24">
        <h1 class="font-serif text-[36px] font-medium leading-[1.1] tracking-[-0.01em] sm:text-[44px]">
          <span class="block text-ink-gray-5">Go live in weeks.</span>
          <span class="block text-ink-gray-9">Grow for years.</span>
        </h1>
        <p class="mx-auto mt-6 max-w-[520px] text-lg leading-relaxed text-ink-gray-6">
          Start on Frappe apps with a fixed Starter Pack, or a custom build by a certified
          partner.
        </p>
      </header>

      <!-- ── The two ways ────────────────────────────────────────────────
           Text and picture side by side, the picture swapping sides so the
           two read as two sections rather than one repeated row. -->
      <section
        v-for="(sec, i) in SECTIONS"
        :id="sec.id"
        :key="sec.id"
        class="mx-auto grid max-w-[800px] scroll-mt-8 items-center gap-10 py-12 lg:grid-cols-2 lg:gap-14 lg:py-16"
      >
        <div :class="i % 2 && 'lg:order-2'">
          <p class="text-base font-medium text-ink-gray-5">{{ sec.title }}</p>
          <h2 class="mt-2 text-3xl font-semibold text-ink-gray-9">{{ sec.headline }}</h2>

          <dl class="mt-10 space-y-6">
            <div v-for="f in sec.features" :key="f.title" class="flex gap-4">
              <component :is="f.icon" class="mt-0.5 size-5 shrink-0 text-ink-gray-5" aria-hidden="true" />
              <div>
                <dt class="text-base font-medium text-ink-gray-8">{{ f.title }}</dt>
                <dd class="mt-0.5 text-p-base text-ink-gray-6">{{ f.body }}</dd>
              </div>
            </div>
          </dl>

          <div class="mt-10 flex flex-wrap items-center gap-2">
            <Button variant="solid" size="md" :label="sec.action.label" @click="sec.action.go" />
            <Button
              v-if="sec.more"
              variant="ghost"
              size="md"
              :label="sec.more.label"
              @click="sec.more.go"
            />
          </div>
        </div>

        <!-- The picture. Decorative: every fact in it is in the text beside it. -->
        <div
          class="relative aspect-square w-full overflow-hidden rounded-7 bg-surface-gray-1"
          aria-hidden="true"
        >
          <!-- Starter Packs: the catalogue, cascaded. -->
          <div
            v-if="sec.id === 'starter-packs'"
            class="absolute inset-0 flex items-center justify-center"
          >
            <div class="relative h-[196px] w-[284px]">
              <div
                v-for="card in cascade"
                :key="card.name"
                class="absolute left-0 top-0 w-[252px] rounded-6 border border-outline-gray-1 bg-surface-elevation-1 p-4 shadow-lg"
                :style="card.style"
              >
                <div class="flex items-center gap-2">
                  <IconPackage class="size-4 shrink-0 text-ink-gray-5" />
                  <p class="truncate text-base font-semibold text-ink-gray-8">{{ card.name }}</p>
                </div>
                <p class="mt-1 pl-6 text-p-sm text-ink-gray-6">{{ card.line }}</p>
              </div>
            </div>
          </div>

          <!-- Custom: Connect and the partners around it. -->
          <template v-else>
            <svg viewBox="0 0 480 480" class="fc-rings absolute inset-0 size-full text-ink-gray-3">
              <circle
                v-for="r in RINGS"
                :key="r"
                cx="240"
                cy="240"
                :r="r"
                fill="none"
                stroke="currentColor"
                stroke-width="1.25"
                stroke-dasharray="2 5"
                stroke-linecap="round"
              />
            </svg>
            <!-- ⚠️ SIZED AS A SHARE OF THE PANEL, NOT IN PIXELS. The rings are an
                 SVG and scale with the panel; fixed-size discs on them crowded
                 together as it narrowed. Every disc here is a percentage of the
                 panel's width, so the diagram shrinks as one picture.
                 A plain `<img>` in a square box, not `Avatar`: an inline avatar
                 inside a padded circle picked up line-height and went oval. -->
            <div
              v-for="o in orbit"
              :key="o.partner.id"
              class="absolute flex aspect-square w-[12%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface-elevation-1 shadow-md"
              :style="{ left: o.left, top: o.top }"
            >
              <img
                :src="logoFor(o.partner.id)"
                alt=""
                class="size-[56%] object-contain"
                draggable="false"
              />
            </div>
            <div
              class="absolute left-1/2 top-1/2 flex aspect-square w-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface-elevation-1 shadow-xl"
            >
              <!-- Connect's mark at the same proportions as `ConnectMark`, drawn
                   here so it can scale: the component takes fixed Avatar sizes. -->
              <div class="fc-mark size-[56%]">
                <div class="flex size-full items-center justify-center rounded-[24%]">
                  <IconHandshake class="size-[55%]" />
                </div>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- ── What customers say ─────────────────────────────────────────
           ⚠️ INVENTED, every one: the people, their words and their roles.
           The companies are the prototype's own fictional clients (see
           `assets/clients`), so none of this is attributed to a real firm or
           a real person. Replace with real, permissioned reviews.
           Each names the service it is about, because the two are bought for
           different reasons and a reader is choosing between them. -->
      <section class="mx-auto max-w-[600px] pb-24 pt-16 lg:pb-32">
        <h2 class="text-3xl font-semibold text-ink-gray-9">Take it from our customers</h2>
        <div class="mt-10 space-y-10">
          <figure v-for="r in REVIEWS" :key="r.name">
            <figcaption class="flex items-center gap-3">
              <Avatar :label="r.name" size="2xl" shape="circle" />
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-base font-medium text-ink-gray-8">{{ r.name }}</p>
                  <Badge :label="r.service" variant="subtle" theme="gray" size="sm" />
                </div>
                <p class="mt-0.5 text-p-sm text-ink-gray-5">{{ r.role }}</p>
              </div>
            </figcaption>
            <blockquote class="mt-4 text-p-base leading-relaxed text-ink-gray-7">
              “{{ r.quote }}”
            </blockquote>
          </figure>
        </div>
      </section>
    </div>
  </ConnectShell>
</template>

<style scoped>
/* The rings fade towards the panel's edge rather than stopping at it. */
.fc-rings {
  mask-image: radial-gradient(circle at center, #000 55%, transparent 72%);
}
</style>
