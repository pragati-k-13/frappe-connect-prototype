<script setup>
// frappe.io/get-started
//
// ⚠️ STORED, NOT ROUTED. Kept for reference; the frappe.io flow now starts on
// the contact page. `router.js` has the route to restore it.
//
// The front door on this branch: a marketing page that puts the two ways in
// side by side — a Starter Pack Frappe implements itself, or a partner of your
// choosing — and hands off into Connect from each. Same site type system as
// `FrappeSitePage` (Newsreader headings, Inter 15 body, 600px measure); the
// options section takes 800px because two cards at 600 would be 290px each.
//
// ⚠️ THE REFERENCE'S "Pricing" BLOCK IS DROPPED. The options section above it
// already carries the one price and both payment terms.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, Button, ScrollArea, Tooltip } from 'frappe-ui'
import SiteRail from '../components/SiteRail.vue'
import ConnectMark from '../components/ConnectMark.vue'
import { useConnectStore } from '../stores/connect'
import { STARTER_PACKS, priceFor } from '../data/packs'
import shotMatching from '../assets/screens/matching.webp'
import shotServices from '../assets/screens/services.webp'
import shotTracking from '../assets/screens/tracking.webp'
import { SUCCESS_STORIES } from '../data/partners'
import IconArrowRight from '~icons/lucide/arrow-right'
import IconChevronLeft from '~icons/lucide/chevron-left'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconBook from '~icons/lucide/book-open'

const router = useRouter()
const store = useConnectStore()

// Derived, not typed: the cheapest pack's price in the default (India) market,
// so this cannot drift from the catalogue.
const fromPrice = priceFor(STARTER_PACKS.reduce((a, b) => (b.hours < a.hours ? b : a)))

const viewPacks = () => {
  // Contract with PacksPage: the catalogue opens with NOTHING selected — no
  // quiz answers carried in, so clear any basket first.
  store.setPacks([])
  router.push('/connect/packs')
}
// The custom path is one brief sent to every partner that fits, not a browse.
const contactPartners = () => router.push({ name: 'contact-partners' })

const PACK_POINTS = [
  { text: 'Defined scope' },
  { text: 'Limited modules' },
  { text: 'Defined pricing' },
  // Getters, read at render, so the line follows the Demo menu's
  // "implemented by" switch.
  {
    get text() {
      return store.packsByFrappe ? 'Implemented by Frappe' : 'Implemented by a partner'
    },
    get tip() {
      return store.packsByFrappe
        ? 'Frappe’s own team runs the implementation. No partner is assigned.'
        : 'Frappe assigns a certified partner by industry and region once you have paid.'
    },
  },
  { text: 'Pay full amount upfront', warn: true },
  { text: 'Limited to ERPNext', warn: true },
]
const CUSTOM_POINTS = [
  'Work with a Partner of your choice',
  'Any customization you need',
  'Recommended for complex needs',
  'For all apps',
  'Milestone based payments',
]

const NEEDS = [
  { icon: 'zap', text: 'Small businesses need to get started fast, on a budget' },
  { icon: 'puzzle', text: 'Businesses that need custom solutions' },
  { icon: 'wrench', text: 'Self starters that want to set up apps themselves' },
]

const FEATURES = [
  {
    eyebrow: 'Matching',
    shot: shotMatching,
    alt: 'The contact quiz, with the partners that match beside it',
    title: 'Unsure what’s the best way forward for you? Let Frappe Connect guide you',
    body: 'Answer a few questions about your business and see how many partners fit before anything is sent.',
    quiz: true,
  },
  {
    eyebrow: 'Services',
    shot: shotServices,
    alt: 'The Starter Packs catalogue, with two packs in the basket',
    title: 'Book a Starter Pack or message Partners in minutes',
    body: 'Pay for a pack online, or send your requirements to the partners you pick and compare their replies.',
  },
  {
    eyebrow: 'Tracking',
    shot: shotTracking,
    alt: 'A Starter Pack project, with its setup tasks',
    title: 'Track your progress seamlessly',
    body: 'Every milestone, message and payment for your project stays in one place until go-live.',
  },
]

