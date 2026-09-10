<script setup>
// SCREEN 1 — frappe.io/partners
//
// The discovery surface, not part of Frappe Connect. A stand-in for a page that
// already exists on the marketing site, so it's styled as *website* rather than
// *app*: serif headings, a 600px measure, a decorative product rail down the
// left, no app chrome.
//
// ⚠️ TYPE IS THE REAL SITE'S, measured off frappe.io/partners rather than
// chosen. Don't "tidy" these into the product scale — they're what makes the
// page read as the marketing site:
//
//   headline    Newsreader 32/41.6, weight 500 — the ONLY serif on the page
//   heading     Inter 20, weight 600
//   eyebrow     Inter 11, weight 600, uppercase, 0.09em tracking
//   body        Inter 15/23.55
//   label       Inter 15, weight 600
//   site chrome Inter 14
//
// The real site sets its section headings in the serif too. Four serif headings
// down one page read as a run of title cards; one reads as a headline, which is
// the job the serif is here to do.
//
// Buttons are frappe-ui's `Button` at `size="md"`, which is h-8 / px-2.5 /
// rounded-4 — the same 32px pill the real site uses, measured.
//
// This version opens with three calls to action instead of one, because two of
// the three ways to work with a partner no longer involve browsing a directory:
//
//   Guided onboarding   a 3-hour partner-led program; Frappe assigns the partner
//   Starter packs       fixed scope, fixed price;     Frappe assigns the partner
//   Custom              scoped with a partner;        you choose the partner
//
// Links into Connect open a NEW TAB — `Button`'s `link` prop does that for us —
// because the fiction is that you're leaving frappe.io and arriving somewhere
// else.
import { Avatar, Button } from 'frappe-ui'
import { SUCCESS_STORIES } from '../data/partners'
import { ONBOARDING } from '../data/onboarding'
// A placeholder portrait for the testimonial. Generated art, like the rest of
// `assets/media` — see `scripts/`.
import portrait from '../assets/media/placeholder-2.jpg'
// The real mark, taken from frappe.io itself. Its corner radius is baked into
// the artwork, so it takes no `rounded-*` of its own.
import frappeMark from '../assets/frappe.svg'

// Where the app is mounted — '/' locally, '/frappe-connect-prototype/' on
// GitHub Pages. Only the hand-written links below need it; every other link in
// the app goes through the router, which handles the base itself.
const baseUrl = import.meta.env.BASE_URL
const connect = (path = '') => `${baseUrl}connect${path}`

// The three doors, in increasing order of commitment.
//
// ⚠️ Each of these used to carry a fourth bullet saying who picks the partner:
// Frappe assigns one for onboarding and packs, you choose your own for custom.
// That's the real difference between the three products and the thing a reader
// is most likely to get wrong, and it no longer appears anywhere on this page.
// It needs saying on the pack and programme views instead.
const SERVICES = [
  {
    id: 'onboarding',
    title: ONBOARDING.name,
    points: [
      'Three focused one hour sessions',
      'Learn the core workflows by doing them',
      'Leave with an implementation roadmap',
    ],
    cta: 'See the program',
    link: connect('/onboarding'),
  },
  {
    id: 'packs',
    title: 'Starter packs',
    points: [
      'No customization, ERPNext as it ships',
      'For businesses running under 50 users',
      'Published pricing, no quote to wait for',
    ],
    cta: 'View packs',
    link: connect('/packs'),
  },
  {
    id: 'custom',
    title: 'Custom implementation',
    points: [
      'Built around your processes and integrations',
      'Specialist knowledge transfer',
      'Maintenance and support after go live',
    ],
    cta: 'Browse partners',
    link: connect(),
  },
]

const BENEFITS = [
  {
    title: 'Worldwide presence',
    body: 'Partners in more than 30 countries, each with deep experience of the businesses and processes in their region.',
    icon: 'globe',
  },
  {
    title: 'Certified professionals',
    body: 'Every partner is ERPNext certified and trained to run complex implementations, then support them afterwards.',
    icon: 'badge',
  },
  {
    title: 'Quality you can check',
    body: 'Frappe audits partners regularly and publishes a maturity rating on every profile, so you are not choosing blind.',
    icon: 'gauge',
  },
]

