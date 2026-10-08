<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, FormControl, toast } from 'frappe-ui'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from 'reka-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PackPickList from '../components/PackPickList.vue'
import PackScopeDialog from '../components/PackScopeDialog.vue'
import MediaLightbox from '../components/MediaLightbox.vue'
import { mediaFor } from '../data/media'
import frappeMark from '../assets/frappe.svg'
import erpnextMark from '../assets/apps/erpnext.png'
import LucideCreditCard from '~icons/lucide/credit-card'
import LucideCalendarCheck from '~icons/lucide/calendar-check'
import LucideTimer from '~icons/lucide/timer'
import IconCloud from '~icons/lucide/cloud'
import IconUsers from '~icons/lucide/users'
import IconMail from '~icons/lucide/mail'
import IconDashboard from '~icons/lucide/layout-dashboard'
import IconSettings from '~icons/lucide/settings-2'
import IconImport from '~icons/lucide/file-up'
import IconPrinter from '~icons/lucide/printer'
import IconTraining from '~icons/lucide/graduation-cap'
import IconWorkflow from '~icons/lucide/workflow'
import IconBell from '~icons/lucide/bell-ring'
import IconSupport from '~icons/lucide/life-buoy'
import { useConnectStore } from '../stores/connect'
import { useBasketReturn } from '../utils/auth'
import {
  STARTER_PACKS,
  checkoutFor,
  pricingFor,
  marketFor,
  DEFAULT_REGION,
} from '../data/packs'

// SCREEN — the Starter Pack catalogue.
//
// ── The idea ────────────────────────────────────────────────────────────────
// The packs are named by the modules in them, so the list is a menu rather than
// a ladder: a business that makes what it sells buys Manufacturing, which
// includes Accounts/Sales/Purchase/Stock, and one that only needs to pay people
// buys HR and Payroll on its own. Manufacturing is the one pack that contains
// another; its card says so, and the basket never holds both.
//
// That's what each row's `tagline` is for now — who the pack is for, since the
// heading already says what is in it.
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

// The quiz asks for a region, so use it when it's been answered — pack prices
// are regional. Falls back to India, the only region whose pricing is real
// (see `data/packs.js`).
// ⚠️ The COUNTRY is read first, and it has to be. The geo dimension lives in
// two fields — `filters.countries` for the granular half, `answers.region` for
// the coarse one — and sign-up writes only the country. Reading regions alone
// meant anyone who arrived through sign-up fell through to the default and a
// German business was quoted in rupees under "for your region".
const region = computed(
  () => marketFor(store.filters.countries[0]) ?? store.answers.region[0] ?? DEFAULT_REGION,
)
const pricing = computed(() => pricingFor(region.value))

// What the packs in the basket come to. Empty, the total reads as zero in the
// region's currency, taken off a real bill so the symbol cannot disagree.
const bill = computed(() =>
  checkoutFor(STARTER_PACKS.filter((p) => store.packs.includes(p.value)), region.value),
)
const total = computed(() =>
  store.packs.length
    ? bill.value.subtotal
    : checkoutFor(STARTER_PACKS.slice(0, 1), region.value).subtotal.replace(/[\d,.]+/, '0'),
)

const heroPoints = ['Fixed price', '3x faster', 'Frappe oversight']