// ⚠️ PLACEHOLDER TESTIMONIALS. The people are invented and the companies are
// the fictional clients in `src/assets/clients`; swap for real quotes.
const TESTIMONIALS = [
  {
    quote:
      'We were live on accounting and stock in three weeks, for less than we had budgeted for the licence alone.',
    name: 'Meera Kulkarni',
    company: 'Halcyon Traders',
  },
  {
    quote:
      'Our partner rebuilt our job-costing flow inside ERPNext. Connect kept every milestone and payment in one thread.',
    name: 'Daniel Osei',
    company: 'Bluecrest Fabrication',
  },
  {
    quote:
      'Choosing between a pack and a partner took one conversation instead of a month of sales calls.',
    name: 'Ana Ferreira',
    company: 'Northwind Supply',
  },
]
const slide = ref(0)
const testimonial = computed(() => TESTIMONIALS[slide.value])
const step = (d) => (slide.value = (slide.value + d + TESTIMONIALS.length) % TESTIMONIALS.length)

const STORIES = SUCCESS_STORIES.slice(0, 3)

const FAQS = [
  {
    q: 'What is the difference between a Starter Pack and a custom implementation?',
    a: 'A Starter Pack is a fixed scope of ERPNext modules at a fixed price. A custom implementation is scoped with a partner around whatever your business needs, on any Frappe app.',
  },
  {
    q: 'Who implements a Starter Pack?',
    get a() {
      return store.packsByFrappe
        ? 'Frappe’s own team. No partner is assigned to a Starter Pack.'
        : 'A certified partner, assigned by Frappe by industry and region once you have paid.'
    },
  },
  {
    q: 'Can I pick my own partner?',
    a: 'Yes. Browse certified partners, send your requirements to the ones you like, and choose from their replies.',
  },
  {
    q: 'What if my needs outgrow a pack?',
    a: 'Add another pack, or bring in a partner for the work a pack does not cover. Nothing set up in the pack is lost.',
  },
  {
    q: 'How does payment work?',
    a: 'A Starter Pack is paid in full upfront. A custom implementation is paid by milestone, as agreed with your partner.',
  },
  {
    q: 'Can I implement it myself?',
    a: 'Yes. Every Frappe app is open source and can be installed on your own server with our installation scripts.',
  },
]
const openFaq = ref(null)
const toggleFaq = (i) => (openFaq.value = openFaq.value === i ? null : i)
</script>

