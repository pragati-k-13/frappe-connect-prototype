<script setup>
// SCREEN — frappe.io/contact.
//
// ⚠️ NOT PART OF FRAPPE CONNECT. It is a stand-in for a page that already
// exists on the marketing site. See `FrappeSitePage` for the type scale, which
// is measured off the real site rather than chosen, and `SiteRail` for the
// chrome the two pages share.
//
// ⚠️ IT IS THE REAL PAGE, PLUS ONE ROW. What stood here first was a triage of
// my own invention — a radio group of four reasons and a branching form — and
// then four "how can we help" cards that a text summary of the page claimed
// were on it. Neither is there. The real page is short: an eyebrow, a serif
// headline, one line of invitation, e-mail and phone, the office address, and a
// "Get in touch" button. That is what is below.
//
// ⚠️ THE ONE ADDITION is the implementation row, which is the entire reason
// this page is mocked at all: a large share of implementation leads arrive here
// rather than on /partners, and today the page has nothing for them but an
// e-mail address and a wait. It is one row above the contact details, because
// somebody who came to write in should still find the address immediately.
//
// ⚠️ EVERY DETAIL BELOW IS FRAPPE'S OWN, read off the live page — one phone
// number, not three, and hello@frappe.io. An earlier draft listed US and UK
// numbers that are not on it.
import { useRouter } from 'vue-router'
import SiteRail from '../components/SiteRail.vue'
import LucideArrowRight from '~icons/lucide/arrow-right'
import LucideChevronRight from '~icons/lucide/chevron-right'

const router = useRouter()

const REACH = [
  { label: 'E-mail', value: 'hello@frappe.io' },
  { label: 'India', value: '+91 22 4897 0555' },
]

const OFFICE = [
  'Frappe Technologies Pvt. Ltd.,',
  'C/205, Neelkanth Business Park, Vidyavihar West,',
  'Mumbai, Maharashtra 400086',
]
</script>

<template>
  <!-- Same shell as the partners page: the rail, then a column with the bar
       above the content. The two mocks are one website. -->
  <div class="flex h-screen bg-white text-ink-gray-8">
    <SiteRail />

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header
        class="flex min-h-12 shrink-0 items-center justify-between border-b border-outline-gray-1 bg-white px-4 sm:px-5"
      >
        <nav class="flex items-center gap-2 text-[14px]" aria-label="Breadcrumb">
          <RouterLink to="/" class="text-ink-gray-7 hover:underline">Frappe</RouterLink>
          <LucideChevronRight class="size-4 text-ink-gray-4" />
          <span class="text-ink-gray-6">Contact</span>
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

      <div class="min-h-0 flex-1 overflow-y-auto">
        <main class="mx-auto w-full max-w-[600px] px-6 py-16">
          <p class="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-gray-5">
            Contact
          </p>
          <!-- The one serif on the page, same as the partners page — Newsreader
               at 32, weight 500. Don't tidy it into the product scale. -->
          <h1
            class="mt-2 font-serif text-[32px] font-medium leading-[1.3] tracking-[0.01em] text-ink-gray-8"
          >
            Get in touch
          </h1>
          <p class="mt-3 text-[15px] leading-[23.55px] text-ink-gray-6">
            Want to write to us or have a question or comment? Write in, we would love to hear from
            you.
          </p>

          <!-- ── The one modification ──────────────────────────────────────
               ⚠️ A ROW, NOT A CARD OR A BANNER. It is an addition to somebody
               else's page, and the loudest thing on a contact page should not
               be a funnel: a business that came here to ask a question finds
               the address two inches below, unchanged. What this row buys is
               the reader who came to ask "who can implement this for us" —
               which the page cannot answer today except by promising an
               e-mail back. -->
          <!-- ⚠️ THE BUTTON SAID "Find a partner" AND OPENED THE QUESTIONS.
               Two things wrong with that, and the second is the one that
               matters. It named a destination it did not go to — the same fault
               the partners mock's hero button had. And "Find a partner" is now
               a specific thing elsewhere in this prototype: the control on
               /partners that opens the directory. A visitor who presses the
               same words on two pages and lands in two different places has
               learnt nothing from the first press.

               What this row actually offers is the opposite of a directory —
               you do not know which firm you want, which is why you were about
               to write in. So it says so, and it matches the second door on the
               partners page word for word: same offer, same words, same
               destination. -->
          <div class="mt-10 rounded-4 border border-outline-gray-1 p-4">
            <p class="text-[15px] font-medium text-ink-gray-8">Looking for implementation?</p>
            <p class="mt-1 text-[15px] leading-[1.57] text-ink-gray-6">
              Answer three questions about your business and we will say which service fits, and
              what it costs — no reply to wait for.
            </p>
            <button
              type="button"
              class="mt-3 flex items-center gap-1.5 text-[15px] font-medium text-ink-gray-8 hover:underline"
              @click="router.push('/connect?new=1')"
            >
              Get a recommendation
              <LucideArrowRight class="size-4 text-ink-gray-5" />
            </button>
          </div>

          <!-- ── The page as it stands ─────────────────────────────────── -->
          <dl class="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <div v-for="row in REACH" :key="row.label">
              <dt class="text-[15px] font-medium text-ink-gray-7">{{ row.label }}</dt>
              <dd class="mt-1 text-[15px] text-ink-gray-6">{{ row.value }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-[15px] font-medium text-ink-gray-7">Office</dt>
              <!-- The address breaks where the real page breaks it, rather than
                   wrapping to the measure. An address is read as lines. -->
              <dd class="mt-1 text-[15px] leading-[1.57] text-ink-gray-6">
                <span v-for="line in OFFICE" :key="line" class="block">{{ line }}</span>
              </dd>
            </div>
          </dl>

          <!-- ⚠️ INERT, and deliberately. The real button opens Frappe's own
               contact form, which this prototype does not stand in for — and
               inventing one here would put a second, competing way to reach the
               company on a page whose e-mail address is three lines above. -->
          <button
            type="button"
            disabled
            class="mt-8 flex items-center gap-1.5 rounded-4 bg-surface-gray-2 px-3 py-1.5 text-[15px] text-ink-gray-5"
          >
            Get in touch
            <LucideArrowRight class="size-4" />
          </button>
        </main>
      </div>
    </div>
  </div>
</template>
