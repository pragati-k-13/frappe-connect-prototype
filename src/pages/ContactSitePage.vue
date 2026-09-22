<script setup>
// SCREEN — frappe.io/contact.
//
// ⚠️ NOT PART OF FRAPPE CONNECT. It is a stand-in for a page that already
// exists on the marketing site, styled as *website* rather than *app* — serif
// headline, no product chrome — exactly like the partners page it sits beside.
// See `FrappeSitePage` for the type scale, which is measured off the real site
// rather than chosen.
//
// ⚠️ IT IS THE REAL PAGE NOW, MINUS ONE CARD'S DESTINATION. What stood here was
// a triage of my own invention: a radio group of four reasons, a branching form
// and a paragraph arguing for the arrangement. The argument was sound and the
// page was not the brief — this mock exists to show where Connect is entered
// from, and a redesign of Frappe's contact page is a different piece of work
// that nobody asked for. So the structure below is frappe.io/contact's own:
// four cards, then how to reach the company.
//
// ⚠️ THE ONE MODIFICATION. The real "Looking for implementation?" card says to
// reach out to a partner in one of 50+ countries; here it opens Frappe Connect
// instead. That is the entire point of mocking this page — implementation leads
// arrive here as often as on /partners, and this is the card they press.
//
// ⚠️ NO FORM. The real page hands you four routes and the company's own
// address, phone numbers and email; it does not ask a visitor to describe their
// problem in a textarea first. Mine did, and the form was the largest thing on
// the screen.
import { useRouter } from 'vue-router'
import frappeMark from '../assets/frappe.svg'
import LucideArrowRight from '~icons/lucide/arrow-right'

// ⚠️ THROUGH THE ROUTER, NOT A NEW TAB. The fiction is that Connect is a
// different place, and it still reads that way because the two screens look
// nothing alike — but this is a prototype somebody walks through, and a tab
// opening behind the one being reviewed breaks the walk. Same decision, and the
// same note, as `FrappeSitePage`.
const router = useRouter()

// The four cards, in the real page's order and close to its words.
//
// ⚠️ `to` MARKS THE ONE THAT LEAVES FOR CONNECT, and only one does. The other
// three are the page as it stands: a webinar, the partner programme, the
// support portal. They are `href: null` rather than invented destinations,
// because a mock that links three real pages to nowhere teaches a reviewer
// nothing and a mock that invents three URLs teaches them something false.
const CARDS = [
  {
    title: 'Need a quick demo?',
    body: 'Register for a weekly ERPNext webinar demo and live Q&A.',
    to: null,
  },
  {
    // ⚠️ THE MODIFIED ONE. The real card sends you to the partner directory to
    // pick a firm yourself; this one sends you to the three questions that say
    // which of the two services fits, and assigns or matches from there.
    title: 'Looking for implementation?',
    body: 'Answer three questions and get a recommendation, with pricing, straight away.',
    to: '/connect',
  },
  {
    title: 'Want to become a partner?',
    body: 'Know more about our partner program and register now.',
    to: null,
  },
  {
    title: 'Need tech support?',
    body: "If you're hosted on Frappe Cloud, raise a ticket on our support portal.",
    to: null,
  },
]

// Frappe's own, from the live page. Real details for a real company — nothing
// here is invented, and nothing here should be edited to look tidier.
const REACH = [
  { label: 'Email', value: 'hello@frappe.io' },
  { label: 'India', value: '+91 22 4897 0555' },
  { label: 'United States', value: '+1 209 813 4824' },
  { label: 'United Kingdom', value: '+44 29 2254 0018' },
]

const ADDRESS =
  'Frappe Technologies Pvt. Ltd., C/205, Neelkanth Business Park, Vidyavihar West, Mumbai, Maharashtra 400086'
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Site chrome, matching the partners page: a mark, a wordmark, and
         nothing else. This is not the app. -->
    <header class="border-b border-outline-gray-1">
      <div class="mx-auto flex h-14 w-full max-w-[1100px] items-center gap-2 px-6">
        <img :src="frappeMark" alt="" class="size-6" />
        <span class="text-[14px] font-medium text-ink-gray-8">Frappe</span>
        <nav class="ml-auto flex items-center gap-5 text-[14px] text-ink-gray-6">
          <RouterLink to="/" class="hover:text-ink-gray-8">Partners</RouterLink>
          <span class="text-ink-gray-8">Contact</span>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-[800px] px-6 py-16">
      <!-- ⚠️ The real page's own words, and its own shape: an eyebrow, a serif
           headline, a line of invitation. The headline used to read "Talk to
           us", which is better copy and is not this page. -->
      <p class="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-gray-5">Contact</p>
      <h1
        class="mt-2 font-serif text-[32px] font-medium leading-[1.3] tracking-[0.01em] text-ink-gray-8"
      >
        Get in touch
      </h1>
      <p class="mt-3 max-w-[520px] text-[15px] leading-[23.55px] text-ink-gray-6">
        Want to write to us, or have a question or comment? Write in — we would love to hear from
        you.
      </p>

      <!-- ── The four routes ─────────────────────────────────────────────
           Two columns of rows rather than four boxes. The real page draws them
           as cards; this mock does not, for the reason every list on the
           partners page is drawn the same way — a frame around a title and one
           sentence is most of a card's contents already. -->
      <ul class="mt-12 grid gap-px overflow-hidden rounded-4 bg-[var(--outline-gray-1)] sm:grid-cols-2">
        <li v-for="card in CARDS" :key="card.title" class="bg-white p-5">
          <!-- ⚠️ A LINK ONLY WHERE THERE IS SOMEWHERE TO GO. Three of the four
               are real pages this prototype does not mock, so their titles are
               plain text — the reviewer sees the page's real shape without a
               control that would lie about what it does. -->
          <button
            v-if="card.to"
            type="button"
            class="flex items-start gap-1.5 text-left text-[15px] font-medium text-ink-gray-8 hover:underline"
            @click="router.push(card.to)"
          >
            {{ card.title }}
            <LucideArrowRight class="mt-0.5 size-4 shrink-0 text-ink-gray-5" />
          </button>
          <p v-else class="text-[15px] font-medium text-ink-gray-7">{{ card.title }}</p>
          <p class="mt-1.5 text-[15px] leading-[1.57] text-ink-gray-6">{{ card.body }}</p>
        </li>
      </ul>

      <!-- ── How to reach the company ────────────────────────────────── -->
      <section class="mt-16">
        <h2 class="text-[20px] font-semibold leading-[1.3] text-ink-gray-8">Reach us directly</h2>
        <dl class="mt-6 divide-y divide-outline-gray-1">
          <div v-for="row in REACH" :key="row.label" class="flex gap-4 py-3 first:pt-0">
            <dt class="w-[140px] shrink-0 text-[15px] text-ink-gray-5">{{ row.label }}</dt>
            <dd class="min-w-0 flex-1 text-[15px] text-ink-gray-7">{{ row.value }}</dd>
          </div>
          <div class="flex gap-4 py-3">
            <dt class="w-[140px] shrink-0 text-[15px] text-ink-gray-5">Address</dt>
            <dd class="min-w-0 flex-1 text-[15px] leading-[1.57] text-ink-gray-7">{{ ADDRESS }}</dd>
          </div>
        </dl>
      </section>
    </main>
  </div>
</template>
