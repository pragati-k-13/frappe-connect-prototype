<script setup>
import { computed, reactive, ref } from 'vue'
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
import LucideCreditCard from '~icons/lucide/credit-card'
import LucideCalendarCheck from '~icons/lucide/calendar-check'
import LucideTimer from '~icons/lucide/timer'
import IconCloud from '~icons/lucide/cloud'
import IconUsers from '~icons/lucide/users'
import IconMail from '~icons/lucide/mail'
import IconDashboard from '~icons/lucide/layout-dashboard'
import IconSettings from '~icons/lucide/settings-2'
import IconImport from '~icons/lucide/file-up'
import IconBag from '~icons/lucide/shopping-bag'
import { useRouter } from 'vue-router'
import { useConnectStore } from '../stores/connect'
import { useBasketReturn } from '../utils/auth'
import {
  STARTER_PACKS,
  checkoutFor,
  pricingFor,
  marketFor,
  DEFAULT_REGION,
  hostingLineFor,
  packStepsFor,
} from '../data/packs'
import { INDUSTRIES } from '../data/quiz'

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

const heroPoints = ['Fixed price', '3x faster', 'Frappe-vetted']

// "True of every pack", as two grids. Rewritten for reading from
// `INCLUDED_IN_ALL` and `PACK_ADD_ONS` in `data/packs.js`, which keep the scope
// document's wording — ⚠️ a line added or dropped there has to be added or
// dropped here too.
// ⚠️ PARKED: this section is being replaced. Until the new version is ready
// it isn't rendered, and nothing stands in its place. Flip this to bring the
// current version back.
const SHOW_COVERAGE = false

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
]

// The steps' words are `packStepsFor`, shared with the cart; only the icons
// are this page's.
const STEP_ICONS = { pay: LucideCreditCard, company: LucideCalendarCheck, sessions: LucideTimer }
const steps = computed(() =>
  packStepsFor(region.value).map((s) => ({ ...s, icon: STEP_ICONS[s.key] })),
)


// "What's included", in a dialog over the list — as on the recommendation
// screen, so reading a scope does not cost the basket its place.
const scopeOf = ref(null)

