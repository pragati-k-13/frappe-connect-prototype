<script setup>
// SCREEN 1 — frappe.io/partners
//
// The discovery surface, not part of Frappe Connect. A stand-in for a page that
// already exists on the marketing site, so it's styled as *website* rather than
// *app*: serif headings, a 600px measure, the product rail down the left, no
// app chrome.
//
// ⚠️ READ OFF THE LIVE PAGE IN A REAL BROWSER, twice now. A text summary of
// this site has been wrong about it once before — it invented four "how can we
// help" cards on /contact — so every number and every sentence below was
// measured in the DOM rather than recalled. What that produced:
//
//   eyebrow     Inter 11, weight 600, uppercase, 0.09em tracking
//   headline    Newsreader 32/41.6, weight 500
//   section     Newsreader 24, weight 500
//   body        Inter 15/23.55
//   label       Inter 15, weight 600
//   site chrome Inter 14
//   measure     598px, LEFT aligned, not centred
//   hero image  598x200 (partners-photo.webp)
//   benefits    stacked rows, 40px icon, 24px gutter
//
// ⚠️ SECTION HEADINGS ARE SERIF NOW, and they were Inter 20 semibold on the
// argument that four serif headings down one page read as a run of title cards
// while one reads as a headline. That is a real effect and it was still the
// wrong call for this file: the page is a stand-in, and the thing a stand-in
// owes is recognisability. The real site sets them in Newsreader 24, so they
// are Newsreader 24. The hierarchy survives on size alone — 32 against 24.
//
// ⚠️ THE HERO IS LEFT ALIGNED, likewise measured. This mock centred it, which
// is the single loudest difference between the two pages at a glance.
//
// ⚠️ TWO THINGS ON THE LIVE PAGE ARE BROKEN, and both are reproduced HERE as
// what they were plainly meant to be rather than as what they say:
//
//   1. The line under the hero image reads "Frappe Partners to find the best
//      match for your business." — a sentence with its subject edited away. It
//      is written out below.
//   2. The success-stories section's body is the literal string "Some content
//      comes here maybe?", with a headline over it. That is placeholder copy
//      shipped to production, which is why this mock's own success stories
//      section stands instead of it.
//
// Copying a typo into a design mock is not fidelity, it is transplanting a bug;
// but neither is quietly rewriting a page somebody else owns. So: repaired,
// and recorded here.
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
import SiteRail from '../components/SiteRail.vue'
import { SUCCESS_STORIES } from '../data/partners'
// The real mark, taken from frappe.io itself. Its corner radius is baked into
// the artwork, so it takes no `rounded-*` of its own.
import frappeMark from '../assets/frappe.svg'

const router = useRouter()

// Into the app, through the router, so Back comes back here.
const go = (path = '') => router.push(`/connect${path}`)

// ⚠️ THE REAL PAGE'S THREE, VERBATIM — titles and bodies both. What stood here
// was a rewrite of them: "Quality you can check" for "Quality focus", and three
// bodies tightened into one sentence each. Better copy is not this file's job,
// and every word I improved was a word that no longer matched the page a
// visitor had just been reading.
//
// ⚠️ ICONS, NOT GREY BLOCKS. The live page draws each of these as a 40px SVG,
// so by the letter of "grey block for an image" they would be three grey
// squares — which communicates nothing where the original communicates a
// category. The grey block stands in for the PHOTOGRAPH, which is art nobody
// can reproduce; a 40px glyph is a shape anybody can.
const BENEFITS = [
  {
    title: 'Worldwide presence',
    body: 'With our partners in 30+ countries having vast experience in their respective regional businesses and processes, find the best for yourself to support your mission-critical ERPNext system.',
    icon: 'globe',
  },
  {
    title: 'Certified professionals',
    body: 'Our ERPNext-certified partners are highly skilled in implementing complex systems. They are extensively trained to manage the support smoothly and help you with your business needs.',
    icon: 'badge',
  },
  {
    title: 'Quality focus',
    body: 'We work closely with our partners to ensure you get high quality service. Frappe provides best practices and regularly audits the partners as well. You can find a partner’s maturity rating on the listing.',
    icon: 'gauge',
  },
]
</script>

