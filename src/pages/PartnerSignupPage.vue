<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, FormControl } from 'frappe-ui'
import AuthShell from '../components/AuthShell.vue'
import { isEmail } from '../utils/auth'
import { usePartnerAccountStore } from '../stores/partnerAccount'

// SCREEN — partner sign-up, from "Become a partner". See PARTNER-VIEW-PLAN.md
// §0 "Onboarding".
//
// No application: finishing sign-up makes the firm a Beginner. A Beginner
// isn't listed, gets no leads and has no partner code, so there is nothing to
// review at this point. Frappe reviews once, when the Bronze criteria are met.
//
// ⚠️ Only who you are and where to send the code. The firm's name and country
// are the first step on Partnership's way to Bronze, as in Frappe Cloud's
// partner onboarding, so sign-up stays two screens: this, then the code.
//
// Signing in is NOT here. Partners use the one log-in screen, and Connect
// tells a partner from the email.
const account = usePartnerAccountStore()
const router = useRouter()

const form = reactive({ name: '', email: '' })

// Quiet until the first submit, live after it. See `SignupPage`.
const submitted = ref(false)
const errors = computed(() => {
  if (!submitted.value) return {}
  const e = {}
  if (!form.name.trim()) e.name = 'Enter your full name'
  if (!form.email.trim()) e.email = 'Enter your work email'
  else if (!isEmail(form.email)) e.email = 'Enter a valid email address, like you@company.com'
  return e
})

const submit = () => {
  submitted.value = true
  if (Object.keys(errors.value).length) return
  account.holdSignup({ name: form.name.trim(), email: form.email.trim() })
  router.push({ name: 'partner-signup-verify', query: { email: form.email.trim() } })
}
</script>

<template>
  <AuthShell title="Become a Frappe partner">
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
      <Button type="submit" variant="solid" size="md" class="w-full" label="Continue" />
    </form>

    <p class="mt-4 text-p-sm text-ink-gray-5">
      Already have an account?
      <RouterLink :to="{ name: 'login' }" class="font-medium text-ink-gray-8 underline underline-offset-2">
        Log in
      </RouterLink>
    </p>
  </AuthShell>
</template>
