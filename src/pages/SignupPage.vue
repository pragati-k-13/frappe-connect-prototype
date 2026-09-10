<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, FormControl } from 'frappe-ui'
import AuthShell from '../components/AuthShell.vue'
import { COUNTRY_OPTIONS, INFERRED_COUNTRY, regionForCountry } from '../data/countries'
import { isEmail, useAuthExit } from '../utils/auth'
import { useConnectStore } from '../stores/connect'

// SCREEN — create an account.
//
// ── Why three fields ────────────────────────────────────────────────────────
// This is the first of four steps in the flow (create account, verify, company
// info, project info), so it asks only what it needs to send the verification
// email and nothing that can wait for a later screen. Name and email are that.
//
// Country is the exception, and it earns its place: it's the only answer here
// the PRODUCT uses rather than the account. Region prices the packs and is one
// of the two dimensions partners are matched on, and it's already known from
// the request's IP — so asking is really asking someone to confirm a guess,
// which is a cheaper question than it looks. See `data/countries.js`.
//
// ⚠️ There is no password, and that's not an omission. The next step in the
// flow is `verify`, which means an emailed code or link — so the address is the
// credential and a password field here would be a second one nobody asked for.
//
// ── THE SEAM ────────────────────────────────────────────────────────────────
// Continue hands off to `verify`, which is where the account is actually
// created. After that the flow chart has `company info`, then `project info`,
// and only then wherever the visitor was headed. Neither exists yet, so verify
// goes straight to `next`; when they land, they slot in between.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  name: '',
  email: '',
  // Pre-filled rather than blank. In production the country comes from the
  // request's IP; here it's hardcoded to the common case so the interaction —
  // an answer already made, which you can change — is reviewable.
  country: INFERRED_COUNTRY,
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
  if (!form.country) e.country = 'Select your country'
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
    region: regionForCountry(form.country),
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
      <FormControl
        v-model="form.country"
        type="select"
        size="sm"
        label="Country"
        :options="COUNTRY_OPTIONS"
        :error="errors.country"
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
  </AuthShell>
</template>
