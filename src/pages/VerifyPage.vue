<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, toast } from 'frappe-ui'
import AuthShell from '../components/AuthShell.vue'
import OtpInput from '../components/OtpInput.vue'
import { AUTH_MS, nextFrom, useAuthExit } from '../utils/auth'
import { useConnectStore } from '../stores/connect'

// SCREEN — verify the email address.
//
// The second step of the flow chart's `create account → verify`, and the step
// that makes both auth screens make sense: neither asks for a password, so the
// address IS the credential and this is where it's proved. Following
// frappe-cloud-v2's `VerifyEmailPage` — same six boxes, same wording, same
// "use a different email / resend" pair — because a visitor who has a Frappe
// Cloud account has already met this screen once.
//
// ONE component behind two routes. Sign-up and log-in reach the identical
// screen; only the heading, the toast and where "Use a different email" goes
// back to differ, and those are three lines, not a second page.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

const isSignup = computed(() => route.name === 'signup-verify')

// ⚠️ In the query as well as the store: the store is in memory, so a reload on
// this screen would otherwise leave it unable to say which address it sent a
// code to. `store.viewer.email` is the fallback for the same reason.
const email = computed(() => String(route.query.email || '') || store.viewer.email)

const otp = ref('')
const loading = ref(false)
let timer = null

// ⚠️ Any six digits pass, exactly as in frappe-cloud-v2. There is no code to
// check against, and inventing one that works would put a number nobody can
// guess in front of anyone clicking through. The real validation on this screen
// is the button, which stays disabled until all six boxes are full.
const verify = () => {
  if (loading.value || otp.value.length !== 6) return
  loading.value = true
  timer = setTimeout(async () => {
    loading.value = false
    // ⚠️ The two paths end differently, and this is the fork.
    //
    // Signing up isn't finished here — one more screen asks about the company,
    // and THAT is where the account lands and the held action runs. So this
    // hands off and stays quiet: no toast, no `completeLogin`, or the app would
    // congratulate someone halfway through and then let them wander off with
    // the gate's errand still armed.
    //
    // Logging in has nothing left to ask, and finishes here as before.
    if (isSignup.value) {
      router.replace({ name: 'signup-company', query: route.query })
      return
    }
    // This toast before the held action, which raises one of its own — the pair
    // only reads in the right order if the account lands before what the account
    // let you do.
    toast.success(`Logged in as ${store.viewer.name}`, { id: 'auth' })
    store.completeLogin()
    // ⚠️ Navigate FIRST, then run what the gate was holding — see `runPending`
    // in the store. The action belongs to the screen the gate interrupted, and
    // it often navigates itself.
    await router.replace(next.value)
    store.runPending()
  }, AUTH_MS)
}

const resend = () => {
  otp.value = ''
  toast.success(`New code sent to ${email.value}`, { id: 'auth' })
}

// Back to the form that sent them here, carrying `next` so the gate's errand
// survives the correction.
const back = computed(() => ({
  name: isSignup.value ? 'signup' : 'login',
  query: route.query.next ? { next: route.query.next } : {},
}))

const next = computed(() => nextFrom(route))

useAuthExit()
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <AuthShell :title="isSignup ? 'Verify your email' : 'Verify your login'">
    <!-- No full stop after the address, and that's a formatting constraint
         rather than a style choice: the repo runs prettier with
         `htmlWhitespaceSensitivity: "ignore"`, which is free to break the line
         after `</span>` and leave a visible space before the punctuation. -->
    <p class="mt-1 text-p-base text-ink-gray-5">
      Enter the 6-digit code we sent to
      <span class="font-medium text-ink-gray-8">{{ email || 'your email address' }}</span>
    </p>

    <form class="mt-6 space-y-4" @submit.prevent="verify">
      <OtpInput v-model="otp" :disabled="loading" @complete="verify" />
      <p class="text-p-sm text-ink-gray-5">Demo. Any 6 digits work.</p>

      <Button
        type="submit"
        variant="solid"
        size="md"
        class="w-full"
        :loading="loading"
        loading-text="Verifying"
        :disabled="otp.length !== 6"
        label="Verify and continue"
      />
    </form>

    <!-- The two ways out, side by side because they're equal weight: one fixes
         a typo, the other waits again. Neither is the primary action. -->
    <div class="mt-4 flex items-center justify-between text-p-sm">
      <RouterLink :to="back" class="font-medium text-ink-gray-8 underline underline-offset-2">
        Use a different email
      </RouterLink>
      <button
        type="button"
        class="font-medium text-ink-gray-8 underline underline-offset-2"
        @click="resend"
      >
        Resend code
      </button>
    </div>
  </AuthShell>
</template>