// ⚠️ PLACEHOLDER, and invented — the person, the company and the words. A
// testimonial is a commercial claim, and putting one in a real person's mouth
// asserts something nobody verified. Silverpine is one of the fictional client
// companies in `data/media.js`. Swap for a real, cleared quote and a real
// photograph.
const TESTIMONIAL = {
  quote:
    'We spent months getting nowhere on our own. Three weeks with a partner and we were running real invoices through it. The difference was having someone who had done it all before.',
  name: 'Anita Raghavan',
  role: 'Operations Director, Silverpine',
}

// The rail's icons. A flat list with `gap` between groups would space them
// evenly; the real site clusters them, so the groups are nested arrays.
const RAIL = [
  ['house'],
  ['grid', 'globe', 'mail'],
  ['book', 'users', 'pin', 'bulb'],
  ['file', 'target', 'video', 'award'],
]
</script>

<template>
  <div class="flex min-h-screen bg-white text-ink-gray-8">
    <!-- frappe.io's own product rail. Decorative: it establishes that this page
         sits inside the marketing site, and none of it is part of the handoff —
         hence `aria-hidden` and nothing interactive in it.
         ⚠️ The rail is hidden below `md`, and the Frappe mark goes with it.
         The real site has a mobile nav that keeps the branding; this mock
         doesn't, because the rail isn't what's under review here. -->
    <aside
      class="sticky top-0 hidden h-screen w-12 shrink-0 flex-col items-center gap-6 border-r border-outline-gray-2 py-4 md:flex"
      aria-hidden="true"
    >
      <!-- The mark belongs to the rail, not the top bar — checked against
           frappe.io, where it sits at the rail's top and the bar beside it
           carries the breadcrumb alone. -->
      <img :src="frappeMark" alt="" class="size-6" />
      <div v-for="(group, gi) in RAIL" :key="gi" class="flex flex-col items-center gap-3.5">
        <span v-for="icon in group" :key="icon" class="text-ink-gray-4">
          <LucideHouse v-if="icon === 'house'" class="size-4" />
          <LucideLayoutGrid v-else-if="icon === 'grid'" class="size-4" />
          <LucideGlobe v-else-if="icon === 'globe'" class="size-4" />
          <LucideMail v-else-if="icon === 'mail'" class="size-4" />
          <LucideBookOpen v-else-if="icon === 'book'" class="size-4" />
          <LucideUsers v-else-if="icon === 'users'" class="size-4" />
          <LucideMapPin v-else-if="icon === 'pin'" class="size-4" />
          <LucideLightbulb v-else-if="icon === 'bulb'" class="size-4" />
          <LucideFileText v-else-if="icon === 'file'" class="size-4" />
          <LucideTarget v-else-if="icon === 'target'" class="size-4" />
          <LucideVideo v-else-if="icon === 'video'" class="size-4" />
          <LucideAward v-else class="size-4" />
        </span>
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <!-- Site chrome. 14px, the one place on the page that isn't 15.
           `min-h-12` and the gray-1 rule are Connect's own top bar, measured
           from `ConnectShell` — the two screens sit a click apart and a header
           that changes height across that seam reads as a different app. -->
      <header
        class="flex min-h-12 items-center justify-between border-b border-outline-gray-1 px-4 sm:px-5"
      >
        <nav class="flex items-center gap-2 text-[14px]" aria-label="Breadcrumb">
          <a href="#" class="text-ink-gray-7 hover:underline">Frappe</a>
          <LucideChevronRight class="size-4 text-ink-gray-4" />
          <span class="text-ink-gray-6">Work with Partners</span>
        </nav>
        <!-- The account entry, and deliberately not "Get started".
             This is the path a visitor takes when they DON'T pick one of the
             three services below — they sign in and land on the home with all
             three. The three cards are the product entries; this is the account
             one, and the two shouldn't read as the same offer.
             The wording is the real frappe.io's, and it's what Connect's own top
             bar says too (see `ConnectShell`), so a visitor meets the same
             control either side of the seam. -->
        <a
          :href="connect('/signup')"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-1.5 text-[14px] font-medium text-ink-gray-7 hover:text-ink-gray-9"
        >
          Log in or create account
          <LucideArrowRight class="size-4" />
        </a>
      </header>

      <!-- 600px is the real site's measure, so it lives on each section rather
           than on one wrapper: the service cards need 800 (four bullets beside
           a full-height image doesn't fit a 600 column), and anything else that
           needs the extra width later can take it without moving the rest. -->
      <div class="px-6 pb-32">
        <section class="mx-auto max-w-[600px] pb-32 pt-16 text-center">
          <h1
            class="font-serif text-[32px] font-medium leading-[1.3] tracking-[0.01em] text-ink-gray-8"
          >
            Get the best Frappe experience from trained and certified partners
          </h1>
          <!-- Short enough to hold one line at this measure, and `text-balance`
               splits it evenly rather than stranding a word if it ever wraps. -->
          <p
            class="mx-auto mt-2 max-w-[420px] text-balance text-[15px] leading-[1.57] text-ink-gray-6"
          >
            Partners in over 30 countries, ready to get you running.
          </p>
          <div class="mt-4 flex justify-center">
            <!-- `subtle`, not solid. The page's real question is which of the
                 three services below you want, and a filled button in the hero
                 answered it for the reader before they'd been asked — it also
                 pointed at the same place as "Browse partners", so the loudest
                 control on the page was a shortcut past the choice the page
                 exists to present. Subtle keeps it a shortcut rather than the
                 answer, while still reading as a button at rest: ghost had no
                 fill until you hovered it, which in the middle of an empty hero
                 left it looking like a link someone had centred. -->
            <Button variant="subtle" size="md" label="Find a partner" :link="connect()">
              <template #suffix><LucideArrowRight class="size-4" /></template>
            </Button>
          </div>
        </section>

        <!-- The three doors -->
        <section class="mx-auto max-w-[800px] pb-32">
          <p
            class="text-center text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-gray-5"
          >
            Services
          </p>
          <h2 class="mt-2 text-center text-[20px] font-semibold leading-[1.3] text-ink-gray-8">
            Find the right fit for your business
          </h2>

          <!-- Three rows, not three cards. Boxing each one drew a frame around
               a title and four bullets, which is most of a card's contents
               already; the rules between rows separate them with nothing drawn
               around the outside. Every list on this page is built this way —
               24px above and below each row. -->
          <ul class="mt-10 divide-y divide-outline-gray-1">
            <li
              v-for="s in SERVICES"
              :key="s.id"
              class="flex flex-col gap-5 py-6 first:pt-0 sm:flex-row sm:items-stretch"
            >
              <!-- Placeholder art, full height of the row. A gradient rather
                   than a stock photo, for the same reason the profile gallery
                   uses one: a photo here would be a claim about a session that
                   hasn't happened. -->
              <div
                class="h-[110px] shrink-0 rounded-4 sm:h-auto sm:w-[340px]"
                :style="{
                  backgroundImage: 'linear-gradient(140deg, #e7e9ec, #cfd3d9 45%, #a9aeb6)',
                }"
                role="img"
                :aria-label="`Illustration for ${s.title}`"
              />
              <div class="min-w-0 flex-1">
                <h3 class="text-[17px] font-medium text-ink-gray-7">{{ s.title }}</h3>
                <ul class="mt-3 space-y-1.5">
                  <li
                    v-for="p in s.points"
                    :key="p"
                    class="flex items-start gap-2 text-[15px] leading-[1.5] text-ink-gray-6"
                  >
                    <LucideCheck class="mt-1 size-3.5 shrink-0 text-ink-gray-4" />
                    {{ p }}
                  </li>
                </ul>
                <div class="mt-4">
                  <Button size="md" :label="s.cta" :link="s.link">
                    <template #suffix><LucideArrowRight class="size-4" /></template>
                  </Button>
                </div>
              </div>
            </li>
          </ul>

          <!-- The fourth path, deliberately quiet. Someone who can't place
               themselves in any of the three above shouldn't have to guess, but
               giving this a card of its own would make the choice four wide and
               the three above are the products.
               ⚠️ Inert: there's no scheduling screen for the Frappe team yet. -->
          <p class="mt-6 text-center text-[15px] text-ink-gray-6">
            Not sure which one you need?
            <button type="button" class="font-medium text-ink-gray-7 underline underline-offset-2">
              Talk to the Frappe team
            </button>
          </p>
        </section>

        <!-- Testimonial.
             The bracketed treatment from the partner profile's "Partner vision"
             section, so a quote looks like a quote in both places: an opening
             mark with a rule running off to the right, a closing mark with a
             rule running back. The rules do a card border's work without adding
             a frame. See `components/PartnerVisionSection.vue` — if one of
             these changes, change both. -->
        <section class="mx-auto max-w-[600px] pb-32">
          <figure>
            <div class="flex items-center gap-3">
              <span
                class="translate-y-[0.1em] select-none font-serif text-12xl leading-[0.42] text-ink-gray-3"
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <span class="flex-1 border-t border-outline-gray-1" />
            </div>

            <div class="mt-4 flex items-start justify-between gap-6">
              <div class="min-w-0 flex-1">
                <!-- 15px: the body size. A pull quote set larger than the page
                     it sits in reads as a headline, and this is somebody
                     talking. -->
                <blockquote class="text-[15px] leading-[1.57] text-ink-gray-6">
                  {{ TESTIMONIAL.quote }}
                </blockquote>
                <figcaption class="mt-5">
                  <p class="text-[15px] font-medium text-ink-gray-7">{{ TESTIMONIAL.name }}</p>
                  <p class="mt-0.5 text-[15px] text-ink-gray-6">{{ TESTIMONIAL.role }}</p>
                </figcaption>
              </div>
              <Avatar class="size-16 shrink-0" :image="portrait" :label="TESTIMONIAL.name" />
            </div>

            <div class="mt-4 flex items-center gap-3">
              <span class="flex-1 border-t border-outline-gray-1" />
              <span
                class="translate-y-[0.1em] select-none font-serif text-12xl leading-[0.42] text-ink-gray-3"
                aria-hidden="true"
              >
                &rdquo;
              </span>
            </div>
          </figure>
        </section>

        <!-- Benefits -->
        <section class="mx-auto max-w-[600px] pb-32">
          <h2 class="text-[20px] font-semibold leading-[1.3] text-ink-gray-8">
            Benefits of working with a Frappe Partner
          </h2>
          <dl class="mt-10 divide-y divide-outline-gray-1">
            <div v-for="b in BENEFITS" :key="b.title" class="flex gap-4 py-6 first:pt-0">
              <div class="mt-0.5 shrink-0 text-ink-gray-5" aria-hidden="true">
                <LucideGlobe v-if="b.icon === 'globe'" class="size-5" />
                <LucideBadgeCheck v-else-if="b.icon === 'badge'" class="size-5" />
                <LucideGauge v-else class="size-5" />
              </div>
              <div>
                <dt class="text-[15px] font-medium text-ink-gray-7">{{ b.title }}</dt>
                <dd class="mt-1 text-[15px] leading-[1.57] text-ink-gray-6">{{ b.body }}</dd>
              </div>
            </div>
          </dl>
        </section>

        <!-- Case studies -->
        <section class="mx-auto max-w-[600px]">
          <p class="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-gray-5">
            Case studies
          </p>
          <h2 class="mt-2 text-[20px] font-semibold leading-[1.3] text-ink-gray-8">
            Success stories
          </h2>

          <!-- A list rather than three cards. Boxing each one puts a frame
               around a title and a thumbnail, which is most of a card's
               contents already; the rules between rows do the same work with
               nothing drawn around the outside. -->
          <ul class="mt-10 divide-y divide-outline-gray-1">
            <li
              v-for="story in SUCCESS_STORIES"
              :key="story.id"
              class="flex items-stretch gap-4 py-6 first:pt-0"
            >
              <div class="min-w-0 flex-1">
                <h3 class="text-[15px] font-medium leading-[1.4] text-ink-gray-7">
                  {{ story.title }}
                </h3>
                <!-- ⚠️ No like or comment counts, unlike the wireframe. These
                     are real ERPNext case studies; inventing engagement figures
                     on them would assert something false about how they did. -->
                <!-- `text-2xs` is frappe-ui's smallest step (11px, weight 420,
                     0.01em). The eyebrows above each section are the site's own
                     11/600/0.09em, and this is deliberately not that: an
                     eyebrow announces a section, this labels a row. -->
                <p class="mt-2 flex items-center gap-2 text-2xs text-ink-gray-5">
                  <img :src="frappeMark" alt="" class="size-4" />
                  By Frappe
                  <span aria-hidden="true">·</span>
                  <span class="uppercase">{{ story.tag }}</span>
                </p>
              </div>
              <div
                class="w-[100px] shrink-0 rounded-4"
                :style="{
                  backgroundImage: `linear-gradient(135deg, ${story.art[0]}, ${story.art[1]})`,
                }"
                role="img"
                :aria-label="`Placeholder artwork for: ${story.title}`"
              />
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
