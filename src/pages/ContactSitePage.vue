<script setup>
// SCREEN — frappe.io/contact.
//
// ⚠️ NOT PART OF FRAPPE CONNECT. It is a stand-in for a page that already
// exists on the marketing site, styled as *website* rather than *app* — serif
// headline, 600px measure, no product chrome — exactly like the partners page
// it sits beside. See `FrappeSitePage` for the type scale, which is measured
// off the real site rather than chosen.
//
// ⚠️ WHY IT IS MOCKED AT ALL. A large share of implementation leads arrive
// here rather than on the partners page, and they arrive in a different frame
// of mind: somebody on /partners has decided they want an implementer, while
// somebody here has a QUESTION and expects a human to answer it by email.
// Pointing both at the same three-question intake would answer a question the
// second group did not ask, and the ones who are not implementation leads —
// existing customers with a broken site, people asking whether ERPNext does
// batch manufacturing — would bounce off a purchase funnel. Those are leads the
// current page captures.
//
// ⚠️ SO THIS TRIAGES RATHER THAN REDIRECTS. One question at the top decides
// which of four things the visitor gets, and exactly one of the four leaves for
// Frappe Connect. The form underneath is the page as it stands today; nothing
// about it changes for the three branches that still belong here.
import { computed, ref } from 'vue'
import { Button, FormControl, Textarea } from 'frappe-ui'
import frappeMark from '../assets/frappe.svg'

const baseUrl = import.meta.env.BASE_URL
const connect = (path = '') => `${baseUrl}connect${path}`

// ⚠️ THE ORDER IS THE POINT. Implementation leads first, because they are the
// largest group and the one this page currently serves worst — they fill in a
// form and wait a day for a reply that asks them what they need. Support is
// second because it is the most urgent and the most misdirected: an existing
// customer with a broken site should never be in a sales queue at all.
//
// `to` is a Frappe Connect link, and only the first branch has one.
const REASONS = [
  {
    value: 'implementation',
    label: 'I want to implement ERPNext',
    body: 'Find out what it costs and who can do it — without waiting for a reply.',
    // ⚠️ Opens in a NEW TAB, like every other link from this site into the app:
    // the fiction is that you are leaving frappe.io and arriving somewhere else.
    to: connect(),
    cta: 'Get a recommendation',
  },
  {
    value: 'support',
    label: 'I am a customer and something is broken',
    body: 'Support handles this, not sales — and they answer faster.',
    cta: 'Go to support',
  },
  {
    value: 'product',
    label: 'I have a question about the product or pricing',
    body: 'Someone from the team will get back to you by email.',
    cta: 'Send the message',
  },
  {
    value: 'other',
    label: 'Partnership, press or something else',
    body: 'Tell us what it is about and we will route it.',
    cta: 'Send the message',
  },
]

const reason = ref('implementation')
const chosen = computed(() => REASONS.find((r) => r.value === reason.value) ?? REASONS[0])

// ⚠️ THE FORM IS NOT SHOWN FOR THE FIRST BRANCH, and that is the decision this
// page turns on. Collecting a name and an email and THEN sending someone into a
// self-serve flow means emailing them about a thing they are in the middle of
// doing — the sales follow-up and the product arrive at the same person on the
// same afternoon, disagreeing about what stage they are at. They leave with
// nothing filled in.
const asksForm = computed(() => reason.value !== 'implementation')

const form = ref({ name: '', email: '', company: '', message: '' })
const sent = ref(false)