// "True of every pack", as two grids. Rewritten for reading from
// `INCLUDED_IN_ALL` and `PACK_ADD_ONS` in `data/packs.js`, which keep the scope
// document's wording — ⚠️ a line added or dropped there has to be added or
// dropped here too.
const coverage = [
  {
    key: 'included',
    title: 'What every pack includes',
    items: [
      { icon: IconCloud, title: 'Frappe Cloud', body: 'ERPNext hosted on Frappe Cloud. Requires the $25 plan.' },
      { icon: IconUsers, title: 'User roles', body: 'Standard roles set up for the people on your team.' },
      { icon: IconMail, title: 'Outgoing email', body: 'One SMTP account configured for system email.' },
      { icon: IconDashboard, title: 'Dashboards', body: 'Standard dashboards for each module.' },
      { icon: IconSettings, title: 'Configuration', body: 'Core settings and one document numbering session.' },
      { icon: IconImport, title: 'Your data', body: 'One import session, with opening balances entered.' },
    ],
  },
  {
    key: 'add-ons',
    title: 'Available as add-ons',
    items: [
      { icon: IconPrinter, title: 'Print formats', body: 'Custom layouts for invoices and quotations.' },
      { icon: IconTraining, title: 'UAT training', body: 'Guided user acceptance testing with your team.' },
      { icon: IconWorkflow, title: 'Workflows', body: 'Custom approval and status flows.' },
      { icon: IconBell, title: 'Notification automation', body: 'Rule-based alerts beyond the defaults.' },
      { icon: IconSupport, title: 'Post go-live support', body: 'Covered by an annual maintenance contract.' },
    ],
  },
]

const steps = [
  {
    icon: LucideCreditCard,
    title: 'Pay in full to Frappe upfront',
    body: 'One fixed price, paid before work begins. Nothing in scope costs extra.',
  },
  {
    icon: LucideCalendarCheck,
    title: 'Schedule your kickoff call',
    body: 'Meet your implementation team to confirm the scope and a start date.',
  },
  {
    icon: LucideTimer,
    title: 'Commit to the Sprint',
    body: 'Done within five sessions, with your data and project champion ready.',
  },
]


// "What's included", in a dialog over the list — as on the recommendation
// screen, so reading a scope does not cost the basket its place.
const scopeOf = ref(null)

// The FAQ, before the contact form. Every answer starts closed.
const FAQS = [
  {
    q: 'When do I need to make the payment for the Starter Pack?',
    a: 'Full advance payment is required before the engagement begins.',
  },
  {
    q: 'What happens if I use up all the hours included in the Starter Pack?',
    a: 'The pack covers only the number of hours specified. If additional hours are needed, you must purchase a new pack.',
  },
  {
    q: 'Who will implement my project?',
    a: 'Your implementation will be carried out by Frappe Partners who are trained and monitored by the Frappe Team.',
  },
  {
    q: 'Is this only available for India?',
    a: 'Yes, Starter Pack is only available for customers from India region. It will be available for other regions later.',
  },
  {
    q: 'Can I get a refund after the work has started?',
    a: 'No, refunds are not provided once work has commenced.',
  },
  {
    q: 'How long do I have to use the hours in my Starter Pack?',
    a: "All hours are valid up to the specified timeline from the kick-off date. This is done to ensure the allocated capacity for the project does not go unutilised due to delays from customer's end.",
  },
  {
    q: 'How long is Go-live support available?',
    a: 'Additional AMC is required for post go-live support.',
  },
  {
    q: 'Can Frappe change the pricing or terms of the Starter Pack?',
    a: 'Yes, Frappe reserves the right to change pricing or terms at any time, with due notice.',
  },
  {
    q: 'Is on-site implementation available?',
    a: 'No, implementations are conducted remotely only.',
  },
  {
    q: "My needs don't fit into the Starter Pack?",
    a: 'If you are a business with more complex needs requiring 3rd party integrations, custom app development, or have over 50+ active users, reach out to our extensive partner ecosystem (frappe.io/partners/regions) for personalised demo, personalised quotation and implementation plans.',
  },
]

// "Still unsure?" — a question to Frappe, sent from the page.
const question = reactive({ name: '', email: '', phone: '', body: '' })
const canSendQuestion = computed(() =>
  Boolean(question.name.trim() && question.email.trim() && question.phone.trim() && question.body.trim()),
)
// The button is never disabled; a send with a field empty says which ones.
const sendQuestion = () => {
  if (!canSendQuestion.value) {
    toast.error('Add your name, email, phone number and what you’d like to know')
    return
  }
  toast.success('Message sent', { description: 'Frappe will get back to you soon.' })
  Object.assign(question, { name: '', email: '', phone: '', body: '' })
}
const scopeOpen = ref(false)