<template>
  <!-- ⚠️ `h-screen`, not `min-h-screen`. The page used to grow the document and
       scroll it, which meant the browser's own scrollbar — the only one left in
       the app, since every Connect screen scrolls inside a `ScrollArea`. Pinning
       the root to the viewport moves the overflow into the column below, where
       `ScrollArea` gives it frappe-ui's overlay bar: thin, over the content, and
       faded out until you scroll or hover. -->
  <div class="flex h-screen bg-white text-ink-gray-8">
    <SiteRail />

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <!-- Site chrome. 14px, the one place on the page that isn't 15.
           `min-h-12` and the gray-1 rule are Connect's own top bar, measured
           from `ConnectShell` — the two screens sit a click apart and a header
           that changes height across that seam reads as a different app. -->
      <header
        class="flex min-h-12 shrink-0 items-center justify-between border-b border-outline-gray-1 bg-white px-4 sm:px-5"
      >
        <nav class="flex items-center gap-2 text-[14px]" aria-label="Breadcrumb">
          <a href="#" class="text-ink-gray-7 hover:underline">Frappe</a>
          <LucideChevronRight class="size-4 text-ink-gray-4" />
          <span class="text-ink-gray-6">Partners</span>
        </nav>
        <!-- The wording is the real frappe.io's, and it's what Connect's own top
             bar says too (see `ConnectShell`), so a visitor meets the same
             control either side of the seam.
             ⚠️ NO Contact LINK HERE. One was added when the rail was mistakenly
             removed, and the real bar does not carry it — the rail does, which
             is the whole point. -->
        <button
          type="button"
          class="flex items-center gap-1.5 text-[14px] font-medium text-ink-gray-7 hover:text-ink-gray-9"
          @click="go('/signup')"
        >
          Log in or create account
          <LucideArrowRight class="size-4" />
        </button>
      </header>

      <!-- Everything below the bar scrolls, and it scrolls HERE rather than in
           the document — see the note on the root.

           600px is the real site's measure (598, rounded), and it sits on each
           section rather than on one wrapper so a later section that needs more
           width can take it without moving the rest. -->
      <ScrollArea class="min-h-0 flex-1">
        <div class="px-6 pb-32">
          <!-- ── Hero ──────────────────────────────────────────────────── -->
          <section class="mx-auto max-w-[600px] pt-16">
            <p class="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-gray-5">
              Frappe Partners
            </p>
            <h1
              class="mt-2 font-serif text-[32px] font-medium leading-[1.3] tracking-[0.01em] text-ink-gray-8"
            >
              Meet a global community of committed open source entrepreneurs
            </h1>
            <p class="mt-3 text-[15px] leading-[1.57] text-ink-gray-6">
              Frappe builds innovative products and our global network of partners help businesses
              implement them smoothly. Our partners are trained and certified to ensure our
              customers get the best Frappe experience.
            </p>

            <!-- ⚠️ A GREY BLOCK, as asked, at the real image's 598x200 — so
                 dropping the photograph in later reflows nothing. `aria-hidden`
                 rather than a `role="img"` with a label: a placeholder that
                 announces itself to a screen reader is announcing something
                 that is not there. -->
            <div class="mt-8 aspect-[3/1] w-full rounded-4 bg-surface-gray-2" aria-hidden="true" />

            <!-- The sentence under the image, with its subject restored — see
                 the note at the top of this file. -->
            <p class="mt-8 text-[15px] leading-[1.57] text-ink-gray-6">
              Browse through our list of Frappe Partners to find the best match for your business.
            </p>

            <!-- ⚠️ "Find a partner" GOES TO THE LIST, which is what it does on
                 the real page: there it opens a regional directory, here it
                 opens the partner directory inside Connect. It used to open the
                 three questions instead — a button that names one destination
                 and delivers another, on the one page whose job is to be
                 recognisable. Answering questions is what the SECOND door
                 below is for, and it says so. -->
            <div class="mt-6">
              <Button variant="solid" size="md" label="Find a partner" @click="go('/partners')">
                <template #suffix><LucideArrowRight class="size-4" /></template>
              </Button>
            </div>

            <!-- ── The second door ────────────────────────────────────────
                 ⚠️ THIS REPLACED "Or browse all 156 partners", which was the
                 same offer as the button above it wearing a number — and the
                 number was the problem: a page cannot read the directory, so
                 156 was a figure this mock would have to keep in step with the
                 partner list by hand, on the page a visitor trusts least.

                 What it says instead is the thing the directory cannot do for
                 somebody who does not know what they are looking at. Quiet, and
                 second: most people who reach this page came to see the firms,
                 and being asked three questions before you are allowed to look
                 is the experience this whole flow exists to replace. -->
            <p class="mt-10 border-t border-outline-gray-1 pt-6 text-[15px] leading-[1.57] text-ink-gray-6">
              Not sure what you need built? Answer three questions about your business and we will
              say which service fits, and what it costs.
            </p>
            <button
              type="button"
              class="mt-2 flex items-center gap-1.5 text-[15px] font-medium text-ink-gray-8 hover:underline"
              @click="go('?new=1')"
            >
              Get a recommendation
              <LucideArrowRight class="size-4 text-ink-gray-5" />
            </button>
          </section>

          <!-- ── Benefits ──────────────────────────────────────────────────
               ⚠️ NO EYEBROW, and the real page has one: "Join us", sitting over
               a section about the benefits of HIRING a partner. It belongs to
               the become-a-partner section at the foot of the page and has come
               adrift. Reproducing it would make this mock unreadable in the one
               way the original is. -->
          <section class="mx-auto max-w-[600px] pt-24">
            <h2 class="font-serif text-[24px] font-medium leading-[1.3] text-ink-gray-8">
              Benefits of working with a Frappe Partner
            </h2>
            <!-- Stacked rows with the icon in a 40px gutter, as measured — not
                 the three-across grid this kind of section usually gets. At the
                 site's 600px measure three columns would be 190px each, which
                 is a column for the title and a paragraph broken into six
                 lines. -->
            <dl class="mt-10 space-y-8">
              <div v-for="b in BENEFITS" :key="b.title" class="flex gap-6">
                <div class="shrink-0 text-ink-gray-5" aria-hidden="true">
                  <LucideGlobe v-if="b.icon === 'globe'" class="size-10" stroke-width="1.25" />
                  <LucideBadgeCheck
                    v-else-if="b.icon === 'badge'"
                    class="size-10"
                    stroke-width="1.25"
                  />
                  <LucideGauge v-else class="size-10" stroke-width="1.25" />
                </div>
                <div class="min-w-0">
                  <dt class="text-[15px] font-semibold text-ink-gray-8">{{ b.title }}</dt>
                  <dd class="mt-1 text-[15px] leading-[1.57] text-ink-gray-6">
                    {{ b.body }}
                    <!-- The real page's own link, to the page that explains the
                         rating. It leaves the prototype entirely, so it is the
                         one link here that opens a tab rather than navigating
                         in place. -->
                    <a
                      v-if="b.icon === 'gauge'"
                      href="https://frappe.io/partners/maturity-model"
                      target="_blank"
                      rel="noreferrer"
                      class="underline underline-offset-2 hover:text-ink-gray-8"
                    >
                      Here is what it means.
                    </a>
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <!-- ── Success stories ───────────────────────────────────────────
               Left as it was, by instruction — and the live page is the
               argument for keeping it: its success-stories section is a
               headline over the words "Some content comes here maybe?". This
               one at least points at real ERPNext case studies. -->
          <section class="mx-auto max-w-[600px] pt-24">
            <p class="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-gray-5">
              Case studies
            </p>
            <h2 class="mt-2 font-serif text-[24px] font-medium leading-[1.3] text-ink-gray-8">
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

          <!-- ── Become a partner ──────────────────────────────────────────
               The real page's fourth section, and the only one addressed to
               somebody who is not a customer. It is here because the ask was
               fidelity and this is a quarter of the page — but the partner side
               of this prototype does not exist, so the button says so rather
               than going somewhere that would have to be invented. Same
               treatment as the inert "Get in touch" on the contact mock. -->
          <section class="mx-auto max-w-[600px] pt-24">
            <h2 class="font-serif text-[24px] font-medium leading-[1.3] text-ink-gray-8">
              Join us, become a Frappe Partner
            </h2>
            <p class="mt-3 text-[15px] leading-[1.57] text-ink-gray-6">
              Becoming a Frappe Partner is more than just a title or a discount, it’s a chance to
              use Frappe’s bank of resources to help your customers join the open source community
              and grow your business effectively.
            </p>
            <button
              type="button"
              disabled
              class="mt-6 flex items-center gap-1.5 rounded-4 bg-surface-gray-2 px-3 py-1.5 text-[15px] text-ink-gray-5"
            >
              Become a partner
              <LucideArrowRight class="size-4" />
            </button>
          </section>
        </div>
      </ScrollArea>
    </div>
  </div>
</template>
