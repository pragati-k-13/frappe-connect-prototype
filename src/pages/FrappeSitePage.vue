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
// ⚠️ ONE CALL TO ACTION, not three. This page listed the three ways to work
// with a partner as three cards with three buttons, which was right while they
// were three products a visitor picked between. They are two now — guided
// onboarding is gone — and, more to the point, PICKING IS NO LONGER THE
// VISITOR'S JOB: Frappe Connect asks three questions and tells them which of
// the two fits. A page that makes someone choose between them first is asking
// the question the next page exists to answer.
//
// So the cards describe what exists and the single button goes to the
// questions. The directory link stays beside it for the visitor who came here
// to browse firms and should not be forced through a form to do it.
//
// ⚠️ LINKS INTO CONNECT NAVIGATE IN PLACE, and they used to open a new tab on
// the argument that the fiction is you are leaving frappe.io for somewhere
// else. The fiction is still true and the new tab was still wrong: this is a
// prototype somebody walks through, and a tab that opens behind or beside the
// one being reviewed breaks the walk — worse in a preview pane, where the new
// tab may not be visible at all. The route change says the same thing, because
// the two screens look nothing alike.
import { useRouter } from 'vue-router'
import { Button, ScrollArea } from 'frappe-ui'
import { SUCCESS_STORIES } from '../data/partners'
// The real mark, taken from frappe.io itself. Its corner radius is baked into
// the artwork, so it takes no `rounded-*` of its own.
import frappeMark from '../assets/frappe.svg'

// Where the app is mounted — '/' locally, '/frappe-connect-prototype/' on
// GitHub Pages. Only the hand-written links below need it; every other link in
// the app goes through the router, which handles the base itself.
const router = useRouter()

// Into the app, through the router, so Back comes back here.
const go = (path = '') => router.push(`/connect${path}`)

// The three doors, in increasing order of commitment.
//
// ⚠️ THE LAST BULLET OF EACH NAMES WHO PICKS THE PARTNER, which is the real
// difference between the two and the thing a reader is most likely to get
// wrong. It used to be missing from this page entirely.
//
// ⚠️ THE "Services" SECTION IS GONE, and it was the most detailed thing on
// this page: two rows of four bullets each, with full-height gradient art,
// under "Find the right fit for your business". It broke the two offers down
// further than frappe.io/partners breaks anything down, on a page whose job is
// to get somebody INTO Connect rather than to explain what is inside it — and
// every bullet was a claim this mock had invented and would have to keep in
// step with the recommendation screen, the pack catalogue and the contract.
//
// The invented testimonial went with it, for a harder reason: a quote is a
// commercial claim, and the person, the company and the words were all made up.
//
// What is left is the real page's shape — who partners are, why you would use
// one, what they have delivered — and one way in.
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

// ⚠️ THE ICON RAIL IS GONE, and it was the page's most convincing wrong thing.
// Twelve grey glyphs down the left edge, `aria-hidden`, nothing interactive —
// decoration standing exactly where navigation stands. The first person to look
// at it clicked the envelope and asked whether it went to the contact page,
// which is the whole argument: an element that looks like a nav is a nav, and
// one that answers no click is broken rather than decorative.
//
// Wiring the envelope would have been worse — one live icon among eleven dead
// ones makes the eleven look like a bug instead of a backdrop.
//
// It was also not the real site. frappe.io navigates by a horizontal top nav —
// Home, Products, Partners, Contact — which this page now carries, so the rail
// was costing a column and the page's only false affordance to imitate
// something that is not there.
</script>

