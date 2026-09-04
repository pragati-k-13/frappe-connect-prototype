<script setup>
import { ref, watch } from 'vue'
import { Button, Dialog, toast } from 'frappe-ui'
// Reached for directly because frappe-ui's `Dialog` renders `message` only as
// the FALLBACK content of its default slot — so any dialog with a body of its
// own loses the description, and the underlying primitive then warns that
// `aria-describedby` is missing. reka-ui is frappe-ui's own dialog dependency,
// not a new one. Same reasoning as `BookSlotDialog` and `EstimateQuoteDialog`.
import { DialogDescription } from 'reka-ui'
import frappeCloudMark from '../assets/frappe-cloud.png'
import { useConnectStore } from '../stores/connect'

// The login prompt. One instance for the whole app, mounted in `ConnectShell`
// and opened through `store.requireLogin()` — see the note on that action.
//
// It is the same panel whether it was opened by the top bar's own CTA or by a
// gated control (Contact, Save). The subtitle names what an account is for
// rather than what you just clicked: a prompt that changed its wording per
// button would be four strings saying the same thing, and the visitor already
// knows what they pressed.
const store = useConnectStore()

// ⚠️ There is no auth here and there is nothing to call. The delay exists so
// the pending state is reviewable — a button that swaps to "Logging you in" and
// back inside one frame can't be designed against. A real build replaces the
// timer with the Frappe Cloud OAuth round trip and keeps everything else.
const SIGN_IN_MS = 1400

const loading = ref(false)
let timer = null

const signIn = () => {
  if (loading.value) return
  loading.value = true
  timer = setTimeout(() => {
    loading.value = false
    // Order matters: toast first, then `completeLogin()`. That runs the held
    // pending action, which raises a toast of its own (Save and Contact both
    // do), and the two read in the right order only if the sign-in lands
    // first — "logged in", then "partner saved".
    //
    // Named rather than "Logged in": the demo signs you in as a specific
    // viewer, and which account you're in is the thing the sidebar subtitle
    // was the only place to check.
    toast.success(`Logged in as ${store.viewer.name}`, { id: 'auth' })
    store.completeLogin()
  }, SIGN_IN_MS)
}

// Closing mid-flight has to cancel the timer, or the visitor gets signed in a
// second after dismissing the prompt they backed out of.
const close = () => {
  clearTimeout(timer)
  loading.value = false
  store.dismissLogin()
}

// Reopening after a cancelled attempt should start clean rather than resume the
// spinner it was killed in.
watch(
  () => store.loginOpen,
  (open) => {
    if (!open) {
      clearTimeout(timer)
      loading.value = false
    }
  },
)
</script>

<template>
  <Dialog :model-value="store.loginOpen" size="sm" @update:model-value="!$event && close()">
    <!-- Title and subtitle share the `#title` slot so they sit together. In the
         body the Dialog's own 24px header margin would fall between them, and
         the subtitle belongs to the heading, not to the buttons. -->
    <template #title>
      <div>
        <h3 class="text-2xl font-semibold text-ink-gray-8">Login to continue</h3>
        <DialogDescription class="mt-1 text-p-base text-ink-gray-6">
          Continue to contact partners and share project details
        </DialogDescription>
      </div>
    </template>

    <template #default>
      <div class="space-y-2">
        <!-- `loading` swaps the prefix for frappe-ui's own spinner and
             `loading-text` replaces the label, so the pressed state is the
             component's rather than a hand-rolled one. The button keeps its
             width through the change because both labels are short.

             `size="md"` (32px) rather than the default `sm` (28px): these two
             are the only things in the panel and the sole reason it opened.
             At 28px they read as toolbar buttons. -->
        <Button
          variant="solid"
          size="md"
          class="w-full"
          :loading="loading"
          loading-text="Logging you in"
          label="Log in via Frappe Cloud"
          @click="signIn"
        >
          <template #prefix>
            <img :src="frappeCloudMark" alt="" class="size-4 rounded-[3px] object-contain" />
          </template>
        </Button>

        <!-- ⚠️ Inert, deliberately. Signing up is a Frappe Cloud flow that
             lives outside this app, and stubbing it here would invent an
             account-creation screen nobody has designed. -->
        <Button variant="subtle" size="md" class="w-full" label="Sign up" />
      </div>
    </template>
  </Dialog>
</template>