// The hero's video plays in `MediaLightbox`, the same full-screen player a
// partner profile's clip opens in. The clip is the shared placeholder reel,
// relabelled: its own alt names a partner's intro video.
const heroVideo = computed(() => {
  const reel = mediaFor().find((m) => m.kind === 'video')
  return reel ? [{ ...reel, id: 'packs-video', alt: 'Starter Packs video' }] : []
})
const videoOpen = ref(false)
const showScope = (pack) => {
  scopeOf.value = pack
  scopeOpen.value = true
}

// ── Picking more than one ───────────────────────────────────────────────────
// ⚠️ THE ROWS ARE MULTI-SELECT, and the catalogue was the last screen where
// they were not. The packs are slices of the module catalogue, so a business
// with staff needs two of them. A list of
// four one-at-a-time links made the reader buy the same way three times, and
// the recommendation screen four clicks away has had checkboxes and a total for
// weeks. Two screens selling the same four products disagreed about whether you
// could buy two.
//
// ⚠️ ONE BASKET, SHARED. `store.packs` is the same list the recommendation
// ticks and the checkout charges, so a pack ticked here is in the basket
// everywhere — and `seedRecommendedPacks` only fills an EMPTY basket, so
// visiting the recommendation afterwards will not overwrite what was chosen
// here.
//
// ⚠️ THE ROW IS NO LONGER ONE LINK. It used to be, with the anchor stretched
// over the whole row (`after:inset-0`) — which cannot survive a checkbox inside
// it: the stretched layer swallows every click that is not the name. So the
// name keeps the link and the row keeps the checkbox, and the two jobs the row
// now has — read this pack, buy this pack — have a target each.
const router = useRouter()
useBasketReturn()


// Continue goes to the cart for everyone; the cart is where a visitor signs
// up and a customer pays.
const checkout = () => {
  router.push({ name: 'cart' })
}
</script>