<template>
  <!-- ⚠️ `h-screen`, not `min-h-screen`. The page used to grow the document and
       scroll it, which meant the browser's own scrollbar — the only one left in
       the app, since every Connect screen scrolls inside a `ScrollArea`. Pinning
       the root to the viewport moves the overflow into the column below, where
       `ScrollArea` gives it frappe-ui's overlay bar: thin, over the content, and
       faded out until you scroll or hover. -->
  <div class="flex h-screen bg-white text-ink-gray-8">

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <!-- Site chrome. 14px, the one place on the page that isn't 15.
           `min-h-12` and the gray-1 rule are Connect's own top bar, measured
           from `ConnectShell` — the two screens sit a click apart and a header
           that changes height across that seam reads as a different app.

           ⚠️ It used to be `sticky top-0 z-10`, because this page scrolled the
           document and the bar had to hold itself in place. It now sits OUTSIDE
           the `ScrollArea` below, exactly as Connect's own bar sits outside the
           shell's — so it is fixed by construction, and the account CTA stays in
           reach without a stacking context or an opaque background to stop the
           hero sliding under it. -->
      <header
        class="flex min-h-12 shrink-0 items-center justify-between border-b border-outline-gray-1 bg-white px-4 sm:px-5"
      >
        <!-- ⚠️ THE MARK LIVES HERE NOW. It used to sit at the rail's top,
             which was right while there was a rail — and it meant the branding
             vanished below `md`, where the rail was hidden. In the bar it is
             present at every width, and the two mocked site pages carry the
             same chrome, which they should: they are one website. -->
        <nav class="flex items-center gap-2 text-[14px]" aria-label="Breadcrumb">
          <img :src="frappeMark" alt="" class="size-6" />
          <a href="#" class="text-ink-gray-7 hover:underline">Frappe</a>
          <LucideChevronRight class="size-4 text-ink-gray-4" />
          <span class="text-ink-gray-6">Work with Partners</span>
        </nav>
        <!-- The account entry, and deliberately not "Get started".
             This is the path a visitor takes when they DON'T pick one of the
             two products below — they sign in and land on the home with all
             three. The three cards are the product entries; this is the account
             one, and the two shouldn't read as the same offer.
             The wording is the real frappe.io's, and it's what Connect's own top
             bar says too (see `ConnectShell`), so a visitor meets the same
             control either side of the seam. -->
        <!-- ⚠️ ONE GROUP, because `justify-between` on three children spreads
             them across the bar and the site nav would have drifted into the
             middle of it, reading as neither left nor right.
             The Contact link is here because the two mocked site pages had no
             way between them: `/contact` was reachable only by typing it, so
             the walk a reviewer actually takes — site, contact, Connect — could
             not be taken. -->
        <div class="flex items-center gap-5">
          <RouterLink to="/contact" class="text-[14px] text-ink-gray-6 hover:text-ink-gray-8">
            Contact
          </RouterLink>
          <button
            type="button"
            class="flex items-center gap-1.5 text-[14px] font-medium text-ink-gray-7 hover:text-ink-gray-9"
            @click="go('/signup')"
          >
            Log in or create account
            <LucideArrowRight class="size-4" />
          </button>
        </div>
      </header>

      <!-- Everything below the bar scrolls, and it scrolls HERE rather than in
           the document — see the note on the root.

           600px is the real site's measure, so it lives on each section rather
           than on one wrapper: the service cards need 800 (four bullets beside
           a full-height image doesn't fit a 600 column), and anything else that
           needs the extra width later can take it without moving the rest. -->
      <ScrollArea class="min-h-0 flex-1">
        <div class="px-6 pb-32">
          <!-- ⚠️ THE REAL PAGE'S HEADLINE AND STANDFIRST, verbatim. What stood
               here — "Get the best Frappe experience from trained and certified
               partners" — was mine, and better copy is not the job: this page
               is a stand-in whose only purpose is to be recognisable as the
               marketing site a visitor arrives from. -->
          <section class="mx-auto max-w-[600px] pt-16 text-center">
            <h1
              class="font-serif text-[32px] font-medium leading-[1.3] tracking-[0.01em] text-ink-gray-8"
            >
              Frappe Partners
            </h1>
            <p
              class="mx-auto mt-2 max-w-[440px] text-balance text-[15px] leading-[1.57] text-ink-gray-6"
            >
              Meet a global community of committed open source entrepreneurs.
            </p>
          </section>

          <!-- ── The way in ──────────────────────────────────────────────
               ⚠️ THE REAL PAGE'S "Find a partner" BUTTON, pointed somewhere
               else. There it opens a regional directory and leaves the visitor
               to pick a firm; here it opens the three questions, because
               picking is the thing Connect exists to stop being the visitor's
               job. The directory is still one line below for anybody who came
               to browse — they are the reason this page exists at all, and
               making them answer three questions first would be a worse page
               than the one it replaced. -->
          <section class="mx-auto max-w-[600px] pb-32 pt-10 text-center">
            <p class="text-[15px] leading-[1.57] text-ink-gray-6">
              Partners implement Frappe products for businesses in more than 30 countries. Tell us
              what you are running and we will say which of them fits, and what it costs.
            </p>
            <div class="mt-6 flex flex-col items-center gap-3">
              <Button variant="solid" size="md" label="Find a partner" @click="go()">
                <template #suffix><LucideArrowRight class="size-4" /></template>
              </Button>
              <button
                type="button"
                class="text-[15px] text-ink-gray-6 underline underline-offset-2 hover:text-ink-gray-8"
                @click="go('/partners')"
              >
                Or browse all 156 partners
              </button>
            </div>
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
      </ScrollArea>
    </div>
  </div>
</template>