const submit = () => {
  sent.value = true
}
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

    <main class="mx-auto w-full max-w-[1100px] px-6 py-16">
      <div class="max-w-[600px]">
        <!-- The one serif on the page, same as the partners page — Newsreader
             at 32/41.6, weight 500. Don't tidy it into the product scale. -->
        <!-- ⚠️ The same headline treatment as the partners page, measured off
             the real site rather than chosen: Newsreader 32, weight 500, and
             the only serif on the page. Don't tidy it into the product scale —
             it is what makes this read as the marketing site. -->
        <h1
          class="font-serif text-[32px] font-medium leading-[1.3] tracking-[0.01em] text-ink-gray-8"
        >
          Talk to us
        </h1>
        <p class="mt-3 text-[15px] leading-[23.55px] text-ink-gray-6">
          Tell us what this is about and we'll put you in the right place. Most of it we can answer
          faster than an email round trip.
        </p>

        <!-- ── The triage ──────────────────────────────────────────────── -->
        <!-- ⚠️ ASKED FIRST, above the form, and not as a dropdown inside it. A
             "reason for contact" select buried among the fields is how every
             contact form on the internet asks this, and it changes nothing
             about what happens next — the message still lands in one inbox. The
             answer here changes the whole page, so it has to be the page's
             first question. -->
        <fieldset class="mt-10">
          <legend class="text-[15px] font-semibold text-ink-gray-9">What's this about?</legend>
          <div class="mt-4 space-y-2">
            <label
              v-for="r in REASONS"
              :key="r.value"
              class="relative flex cursor-pointer gap-3 rounded-lg border px-4 py-3.5 transition-colors"
              :class="
                reason === r.value
                  ? 'border-outline-gray-4 bg-surface-gray-1'
                  : 'border-outline-gray-2 hover:bg-surface-gray-1'
              "
            >
              <input
                v-model="reason"
                type="radio"
                name="reason"
                class="peer sr-only"
                :value="r.value"
              />
              <span
                class="pointer-events-none absolute inset-0 rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-outline-gray-3"
                aria-hidden="true"
              />
              <span
                class="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border"
                :class="
                  reason === r.value
                    ? 'border-[5px] border-[var(--ink-gray-8)]'
                    : 'border-outline-gray-3'
                "
                aria-hidden="true"
              />
              <span class="min-w-0">
                <span class="block text-[15px] font-medium text-ink-gray-8">{{ r.label }}</span>
                <span class="mt-0.5 block text-[15px] leading-[23.55px] text-ink-gray-6">
                  {{ r.body }}
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <!-- ── The implementation branch ───────────────────────────────── -->
        <!-- ⚠️ SETS THE EXPECTATION BEFORE THE LINK, which is the whole reason
             this page was worth changing. The old behaviour dropped this
             visitor into a form with no warning that it was a form; three lines
             saying what the next page does is the difference between arriving
             and bouncing. -->
        <div v-if="!asksForm" class="mt-8 rounded-lg border border-outline-gray-2 p-5">
          <p class="text-[15px] font-semibold text-ink-gray-9">
            You don't need to wait for us
          </p>
          <p class="mt-2 text-[15px] leading-[23.55px] text-ink-gray-6">
            Frappe Connect asks three questions about your business and tells you straight away
            whether a fixed-price starter pack covers what you need, or whether it should be scoped
            by a partner. You'll see prices either way, and no one calls you in between.
          </p>
          <Button
            class="mt-4"
            variant="solid"
            size="md"
            :label="chosen.cta"
            :link="chosen.to"
          />
          <p class="mt-3 text-[14px] text-ink-gray-5">
            Would rather just email us? Pick "a question about the product" above.
          </p>
        </div>

        <!-- ── Everything else: the form as it is today ─────────────────── -->
        <form v-else class="mt-8 space-y-4" novalidate @submit.prevent="submit">
          <div v-if="reason === 'support'" class="rounded-lg border border-outline-gray-2 p-5">
            <p class="text-[15px] leading-[23.55px] text-ink-gray-6">
              If you have a Frappe Cloud site, the fastest route is the support desk inside it —
              your site details come along automatically. This form works too.
            </p>
          </div>

          <FormControl v-model="form.name" size="sm" label="Your name" placeholder="Your name" />
          <FormControl
            v-model="form.email"
            type="email"
            size="sm"
            label="Email"
            placeholder="name@company.com"
          />
          <FormControl
            v-model="form.company"
            size="sm"
            label="Company"
            placeholder="Company name"
          />
          <Textarea
            v-model="form.message"
            label="How can we help?"
            :rows="5"
            placeholder="A sentence or two is plenty."
          />

          <Button type="submit" variant="solid" size="md" :label="chosen.cta" />
          <p v-if="sent" class="text-[14px] text-ink-gray-6">
            Thanks — someone will be in touch. (Nothing was actually sent; this is a mock.)
          </p>
        </form>
      </div>
    </main>
  </div>
</template>