<template>
  <ConnectShell root-label="Starter Packs" root-to="/connect/packs">
    <div class="mx-auto w-full max-w-[800px] pb-36 pt-8">
      <!-- ── Hero ─────────────────────────────────────────────────────────
           Text left, video right, vertically centred on each other. Stacks
           below `md`. The price rail that used to sit beside the column is
           gone, so the whole page shares one centred measure. -->
      <header class="grid items-center gap-8 pt-8 md:grid-cols-[320px_1fr]">
        <!-- Bottom padding lifts the text above the video's centre line. -->
        <div class="md:pb-12">
          <img :src="erpnextMark" alt="ERPNext" class="size-8" />
          <h1 class="mt-4 text-5xl font-semibold leading-snug tracking-tight text-ink-gray-9">
            Implemented in hours,<br />
            not months
          </h1>
          <p class="mt-2 text-balance text-p-base text-ink-gray-6">
            Five 1-hour guided sessions to set up ERPNext and run your core
            business processes.
          </p>
          <ul class="mt-5 flex gap-x-3 whitespace-nowrap text-sm text-ink-gray-5">
            <li v-for="point in heroPoints" :key="point" class="flex items-center gap-1.5">
              <LucideCheck class="size-4 shrink-0 text-ink-green-7" />
              {{ point }}
            </li>
          </ul>
        </div>

        <!-- The video: a placeholder frame that opens the clip full-screen, as
             a partner profile's does. The whole frame is the button, so
             hovering anywhere on it lifts the play mark. -->
        <button
          type="button"
          aria-label="Play video"
          :disabled="!heroVideo.length"
          @click="videoOpen = true"
          class="group flex aspect-[16/15] w-full items-center justify-center rounded-7 bg-surface-gray-3 transition-colors hover:bg-surface-gray-4"
        >
          <span
            class="grid size-14 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all group-hover:scale-105 group-hover:bg-black/60"
            aria-hidden="true"
          >
            <LucidePlay class="size-6 translate-x-[2px] fill-current" />
          </span>
        </button>
      </header>

      <!-- ── The packs ────────────────────────────────────────────────────
           The cards, then the total and the way on to the cart. -->
      <section class="mt-36" aria-labelledby="packs-list">
        <h2 id="packs-list" class="text-2xl font-semibold tracking-tight text-ink-gray-9">
          Start small. Upgrade anytime.
        </h2>
        <!-- The same component as the recommendation screen and a draft —
             see `PackPickList`. -->
        <PackPickList
          class="mt-6"
          :packs="store.packs"
          :region="region"
          layout="grid"
          @toggle="store.togglePack"
          @scope="showScope"
        />

        <!-- The total is the cards' prices summed, before tax, so it can be
             checked against the grid above it. -->
        <div class="mt-6 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-ink-gray-6">Total</p>
            <p
              class="mt-1 text-2xl font-semibold tabular-nums text-ink-gray-9"
            >
              {{ total }}
            </p>
          </div>
          <Button
            variant="solid"
            size="md"
            label="Continue"
            @click="checkout"
          >
            <template #suffix><LucideArrowRight class="size-4" /></template>
          </Button>
        </div>
      </section>

      <!-- ── How it works ─────────────────────────────────────────────────
           Drawn here rather than with `PackSteps`: the recommendation screen
           keeps the compact numbered list, this page gets three columns. -->
      <section class="mt-44" aria-labelledby="packs-steps">
        <h2 id="packs-steps" class="text-2xl font-semibold tracking-tight text-ink-gray-9">
          Go live with ERPNext <em>now</em>
        </h2>
        <ol class="mt-8 grid gap-8 md:grid-cols-3">
          <li v-for="step in steps" :key="step.title">
            <component :is="step.icon" class="size-5 text-ink-gray-6" aria-hidden="true" />
            <h3 class="mt-4 text-base font-medium text-ink-gray-9">{{ step.title }}</h3>
            <p class="mt-1.5 text-pretty text-p-base text-ink-gray-6">{{ step.body }}</p>
          </li>
        </ol>
      </section>

      <!-- ── Frappe's word on it ──────────────────────────────────────────
           Social proof from Frappe rather than a customer: the packs are
           delivered by partners, and Frappe's oversight is the selling point.
           The quote and the person are placeholders. -->
      <figure
        class="mt-48 flex flex-col items-center border-y border-outline-gray-1 py-16 text-center"
      >
        <div class="flex items-center gap-1.5">
          <img :src="frappeMark" alt="" class="size-4" />
          <span class="text-base font-semibold text-ink-gray-8">Frappe</span>
        </div>
        <blockquote class="mt-8 max-w-[640px] text-balance text-3xl font-medium leading-snug tracking-tight text-ink-gray-7">
          “We’ve implemented ERPNext for thousands of companies.
          <br class="hidden md:block" />
          The ones that succeed start simple. Starter Packs are that start.”
        </blockquote>
        <figcaption class="mt-6">
          <p class="text-base font-medium text-ink-gray-8">Meera Iyer</p>
          <p class="mt-1 text-base text-ink-gray-5">Head of Implementation, Frappe</p>
        </figcaption>
      </figure>

      <!-- ── Below the list: the recommendation screen's sections ─────
           ⚠️ THE SAME COMPONENTS, IN THE SAME ORDER, as `RecommendationView`
           under its list — how it works, what every pack covers, when custom
           work is the better fit, the terms, and a way to talk to someone.
           Both pages sell the same packs; drawing them twice was how the
           exclusions came to disagree. -->

      <!-- ── What every pack includes, then what it can add ──────────────
           Two sections, not a two-sided card: a buyer reads what they get
           before what costs extra. Same shape as each other — an icon, a
           title and one line — so neither reads as fine print. -->
      <section
        v-for="group in coverage"
        :key="group.key"
        class="mt-48"
        :aria-labelledby="`packs-${group.key}`"
      >
        <h2
          :id="`packs-${group.key}`"
          class="text-2xl font-semibold tracking-tight text-ink-gray-9"
        >
          {{ group.title }}
        </h2>
        <ul class="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
          <li v-for="item in group.items" :key="item.title">
            <component :is="item.icon" class="size-5 text-ink-gray-6" aria-hidden="true" />
            <p class="mt-3 text-p-base text-ink-gray-6">
              <span class="font-medium text-ink-gray-8">{{ item.title }}.</span>
              {{ item.body }}
            </p>
          </li>
        </ul>
      </section>
      <!-- ── FAQ ──────────────────────────────────────────────────────────
           Rules between rows only. 8px from question to answer, as frappe-ui
           puts between a title and its description. -->
      <section class="mx-auto mt-48 max-w-[600px]" aria-labelledby="packs-faq">
        <h2 id="packs-faq" class="text-2xl font-semibold tracking-tight text-ink-gray-9">
          Frequently asked questions
        </h2>
        <AccordionRoot type="multiple" class="mt-6 divide-y divide-outline-gray-1">
          <AccordionItem v-for="f in FAQS" :key="f.q" :value="f.q" class="group">
            <AccordionHeader as="h3">
              <AccordionTrigger
                class="flex w-full items-start justify-between gap-4 py-6 text-left text-base font-medium leading-6 text-ink-gray-8 group-data-[state=open]:pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
              >
                {{ f.q }}
                <LucideMinus
                  class="mt-1 hidden size-4 shrink-0 text-ink-gray-5 group-data-[state=open]:block"
                  aria-hidden="true"
                />
                <LucidePlus
                  class="mt-1 size-4 shrink-0 text-ink-gray-5 group-data-[state=open]:hidden"
                  aria-hidden="true"
                />
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent class="fc-accordion-content overflow-hidden">
              <p class="pb-6 pr-8 text-p-base text-ink-gray-6">{{ f.a }}</p>
            </AccordionContent>
          </AccordionItem>
        </AccordionRoot>
      </section>

      <!-- ── Still unsure? ────────────────────────────────────────────────
           A question to Frappe, on the page: centred heading, the form and a
           solid send. Same three fields as
           /contact.
           Nothing is sent in this prototype; the toast is what a sent message
           would say. -->
      <section class="mt-48 flex flex-col items-center text-center" aria-labelledby="packs-unsure">
        <h2 id="packs-unsure" class="text-3xl font-semibold tracking-tight text-ink-gray-9">
          Still unsure? Let’s talk.
        </h2>
        <form
          class="mt-6 flex w-full max-w-[480px] flex-col gap-4 text-left"
          novalidate
          @submit.prevent="sendQuestion"
        >
          <FormControl
            v-model="question.name"
            size="sm"
            label="Name"
            placeholder="Your full name"
            autocomplete="name"
          />
          <FormControl
            v-model="question.email"
            type="email"
            size="sm"
            label="Email"
            placeholder="name@company.com"
            autocomplete="email"
          />
          <FormControl
            v-model="question.phone"
            type="tel"
            size="sm"
            label="Phone number"
            placeholder="+91 98765 43210"
            autocomplete="tel"
          />
          <FormControl
            v-model="question.body"
            type="textarea"
            size="sm"
            label="What would you like to know?"
            placeholder="Scope, pricing, timelines, or which pack fits"
            :rows="4"
          />
          <div class="flex justify-center">
            <Button
              variant="solid"
              size="md"
              type="submit"
              label="Send message"
            />
          </div>
        </form>
      </section>
    </div>
    <PackScopeDialog v-model:open="scopeOpen" :pack="scopeOf" />
    <MediaLightbox :open="videoOpen" :items="heroVideo" @close="videoOpen = false" />
  </ConnectShell>
</template>
