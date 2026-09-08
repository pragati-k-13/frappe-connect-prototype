<script setup>
// SCREEN 1 — frappe.io/partners
//
// The discovery surface, not part of Frappe Connect. Deliberately a light
// stand-in for the real marketing page: enough chrome and copy to establish
// where a business is standing when they decide to look for a partner, styled
// so it reads as "website", not "app" (serif headline, wide measure, no rail
// affordances). Devs shouldn't build this — it already exists.
//
// The one behaviour that matters here: "Find a partner" opens Frappe Connect
// in a NEW TAB, per the design. That's why the CTA takes frappe-ui Button's
// `link` prop (which renders an `<a target="_blank">`) rather than `route`.

import { Button } from 'frappe-ui'

// Where the app is mounted — '/' locally, '/frappe-connect-prototype/' on
// GitHub Pages. Only the CTA below needs it; every other link in the app goes
// through the router, which handles the base itself.
const baseUrl = import.meta.env.BASE_URL

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
    title: 'End-to-end implementation',
    body: 'From scoping and data migration to training your team, partners take the whole project — so you get one accountable owner instead of a handoff chain.',
    icon: 'route',
  },
]
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Site chrome -->
    <header class="flex h-14 items-center justify-between border-b border-gray-200 px-5">
      <nav class="flex items-center gap-2 text-p-base" aria-label="Breadcrumb">
        <span
          class="flex size-6 items-center justify-center rounded-4 bg-gray-900 text-xs font-bold text-white"
        >
          F
        </span>
        <a href="#" class="text-ink-gray-8 hover:underline">Frappe</a>
        <LucideChevronRight class="size-4 text-ink-gray-4" />
        <span class="text-ink-gray-6">Partners</span>
      </nav>
      <button
        type="button"
        class="flex items-center gap-1.5 text-p-base text-ink-gray-7 hover:text-ink-gray-9"
      >
        Log in or create account
        <LucideArrowRight class="size-4" />
      </button>
    </header>

    <div class="mx-auto max-w-[680px] px-6 py-14">
      <p class="text-p-sm font-medium uppercase tracking-wide text-ink-gray-5">Frappe Partners</p>
      <h1 class="mt-3 font-serif text-[32px] leading-[1.2] text-ink-gray-9">
        Meet a global community of committed open source entrepreneurs
      </h1>
      <p class="mt-5 text-lg leading-relaxed text-ink-gray-7">
        Frappe builds innovative products and our global network of partners help businesses
        implement them smoothly. Our partners are trained and certified to ensure our customers get
        the best Frappe experience.
      </p>

      <!-- Photo stand-in. The real page runs a group shot here; a gradient keeps
           the mock free of binary assets without leaving a hole in the layout. -->
      <div
        class="mt-8 flex h-[270px] items-end justify-center rounded-6"
        :style="{ backgroundImage: 'linear-gradient(135deg, #e2e8f0, #cbd5e1 45%, #94a3b8)' }"
        role="img"
        aria-label="Photo of the Frappe partner community"
      >
        <div class="mb-5 flex items-end gap-1.5" aria-hidden="true">
          <span
            v-for="(h, i) in [26, 34, 30, 38, 28, 36, 32, 40, 27, 35, 31, 37]"
            :key="i"
            class="w-3.5 rounded-t-full"
            :style="{ height: `${h}px`, backgroundColor: 'rgba(100, 116, 139, 0.45)' }"
          />
        </div>
      </div>

      <!-- The CTA into Frappe Connect. -->
      <div
        class="mt-8 flex flex-col gap-4 rounded-6 border border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="text-lg text-ink-gray-8">
          Frappe Partners to find the best match for your business.
        </p>
        <!-- frappe-ui's `Button`, not the hand-rolled anchor this used to be.
             The lookalike was `px-4 py-2.5` — roughly 40px tall with 16px
             flanks, a size that isn't on the scale at all and read as
             oversized next to the sentence beside it. `md` is the system's
             32px step.

             `link` rather than `route`, which is what keeps the one behaviour
             that matters on this screen: frappe-ui renders `link` as an
             `<a target="_blank" rel="noreferrer noopener">`, so the CTA still
             opens Connect in a NEW TAB — the fiction is that you're leaving
             frappe.io and arriving somewhere else. `route` would give a
             same-tab RouterLink and lose it. Same prop the estimator's
             "What's in a starter pack?" uses.

             ⚠️ `BASE_URL` prefixed, so it survives being served from a
             subpath. A bare "/connect" points at the domain root, which under
             GitHub Pages is somebody else's page.

             ⚠️ This is the ONE frappe-ui control on a screen that is meant to
             read as a website rather than as the app — see the note at the top
             of this file. It's allowed because it's the seam: the button is
             the thing that takes you into the product, so it's the one place
             the product's own chrome belongs. Don't let the rest of the page
             follow it. -->
        <Button
          variant="solid"
          size="md"
          :link="`${baseUrl}connect`"
          label="Find a partner"
          class="shrink-0"
        >
          <template #suffix><LucideArrowRight class="size-4" /></template>
        </Button>
      </div>

      <h2 class="mt-14 font-serif text-3xl text-ink-gray-9">
        Benefits of working with a Frappe Partner
      </h2>
      <dl class="mt-7 space-y-7">
        <div v-for="b in BENEFITS" :key="b.title" class="flex gap-4">
          <!-- Grey, not the near-black these started as. Three black discs down
               the left of the benefits list were the heaviest marks on a page
               whose actual focal points are the serif headline and the one dark
               CTA — they read as three more buttons. The disc is a bullet: it
               groups the icon and separates the rows, and it doesn't need to
               compete for that.
               ⚠️ Semantic tokens rather than the `bg-gray-*` the rest of this
               page reaches for. Which raw shades exist is not fixed — Tailwind
               emits only what something in the scanned content references, and
               that set moves as the app and frappe-ui's own source change. The
               `surface-*` / `ink-*` tokens are always there. -->
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-gray-3 text-ink-gray-7"
            aria-hidden="true"
          >
            <LucideGlobe v-if="b.icon === 'globe'" class="size-5" />
            <LucideBadgeCheck v-else-if="b.icon === 'badge'" class="size-5" />
            <LucideRoute v-else class="size-5" />
          </div>
          <div>
            <dt class="text-p-lg font-semibold text-ink-gray-9">{{ b.title }}</dt>
            <dd class="mt-1 leading-relaxed text-ink-gray-7">{{ b.body }}</dd>
          </div>
        </div>
      </dl>
    </div>
  </div>
</template>