// The FAQ, before the contact form. Every answer starts closed.
const FAQS = [
  {
    q: 'What happens if I use up all the hours included in the Starter Pack?',
    a: 'The pack covers only the number of hours specified. If additional hours are needed, you must purchase a new pack.',
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

// "Tell us about your business" — the contact form at the foot of the page.
//
// ⚠️ INDIA ONLY, so there is no country field. This form replaces
// frappe.io/contact for visitors whose IP is in India; everyone else keeps the
// existing page. IP routing misfires (VPNs, travel, teams abroad), so State
// ends with "Outside India" as an honest answer for anyone routed here wrongly.
// The detected country should be stored with each lead server-side.
//
// Designation, team size and current software are frappe.io/contact's own
// options, as is. Industry is the quiz's taxonomy (`INDUSTRIES`), one field
// in place of contact's industry and sub-industry: the segments, grouped.
// "App interested" isn't asked — on these pages it follows from the pack.
const DESIGNATIONS = [
  'CEO/Founder/GM',
  'CFO',
  'CTO/CIO',
  'Vice president',
  'Director/Head of Department',
  'IT/System manager',
  'Manager (Sales/Marketing/Customer)',
  'Developer/Analyst',
  'Student/Freelancer/Just looking',
  'Others',
]
const TEAM_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
const CURRENT_SOFTWARE = [
  'Tally',
  'Odoo',
  'Zoho',
  'QuickBooks',
  'Microsoft Dynamics',
  'SAP',
  'Oracle',
  'Spreadsheets (Excel / Google Sheets)',
  'No system / Manual process',
  'Other',
]
// `Combobox`, not `Select`: frappe-ui's `Select` renders no groups.
const INDUSTRY_OPTIONS = INDUSTRIES.map((i) => ({
  group: i.label,
  key: i.value,
  options: i.segments,
}))
const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]
const STATE_OPTIONS = [
  { group: 'States and union territories', hideLabel: true, options: INDIAN_STATES },
  { group: 'Outside India', hideLabel: true, options: ['Outside India'] },
]

const EMPTY_QUESTION = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  designation: '',
  teamSize: '',
  software: '',
  industry: null,
  state: null,
  body: '',
}
const question = reactive({ ...EMPTY_QUESTION })
const canSendQuestion = computed(() =>
  Object.values(question).every((v) => (typeof v === 'string' ? v.trim() : v)),
)
// The button is never disabled; a send with a field empty says which ones.
// "Talk to us" under the steps: down to the form, cursor in its first field.
// ⚠️ NOT `scrollIntoView`: that scrolls every ancestor it can, including the
// shell's `overflow-hidden` content frame, which then sat 60px up and left a
// blank band at the foot of the window. Only the page's own scroller moves.
const contactForm = ref(null)
const toContact = () => {
  const form = contactForm.value
  if (!form) return
  let scroller = form.parentElement
  while (scroller && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) {
    scroller = scroller.parentElement
  }
  if (scroller) {
    const box = scroller.getBoundingClientRect()
    const r = form.getBoundingClientRect()
    scroller.scrollTo({
      top: scroller.scrollTop + r.top - box.top - (box.height - r.height) / 2,
      behavior: 'smooth',
    })
  }
  form.querySelector('input')?.focus({ preventScroll: true })
}
const sendQuestion = () => {
  if (!canSendQuestion.value) {
    toast.error('Fill in every field to send your message')
    return
  }
  toast.success('Message sent', { description: 'Frappe will get back to you soon.' })
  Object.assign(question, EMPTY_QUESTION)
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
useBasketReturn()

// ⚠️ THE CATALOGUE'S WAY TO THE CART IS HERE, beside the total — not the bag
// in the bar, which the pack pages have and this page leaves out. The total
// changes as packs are chosen, right under the cards, so this is where the
// next step is looked for; one way to the cart per page.
const router = useRouter()
const viewCart = () => router.push({ name: 'cart' })
const viewCartLabel = computed(() =>
  store.packs.length ? `View cart (${store.packs.length})` : 'View cart',
)
</script>

<template>
  <!-- The bar's "Log in or create account" stays: someone who already has an
       account needs a way in before they reach the cart. -->
  <ConnectShell root-label="Starter Packs" root-to="/connect/packs">
    <div class="mx-auto w-full max-w-[800px] pb-24 pt-8">
      <!-- ── Hero ─────────────────────────────────────────────────────────
           Text left, video right, vertically centred on each other. Stacks
           below `md`. The price rail that used to sit beside the column is
           gone, so the whole page shares one centred measure. -->
      <header class="grid items-center gap-8 pt-8 md:grid-cols-[320px_1fr]">
        <!-- Bottom padding lifts the text above the video's centre line. -->
        <div class="md:pb-12">
          <h1 class="text-5xl font-semibold leading-snug tracking-tight text-ink-gray-9">
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
           The cards, then the total. The cart is the bag in the bar. -->
      <section class="mt-36" aria-labelledby="packs-list">
        <h2 id="packs-list" class="text-2xl font-semibold tracking-tight text-ink-gray-9">
          Start small and upgrade anytime
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
            <p class="text-2xl font-semibold tabular-nums text-ink-gray-9">{{ total }}</p>
            <p class="mt-1 text-p-sm text-ink-gray-6">{{ hostingLineFor(region) }}</p>
          </div>
          <Button variant="subtle" size="md" :label="viewCartLabel" @click="viewCart">
            <template #prefix><IconBag class="size-4" /></template>
          </Button>
        </div>
      </section>

      <!-- ── Talk to our team ──────────────────────────────────────────────
           For the reader who has seen the prices and isn't sure: right after
           the packs, the invitation to talk before paying. Many buyers in
           India would rather speak to a person before a purchase this size,
           and a conversation turns an unsure visitor into a confident one.
           Centred in a filled band (`surface-gray-1`, no rules), so it reads
           as one invitation, apart from the left-aligned sections around it
           and from the ruled quote further down. The
           button goes down to the form (`toContact`), whose answers are what
           make the call useful. ⚠️ No response time is promised on purpose. -->
      <section
        class="my-56 flex flex-col items-center rounded-7 border border-outline-gray-1/60 bg-surface-gray-1/50 px-6 py-10 text-center"
        aria-labelledby="packs-talk"
      >
        <h2
          id="packs-talk"
          class="text-balance text-3xl font-semibold tracking-tight text-ink-gray-9"
        >
          The right pack is a 15-minute conversation away
        </h2>
        <!-- A set break from `sm`: a slightly longer first line over a slightly
             shorter second, neither lopsided nor two equal lines. Wraps freely
             on a phone. -->
        <p class="mt-3 text-pretty text-p-base text-ink-gray-6">
          Tell us how you work today. Our team will call you
          <br class="hidden sm:block" />
          and tell you which pack fits, or if none does.
        </p>
        <Button class="mt-6" variant="subtle" size="md" label="Talk to our team" @click="toContact" />
      </section>

      <!-- ── How it works ─────────────────────────────────────────────────
           Drawn here rather than with `PackSteps`: the recommendation screen
           keeps the compact numbered list, this page gets three columns. -->
      <section class="mt-44" aria-labelledby="packs-steps">
        <h2 id="packs-steps" class="text-2xl font-semibold tracking-tight text-ink-gray-9">
          Go live with ERPNext <em>now</em>
        </h2>
        <ol class="mt-8 grid gap-8 md:grid-cols-3">
          <li v-for="step in steps" :key="step.key">
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
        v-for="group in SHOW_COVERAGE ? coverage : []"
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

      <!-- ── Tell us about your business ───────────────────────────────────
           A question to Frappe, on the page: centred heading, the form and a
           solid send. frappe.io/contact's questions, India only — see the
           note on `question` in the script.
           Nothing is sent in this prototype; the toast is what a sent message
           would say. -->
      <section class="mt-48 flex flex-col items-center text-center" aria-labelledby="packs-unsure">
        <h2 id="packs-unsure" class="text-3xl font-semibold tracking-tight text-ink-gray-9">
          Still unsure? Let’s talk.
        </h2>
        <!-- Two columns from `sm`: the person, then the business, then the
             message across both. One column on a phone. -->
        <form
          ref="contactForm"
          class="mt-6 w-full max-w-[640px] text-left"
          novalidate
          @submit.prevent="sendQuestion"
        >
          <div class="grid gap-x-3 gap-y-4 sm:grid-cols-2">
            <FormControl
              v-model="question.firstName"
              required
              size="sm"
              label="First name"
              autocomplete="given-name"
            />
            <FormControl
              v-model="question.lastName"
              required
              size="sm"
              label="Last name"
              autocomplete="family-name"
            />
            <FormControl
              v-model="question.email"
              required
              type="email"
              size="sm"
              label="Email"
              placeholder="name@company.com"
              autocomplete="email"
            />
            <!-- India only (see the note on the script), so the code is fixed. -->
            <FormControl
              v-model="question.phone"
              required
              type="tel"
              size="sm"
              label="Phone number"
              placeholder="98765 43210"
              autocomplete="tel-national"
            >
              <template #prefix>
                <span class="text-base text-ink-gray-5">+91</span>
              </template>
            </FormControl>
          </div>

          <div class="mt-6 grid gap-x-3 gap-y-4 sm:grid-cols-2">
            <FormControl
              v-model="question.company"
              required
              size="sm"
              label="Company name"
              autocomplete="organization"
            />
            <FormControl
              v-model="question.designation"
              required
              type="select"
              size="sm"
              label="Designation"
              placeholder="Select"
              :options="DESIGNATIONS"
            />
            <FormControl
              v-model="question.teamSize"
              required
              type="select"
              size="sm"
              label="Number of employees"
              placeholder="Select"
              :options="TEAM_SIZES"
            />
            <FormControl
              v-model="question.software"
              required
              type="select"
              size="sm"
              label="Current software"
              placeholder="Select"
              :options="CURRENT_SOFTWARE"
            />
            <FormControl
              v-model="question.industry"
              required
              type="combobox"
              size="sm"
              label="Industry"
              placeholder="Search"
              :options="INDUSTRY_OPTIONS"
            />
            <FormControl
              v-model="question.state"
              required
              type="combobox"
              size="sm"
              label="State"
              placeholder="Search"
              :options="STATE_OPTIONS"
            />
          </div>

          <FormControl
            v-model="question.body"
            class="mt-6"
            required
            type="textarea"
            size="sm"
            label="Tell us about your business and what isn’t working today"
            placeholder="Scope, pricing, timelines, or which pack fits"
            :rows="4"
          />
          <div class="mt-6 flex justify-center">
            <Button variant="solid" size="md" type="submit" label="Send message" />
          </div>
        </form>
      </section>
    </div>
    <!-- Not opened from here while the cards link to the pack page; kept so
         it can come back. -->
    <PackScopeDialog v-model:open="scopeOpen" :pack="scopeOf" />
    <MediaLightbox :open="videoOpen" :items="heroVideo" @close="videoOpen = false" />
  </ConnectShell>
</template>
