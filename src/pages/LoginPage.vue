<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, FormControl } from 'frappe-ui'
import AuthShell from '../components/AuthShell.vue'
import { isEmail, useAuthExit } from '../utils/auth'
import { useConnectStore } from '../stores/connect'

// SCREEN — log in.
//
// One field, because signing up asks for the email and the step after it is
// `verify`: the address is the credential, so there is no password to ask for
// here either. A returning visitor types the same thing they signed up with and
// gets a code.
//
// ⚠️ Every well-formed address gets a code. The error this screen would really
// carry — "no account for that email" — needs a backend to know, and inventing
// which addresses exist would put a made-up rule in front of anyone clicking
// through the prototype. The recovery path for it is already on the page: the
// "Create an account" link below the button.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const submitted = ref(false)

// See the note in `SignupPage`: quiet until the first submit, live after it.
const error = computed(() => {
  if (!submitted.value) return undefined
  if (!email.value.trim()) return 'Enter your work email'
  if (!isEmail(email.value)) return 'Enter a valid email address, like you@company.com'
  return undefined
})

const submit = () => {
  submitted.value = true
  if (error.value) return
  // Recorded before the code is checked so the verify screen and its toast can
  // name the address. The account isn't signed in until the code comes back —
  // see `completeLogin` in the store.
  store.logIn({ email: email.value.trim() })
  router.push({
    name: 'login-verify',
    query: { email: email.value.trim(), ...(route.query.next ? { next: route.query.next } : {}) },
  })
}

const signupLink = computed(() => ({ name: 'signup', query: route.query }))

// See `SignupPage`: backing out must not leave a held action armed.
useAuthExit()
</script>

<template>
  <AuthShell title="Log in to your account">
    <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
      <FormControl
        v-model="email"
        type="email"
        size="sm"
        label="Work email"
        placeholder="name@company.com"
        autocomplete="email"
        autofocus
        :error="error"
      />

      <Button type="submit" variant="solid" size="md" class="w-full" label="Continue" />
    </form>

    <p class="mt-4 text-p-sm text-ink-gray-5">
      New to Frappe?
      <RouterLink :to="signupLink" class="font-medium text-ink-gray-8 underline underline-offset-2">
        Create an account
      </RouterLink>
    </p>
  </AuthShell>
</template>
