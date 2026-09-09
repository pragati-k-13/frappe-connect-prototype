<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, FormControl, toast } from 'frappe-ui'
import AuthShell from '../components/AuthShell.vue'
import { AUTH_MS, isEmail } from '../utils/auth'
import { useConnectStore } from '../stores/connect'

// SCREEN — log in.
//
// One field, because signing up asks for the email and the step after it is
// `verify`: the address is the credential, so there is no password to ask for
// here either. A returning visitor types the same thing they signed up with and
// gets a code.
//
// ⚠️ Every well-formed address signs in. The error this screen would really
// carry — "no account for that email" — needs a backend to know, and inventing
// which addresses exist would put a made-up rule in front of anyone clicking
// through the prototype. The recovery path for it is already on the page: the
// "Create an account" link below the button.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const submitted = ref(false)
const loading = ref(false)
let timer = null

// See the note in `SignupPage`: quiet until the first submit, live after it.
const error = computed(() => {
  if (!submitted.value) return undefined
  if (!email.value.trim()) return 'Enter your work email'
  if (!isEmail(email.value)) return 'Enter a valid email address, like you@company.com'
  return undefined
})

const submit = () => {
  submitted.value = true
  if (loading.value || error.value) return
  loading.value = true
  timer = setTimeout(async () => {
    loading.value = false
    // The account is the one that was typed, not the demo's seeded viewer —
    // otherwise the toast names someone else a beat after you gave your own
    // address. The name stays whatever the store already holds: this screen
    // never asked for one, and inventing one from the address would be worse
    // than a placeholder.
    store.logIn({ email: email.value.trim() })
    // Before the held action, which raises a toast of its own — "logged in",
    // then "partner saved", not the other way round.
    toast.success(`Logged in as ${store.viewer.name}`, { id: 'auth' })
    // ⚠️ Navigate FIRST, then run what the gate was holding. See the same note
    // in `SignupPage` and `runPending` in the store.
    await router.replace(next.value)
    store.runPending()
  }, AUTH_MS)
}

// Only in-app paths — see the same note in `SignupPage`.
const next = computed(() => {
  const to = route.query.next
  return typeof to === 'string' && to.startsWith('/') && !to.startsWith('//') ? to : '/connect'
})

const signupLink = computed(() => ({ name: 'signup', query: route.query }))

// See `SignupPage`: backing out must not leave a held action armed.
onBeforeUnmount(() => {
  clearTimeout(timer)
  if (!store.signedIn) store.dropPending()
})
</script>

<template>
  <AuthShell title="Log in to your account">
    <form class="mt-8" novalidate @submit.prevent="submit">
      <FormControl
        v-model="email"
        type="email"
        size="lg"
        label="Work email"
        placeholder="username@company.com"
        autocomplete="email"
        :error="error"
      />

      <Button
        type="submit"
        variant="solid"
        size="lg"
        class="mt-6 w-full"
        :loading="loading"
        loading-text="Logging you in"
        label="Continue"
      />
    </form>

    <p class="mt-5 text-p-base text-ink-gray-6">
      New to Frappe?
      <RouterLink :to="signupLink" class="font-medium text-ink-gray-8 underline underline-offset-2">
        Create an account
      </RouterLink>
    </p>
  </AuthShell>
</template>