<template>
  <!-- Same shell as the other site pages; see the note on the root in
       `FrappeSitePage`. -->
  <div class="flex h-screen bg-white text-ink-gray-8">
    <SiteRail />

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header
        class="flex min-h-12 shrink-0 items-center justify-between border-b border-outline-gray-1 bg-white px-4 sm:px-5"
      >
        <nav class="flex items-center gap-2 text-[14px]" aria-label="Breadcrumb">
          <RouterLink to="/" class="text-ink-gray-7 hover:underline">Frappe</RouterLink>
          <LucideChevronRight class="size-4 text-ink-gray-4" />
          <span class="text-ink-gray-6">Get started</span>
        </nav>
        <button
          type="button"
          class="flex items-center gap-1.5 text-[14px] font-medium text-ink-gray-7 hover:text-ink-gray-9"
          @click="router.push('/connect/signup')"
        >
          Log in or create account
          <LucideArrowRight class="size-4" />
        </button>
      </header>

      <ScrollArea class="min-h-0 flex-1">
        <!-- 16px gutters on a phone, the site's 24 from `sm` up. -->
        <div class="px-4 pb-32 sm:px-6">
          <!-- ── Hero ── centred, unlike the partners page. -->
          <section class="mx-auto max-w-[600px] pt-16 text-center">
            <h1
              class="font-serif text-[32px] font-medium leading-[1.3] tracking-[0.01em] text-ink-gray-8"
            >
              Get started with using Frappe apps
            </h1>
            <p class="mt-3 text-[15px] leading-[1.57] text-ink-gray-6">
              Open source business apps, set up by Frappe or by a certified partner.
            </p>
          </section>

          <!-- ── The two ways in ── -->
          <section class="mx-auto max-w-[800px] pt-28">
            <!-- ⚠️ WHAT YOU GET, NOT WHAT IT IS CALLED. The cards below name the
                 two services; a heading that named them too said everything
                 twice. One line, capped at the page's 600px measure and centred
                 over the cards it introduces. -->
            <h2
              class="mx-auto max-w-[600px] text-center text-[20px] font-semibold leading-[1.35] text-ink-gray-8"
            >
              Go live your way
            </h2>

            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="flex flex-col rounded-6 border border-outline-gray-2 p-6">
                <h3 class="text-[17px] font-semibold text-ink-gray-8">Starter Packs</h3>
                <p class="mt-1 text-[14px] text-ink-gray-6">Best for small businesses</p>
                <p class="mt-5 flex items-baseline gap-1.5">
                  <span class="text-[28px] font-semibold leading-none text-ink-gray-8">
                    {{ fromPrice }}
                  </span>
                  <span class="text-[14px] text-ink-gray-5">onwards</span>
                </p>
                <ul class="mt-6 flex-1 space-y-2.5">
                  <li
                    v-for="p in PACK_POINTS"
                    :key="p.text"
                    class="flex items-center gap-2.5 text-[14px] text-ink-gray-7"
                  >
                    <LucideTriangleAlert
                      v-if="p.warn"
                      class="size-4 shrink-0 text-ink-gray-5"
                      aria-hidden="true"
                    />
                    <LucideCheck v-else class="size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
                    {{ p.text }}
                    <Tooltip v-if="p.tip" :text="p.tip">
                      <button type="button" class="text-ink-gray-5" :aria-label="p.tip">
                        <LucideInfo class="size-3.5" />
                      </button>
                    </Tooltip>
                  </li>
                </ul>
                <div class="mt-6">
                  <Button variant="subtle" size="md" label="View packs" @click="viewPacks">
                    <template #suffix><IconArrowRight class="size-4" /></template>
                  </Button>
                </div>
              </div>

              <div class="flex flex-col rounded-6 border border-outline-gray-2 p-6">
                <h3 class="text-[17px] font-semibold text-ink-gray-8">Custom implementation</h3>
                <p class="mt-1 text-[14px] text-ink-gray-6">
                  For businesses with more complex needs
                </p>
                <ul class="mt-6 flex-1 space-y-2.5">
                  <li
                    v-for="p in CUSTOM_POINTS"
                    :key="p"
                    class="flex items-center gap-2.5 text-[14px] text-ink-gray-7"
                  >
                    <LucideCheck class="size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
                    {{ p }}
                  </li>
                </ul>
                <div class="mt-6 flex flex-wrap items-center gap-2">
                  <Button variant="subtle" size="md" label="Contact partners" @click="contactPartners">
                    <template #suffix><IconArrowRight class="size-4" /></template>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Needs ── -->
          <section class="mx-auto max-w-[600px] pt-32">
            <h2 class="text-[20px] font-semibold leading-[1.35] text-ink-gray-8">
              We understand that people have different needs
            </h2>
            <ul class="mt-8 grid gap-6 sm:grid-cols-3">
              <li v-for="n in NEEDS" :key="n.icon" class="text-[15px] leading-[1.57] text-ink-gray-7">
                <LucideZap v-if="n.icon === 'zap'" class="size-5 text-ink-gray-5" aria-hidden="true" />
                <LucidePuzzle
                  v-else-if="n.icon === 'puzzle'"
                  class="size-5 text-ink-gray-5"
                  aria-hidden="true"
                />
                <LucideWrench v-else class="size-5 text-ink-gray-5" aria-hidden="true" />
                <p class="mt-3">{{ n.text }}</p>
              </li>
            </ul>
          </section>

          <!-- ── Enter, Frappe Connect ── -->
          <section class="mx-auto max-w-[600px] pt-32">
            <h2
              class="flex items-center gap-3 text-[20px] font-semibold leading-[1.35] text-ink-gray-8"
            >
              Enter, Frappe Connect
              <ConnectMark size="lg" />
            </h2>
            <p class="mt-3 text-[15px] leading-[1.57] text-ink-gray-6">
              Frappe Connect is one place to buy a Starter Pack or find the right partner for your
              project.
            </p>
            <p class="mt-3 text-[15px] leading-[1.57] text-ink-gray-6">
              Once work starts, you follow it there too, from the first call to go-live.
            </p>
          </section>

          <!-- ── Features ── -->
          <section
            v-for="f in FEATURES"
            :key="f.eyebrow"
            class="mx-auto max-w-[600px] pt-32"
          >
            <p class="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-gray-5">
              {{ f.eyebrow }}
            </p>
            <h2 class="mt-2 text-[20px] font-semibold leading-[1.35] text-ink-gray-8">
              {{ f.title }}
            </h2>
            <p class="mt-3 text-[15px] leading-[1.57] text-ink-gray-6">{{ f.body }}</p>
            <!-- The contact quiz: a few questions, then the partners that match. -->
            <button
              v-if="f.quiz"
              type="button"
              class="mt-4 flex items-center gap-1.5 text-[15px] font-medium text-ink-gray-8 hover:underline"
              @click="router.push({ name: 'contact-partners' })"
            >
              Take the quiz
              <LucideArrowRight class="size-4 text-ink-gray-5" />
            </button>
            <!-- ⚠️ REAL SCREENS FROM THIS PROTOTYPE, captured at 1440x864 and 2x.
                 Re-capture them when the screens change, or they will show a
                 Connect that no longer exists. The frame is the screenshot's
                 edge: a white app on a white page has no other. -->
            <img
              :src="f.shot"
              :alt="f.alt"
              width="1440"
              height="864"
              loading="lazy"
              class="mt-8 w-full rounded-4 border border-outline-gray-2"
            />
          </section>

          <!-- ── Testimonial ── -->
          <section class="mx-auto max-w-[600px] pt-32">
            <figure aria-live="polite">
              <blockquote class="font-serif text-[22px] leading-[1.4] text-ink-gray-8">
                “{{ testimonial.quote }}”
              </blockquote>
              <figcaption class="mt-6 flex items-center gap-3">
                <Avatar :label="testimonial.name" size="lg" />
                <div class="text-[14px]">
                  <p class="font-medium text-ink-gray-8">{{ testimonial.name }}</p>
                  <p class="text-ink-gray-5">{{ testimonial.company }}</p>
                </div>
              </figcaption>
            </figure>
            <div class="mt-6 flex gap-2">
              <Button
                variant="subtle"
                :icon="IconChevronLeft"
                aria-label="Previous testimonial"
                @click="step(-1)"
              />
              <Button
                variant="subtle"
                :icon="IconChevronRight"
                aria-label="Next testimonial"
                @click="step(1)"
              />
            </div>
          </section>

          <!-- ── Success stories ── -->
          <section class="mx-auto max-w-[800px] pt-32">
            <h2 class="text-[20px] font-semibold leading-[1.35] text-ink-gray-8">
              Success stories
            </h2>
            <ul class="mt-8 grid gap-6 sm:grid-cols-3">
              <li v-for="story in STORIES" :key="story.id">
                <div
                  class="aspect-[4/3] w-full rounded-4"
                  :style="{
                    backgroundImage: `linear-gradient(135deg, ${story.art[0]}, ${story.art[1]})`,
                  }"
                  role="img"
                  :aria-label="`Placeholder artwork for: ${story.title}`"
                />
                <p
                  class="mt-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-gray-5"
                >
                  {{ story.tag }}
                </p>
                <h3 class="mt-1 text-[15px] font-medium leading-[1.4] text-ink-gray-7">
                  {{ story.title }}
                </h3>
              </li>
            </ul>
          </section>

          <!-- ── Self implement ── -->
          <section class="mx-auto max-w-[600px] pt-32">
            <h2 class="text-[20px] font-semibold leading-[1.35] text-ink-gray-8">
              Self implement
            </h2>
            <p class="mt-3 text-[15px] leading-[1.57] text-ink-gray-6">
              Deploy on your own server using our installation scripts. Great for companies with a
              tech team. AGPL-3.0 licensed.
            </p>
            <div class="mt-5">
              <Button
                variant="subtle"
                size="sm"
                label="Resources"
                :icon-left="IconBook"
                link="https://docs.frappe.io"
              />
            </div>
          </section>

          <!-- ── FAQ ──
               frappe-ui has no Accordion, so each row is a plain disclosure:
               a button with `aria-expanded` over its answer. -->
          <section class="mx-auto max-w-[600px] pt-32">
            <h2 class="text-[20px] font-semibold leading-[1.35] text-ink-gray-8">
              Frequently asked questions
            </h2>
            <ul class="mt-6">
              <li v-for="(f, i) in FAQS" :key="f.q" class="border-b border-outline-gray-1">
                <h3>
                  <button
                    :id="`faq-q-${i}`"
                    type="button"
                    class="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-medium text-ink-gray-8"
                    :aria-expanded="openFaq === i"
                    :aria-controls="`faq-a-${i}`"
                    @click="toggleFaq(i)"
                  >
                    {{ f.q }}
                    <LucideMinus
                      v-if="openFaq === i"
                      class="size-4 shrink-0 text-ink-gray-5"
                      aria-hidden="true"
                    />
                    <LucidePlus v-else class="size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
                  </button>
                </h3>
                <p
                  v-show="openFaq === i"
                  :id="`faq-a-${i}`"
                  role="region"
                  :aria-labelledby="`faq-q-${i}`"
                  class="-mt-1 pb-4 pr-8 text-[15px] leading-[1.57] text-ink-gray-6"
                >
                  {{ f.a }}
                </p>
              </li>
            </ul>
          </section>
        </div>
      </ScrollArea>
    </div>
  </div>
</template>
