<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Combobox, FormControl } from 'frappe-ui'
import AuthShell from '../components/AuthShell.vue'
import { COUNTRY_OPTIONS_INDIA_ONLY, SELECTABLE_COUNTRY } from '../data/company'
import { isEmail } from '../utils/auth'
import { usePartnerAccountStore } from '../stores/partnerAccount'

// SCREEN — partner sign-up, from "Become a partner". See PARTNER-VIEW-PLAN.md
// §0 "Onboarding".
//
// No application: finishing sign-up makes the firm a Beginner. A Beginner
// isn't listed, gets no leads and has no partner code, so there is nothing to
// review at this point. Frappe reviews once, when the Bronze criteria are met.
//
// ⚠️ Who you are, where to send the code, and the country. Country is here
// because it sets the firm's currency and MRR target from the start, as press's
// registration does. Everything else about the firm is the first step of the
// checklist on Partnership, so sign-up stays two screens: this, then the code.
//
// Signing in is NOT here. Partners use the one log-in screen, and Connect
// tells a partner from the email.
const account = usePartnerAccountStore()
const router = useRouter()

// India only for now — see `COUNTRY_OPTIONS_INDIA_ONLY`.
const form = reactive({ name: '', email: '', country: SELECTABLE_COUNTRY })

// Quiet until the first submit, live after it. See `SignupPage`.
const submitted = ref(false)
const errors = computed(() => {
  if (!submitted.value) return {}
  const e = {}
  if (!form.name.trim()) e.name = 'Enter your full name'
  if (!form.email.trim()) e.email = 'Enter your work email'
  else if (!isEmail(form.email)) e.email = 'Enter a valid email address, like you@company.com'
  if (!form.country) e.country = 'Select a country'
  return e
})

const submit = () => {
  submitted.value = true
  if (Object.keys(errors.value).length) return
  account.holdSignup({ name: form.name.trim(), email: form.email.trim(), country: form.country })
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
      <Combobox
        v-model="form.country"
        size="sm"
        label="Country"
        placeholder="Select a country"
        trigger="button"
        :options="COUNTRY_OPTIONS_INDIA_ONLY"
        :error="errors.country"
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
