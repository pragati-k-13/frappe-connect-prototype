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
// ⚠️ THE ONE ADDITION is the entry-point cards — Starter Packs, custom
// implementation, tech support — which is the reason this
// page is mocked at all: a large share of implementation leads arrive here
// rather than on /partners, and the page had nothing for them but an e-mail
// address and a wait. They sit above the contact details, which stay for
// somebody who came to write in. It is the frappe.io flow's starting page.
//
// ⚠️ EVERY DETAIL BELOW IS FRAPPE'S OWN, read off the live page — one phone
// number, not three, and hello@frappe.io. An earlier draft listed US and UK
// numbers that are not on it.
import { useRouter } from 'vue-router'
import { reactive, computed } from 'vue'
import { Button, FormControl, toast } from 'frappe-ui'
import SiteRail from '../components/SiteRail.vue'
import officeMap from '../assets/office-map.png'
import LucideArrowRight from '~icons/lucide/arrow-right'
import LucideArrowUpRight from '~icons/lucide/arrow-up-right'
import LucideChevronRight from '~icons/lucide/chevron-right'

const router = useRouter()


const DOORS = [
  {
    title: 'Explore Starter Packs',
    body: 'The fastest way to get started with ERPNext.',
    to: '/connect/packs',
  },
  {
    title: 'Need a custom implementation?',
    body: 'Send your requirements to the partners that fit.',
    to: { name: 'contact-partners' },
  },
  {
    title: 'Need tech support?',
    body: 'If you are hosted on Frappe Cloud, raise a ticket on our support portal.',
  },
]

// The "anything else" form. All three are asked for, since a message nobody
// can reply to is not a way to get in touch.
const message = reactive({ name: '', phone: '', body: '' })
const canSend = computed(() => Boolean(message.name.trim() && message.phone.trim() && message.body.trim()))
const send = () => {
  if (!canSend.value) return
  toast.success('Message sent', { description: 'We will get back to you soon.' })
  Object.assign(message, { name: '', phone: '', body: '' })
}

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
        <!-- 800px of content: the 848px cap less the 24px gutter each side. -->
        <main class="mx-auto w-full max-w-[848px] px-6 py-16">
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

          <!-- ── Where to go ─────────────────────────────────────────────
               ⚠️ ENTRY POINTS, IN THE ORDER A VISITOR IS MOST LIKELY TO NEED
               THEM, and the one change to the real page: most people writing in
               want an implementation, so the two ways to get one come first,
               then support. The address stays below
               for everyone who came to write in.
               ⚠️ Tech support is the real page's own link to the support
               portal, which this prototype does not stand in for, so that card
               does not navigate. -->
          <!-- A question rather than "Quick links": the cards below answer it,
               each in the visitor's words. Same style as the section title
               further down. -->
          <h2 class="mt-12 text-[17px] font-semibold leading-[1.35] text-ink-gray-8">
            How can we help?
          </h2>
          <ul class="mt-4 flex flex-col gap-3">
            <li v-for="door in DOORS" :key="door.title">
              <!-- ⚠️ A NEW TAB, so this page stays where the visitor left it.
                   A new tab starts a fresh app, which is the state these
                   doors want anyway: no packs picked, an empty quiz. -->
              <component
                :is="door.to ? 'a' : 'div'"
                :href="door.to ? router.resolve(door.to).href : undefined"
                :target="door.to ? '_blank' : undefined"
                :rel="door.to ? 'noopener' : undefined"
                class="group flex w-full items-center gap-4 rounded-6 border border-outline-gray-2 p-5 text-left"
                :class="door.to && 'transition-colors hover:bg-surface-gray-1'"
              >
                <span class="min-w-0 flex-1">
                  <span class="block text-[15px] font-medium text-ink-gray-8">{{ door.title }}</span>
                  <span class="mt-1 block text-[15px] leading-[1.57] text-ink-gray-6">
                    {{ door.body }}
                  </span>
                </span>
                <!-- Up-right: the mark for "opens in a new tab". -->
                <LucideArrowUpRight
                  v-if="door.to"
                  class="size-4 shrink-0 text-ink-gray-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </component>
            </li>
          </ul>

          <!-- ── The page as it stands ─────────────────────────────────── -->
          <!-- The real page's invitation, shortened into the title of the part
               it invites you to: the address, the map and the form. -->
          <h2 class="mt-20 text-[17px] font-semibold leading-[1.35] text-ink-gray-8">
            Have a question? Write in.
          </h2>
          <dl class="mt-4 grid gap-x-10 gap-y-6 sm:grid-cols-2">
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

          <!-- The office on a map, as the real page shows it. A static image,
               supplied as is: the page has no map of its own to stand in for.
               Cropped to 320px tall by `object-cover`, held on the pin, which
               sits at about 46% across and 34% down the image. -->
          <img
            :src="officeMap"
            alt="Map showing Frappe Technologies at Neelkanth Business Park, Vidyavihar West, Mumbai"
            class="mt-6 h-[320px] w-full rounded-6 border border-outline-gray-1 object-cover object-[46%_34%]"
          />

          <!-- ── Anything else ───────────────────────────────────────────
               For the visitor whose reason is none of the cards above: a short
               form, and "Get in touch" sends it. Nothing is sent anywhere in
               this prototype; the toast is what a sent message would say.
               `sm` controls, the product's own form size (see SignupPage). -->
          <form class="mt-12 flex flex-col gap-4" novalidate @submit.prevent="send">
            <div class="grid gap-4 sm:grid-cols-2">
              <FormControl
                v-model="message.name"
                size="sm"
                label="Name"
                placeholder="Your full name"
                autocomplete="name"
              />
              <FormControl
                v-model="message.phone"
                type="tel"
                size="sm"
                label="Phone number"
                placeholder="+91 98765 43210"
                autocomplete="tel"
              />
            </div>
            <FormControl
              v-model="message.body"
              type="textarea"
              size="sm"
              label="Message"
              placeholder="Your message"
              :rows="4"
            />
            <div>
              <Button variant="solid" size="md" type="submit" label="Get in touch" :disabled="!canSend">
                <template #suffix><LucideArrowRight class="size-4" /></template>
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  </div>
</template>
