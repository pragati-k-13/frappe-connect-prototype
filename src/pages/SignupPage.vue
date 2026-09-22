<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, FormControl } from 'frappe-ui'
import AuthShell from '../components/AuthShell.vue'
import { isEmail, useAuthExit } from '../utils/auth'
import { useConnectStore } from '../stores/connect'

// SCREEN — create an account.
//
// ── Why these three fields ──────────────────────────────────────────────────
// ⚠️ SIGN-UP IS NOW JUST CREATE AND VERIFY. It used to be the first of four
// steps, with company details and project details as screens three and four;
// both are gone, because the intake on the landing page asks those questions
// before anyone signs up and asking them twice was the price of that flow.
//
// What is left is identity: who you are, what the company is called, where to
// send the code.
//
// ⚠️ THE COMPANY NAME IS THE ONE FIELD WORTH ARGUING ABOUT, and it is here
// rather than in the intake on purpose. The intake holds to one rule — every
// question in it changes the recommendation — and a name changes nothing about
// which packs fit. It is first needed on the invoice and, for custom work, at
// the moment a bid is approved and a partner learns who they are dealing with.
// Both are downstream of this screen.
//
// ⚠️ COUNTRY IS GONE from this form. The intake asks it, one screen earlier,
// because it sets the currency and the partner pool.
//
// ⚠️ There is no password, and that's not an omission. The next step in the
// flow is `verify`, which means an emailed code or link — so the address is the
// credential and a password field here would be a second one nobody asked for.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

// ⚠️ Prefilled from whatever the account already holds, which is normally
// nothing — but someone who signed up, logged out and came back should not be
// made to type their own company name again.
const form = reactive({
  name: store.viewer.name ?? '',
  email: '',
  company: store.company.name ?? '',
})

// Errors are only shown after a submit attempt. Validating as you type means
// telling someone their email is malformed while they're still in the middle of
// typing it, which is the single most common way this screen gets annoying.
// Once they HAVE submitted, the messages update live — at that point they know
// what's wrong and are trying to fix it, and silence until the next press would
// hide the fact that they had.
const submitted = ref(false)

const errors = computed(() => {
  if (!submitted.value) return {}
  const e = {}
  if (!form.name.trim()) e.name = 'Enter your full name'
  if (!form.email.trim()) e.email = 'Enter your work email'
  else if (!isEmail(form.email)) e.email = 'Enter a valid email address, like you@company.com'
  if (!form.company.trim()) e.company = 'Enter your company name'
  return e
})

const submit = () => {
  submitted.value = true
  if (Object.keys(errors.value).length) return
  // The account carries the name that was typed. Recorded BEFORE verification
  // so the next screen can name the address it sent a code to; the visitor
  // isn't signed in until they come back with it.
  store.signUp({
    name: form.name.trim(),
    email: form.email.trim(),
    company: form.company.trim(),
  })
  // `email` in the query as well as the store, so a reload on the verify screen
  // still knows where the code went. `next` rides along so the gate's errand
  // survives both hops.
  router.push({
    name: 'signup-verify',
    query: { email: form.email.trim(), ...(route.query.next ? { next: route.query.next } : {}) },
  })
}

const loginLink = computed(() => ({ name: 'login', query: route.query }))

// Leaving without finishing drops whatever the gate was holding. Otherwise a
// visitor who backs out here and signs in from somewhere else an hour later
// silently completes the action they walked away from.
useAuthExit()
</script>

<template>
  <AuthShell title="Create your account">
    <!-- `novalidate` so the browser's own bubbles stay out of it: every field
         here has a message of its own, and the two validators fire at different
         moments and word things differently.
         `mt-6 space-y-4` throughout, from `MinimalAuthShell`'s screens in
         frappe-cloud-v2. The controls are `sm` rather than their `md`, and at
         `sm` all three kinds agree natively — 28px tall, 8px of side padding,
         14px text on inputs, selects and textareas alike. At `md` they do not:
         the pinned frappe-ui renders a `md` textarea at 16px while an input
         stays at 14, which this flow used to need a CSS override to undo. -->
    <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
      <FormControl
        v-model="form.name"
        size="sm"
        label="Full name"
        placeholder="Your full name"
        autocomplete="name"
        autofocus
        :error="errors.name"
      />
      <FormControl
        v-model="form.email"
        type="email"
        size="sm"
        label="Work email"
        placeholder="name@company.com"
        autocomplete="email"
        :error="errors.email"
      />
      <!-- ⚠️ Asked here rather than in the intake — see the note at the top.
           "Company name", not "Organisation": it is what will be printed on the
           invoice and shown to a partner. -->
      <FormControl
        v-model="form.company"
        size="sm"
        label="Company name"
        placeholder="The name on your invoices"
        autocomplete="organization"
        :error="errors.company"
      />

      <Button type="submit" variant="solid" size="md" class="w-full" label="Continue" />
    </form>

    <p class="mt-4 text-p-sm text-ink-gray-5">
      Already have an account?
      <!-- `query` is carried across so a visitor who was sent here by a gated
           control, then realised they already have an account, still lands back
           on the thing they were trying to do. -->
      <RouterLink :to="loginLink" class="font-medium text-ink-gray-8 underline underline-offset-2">
        Log in
      </RouterLink>
    </p>

    <!-- ⚠️ PARTNERS ARE NOT USERS OF THIS FLOW and every field above assumes
         they aren't — a certified firm arriving here would create a customer
         account and wonder why it had no inbox. One line pointing them at their
         own portal costs nothing and saves a support ticket.

         Dead in this prototype: the partner-side app is not mocked. -->
    <p class="mt-2 text-p-sm text-ink-gray-5">
      Are you a Frappe partner?
      <a href="#" class="font-medium text-ink-gray-8 underline underline-offset-2">
        Log in to the partner portal
      </a>
    </p>
  </AuthShell>
</template>
