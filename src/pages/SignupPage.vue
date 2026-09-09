<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, FormControl, toast } from 'frappe-ui'
import AuthShell from '../components/AuthShell.vue'
import { COUNTRY_OPTIONS, INFERRED_COUNTRY, regionForCountry } from '../data/countries'
import { AUTH_MS, isEmail } from '../utils/auth'
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
// Continue signs the visitor in and lands them in the app. In the real flow it
// goes to `verify`, then `company info`, then `project info`, and only then to
// wherever they were headed. None of those three screens exist yet; when they
// do, this handler pushes to the first of them instead and the last one calls
// `completeLogin()`.
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
const loading = ref(false)
let timer = null

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
  if (loading.value || Object.keys(errors.value).length) return
  loading.value = true
  timer = setTimeout(async () => {
    loading.value = false
    // This toast first, then whatever the gate was holding. The held action
    // raises one of its own ("Partner saved"), and the pair only reads in the
    // right order if the account lands before what the account let you do.
    toast.success('Account created', { id: 'auth' })
    // The account carries the name that was typed. Without this the app would
    // greet you by the demo's seeded viewer immediately after asking who you
    // are, which reads as the form having been thrown away.
    store.signUp({
      name: form.name.trim(),
      email: form.email.trim(),
      region: regionForCountry(form.country),
    })
    // ⚠️ Navigate FIRST, then run the held action — see `runPending` in the
    // store. The action belongs to the screen the gate interrupted, and it
    // usually navigates itself (opening a pack's panel is a `?pack=` push), so
    // running it before this would either fire against an unmounted page or be
    // overwritten by the very next line.
    await router.replace(next.value)
    store.runPending()
  }, AUTH_MS)
}

// Where to land afterwards. `?next=` so a gated control can send someone here
// and get them back — the same contract the log-in screen uses.
//
// Only in-app paths are honoured: an absolute URL in a query parameter is how a
// sign-in page gets turned into an open redirect, and this one is linked from a
// public marketing page.
const next = computed(() => {
  const to = route.query.next
  return typeof to === 'string' && to.startsWith('/') && !to.startsWith('//') ? to : '/connect'
})

const loginLink = computed(() => ({ name: 'login', query: route.query }))

// Leaving without finishing drops whatever the gate was holding. Otherwise a
// visitor who backs out here and signs in from somewhere else an hour later
// silently completes the action they walked away from.
onBeforeUnmount(() => {
  clearTimeout(timer)
  if (!store.signedIn) store.dropPending()
})
</script>

<template>
  <AuthShell title="Create your account">
    <!-- `novalidate` so the browser's own bubbles stay out of it: every field
         here has a message of its own, and the two validators fire at different
         moments and word things differently. -->
    <form class="mt-8" novalidate @submit.prevent="submit">
      <!-- 20px between fields. `FormControl` puts 6px between a label and its
           input, so anything tighter and the two gaps stop telling you which
           label belongs to which box. -->
      <div class="space-y-5">
        <FormControl
          v-model="form.name"
          size="lg"
          label="Full name"
          placeholder="Full name"
          autocomplete="name"
          :error="errors.name"
        />
        <FormControl
          v-model="form.email"
          type="email"
          size="lg"
          label="Work email"
          placeholder="username@company.com"
          autocomplete="email"
          :error="errors.email"
        />
        <FormControl
          v-model="form.country"
          type="select"
          size="lg"
          label="Country"
          :options="COUNTRY_OPTIONS"
          :error="errors.country"
        />
      </div>

      <Button
        type="submit"
        variant="solid"
        size="lg"
        class="mt-6 w-full"
        :loading="loading"
        loading-text="Creating account"
        label="Continue"
      />
    </form>

    <p class="mt-5 text-p-base text-ink-gray-6">
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
