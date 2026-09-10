<script setup>
import { Button } from 'frappe-ui'
import PackScope from './PackScope.vue'
import { useRouter } from 'vue-router'
import { useAuthGate } from '../utils/auth'
import { useConnectStore } from '../stores/connect'

// A pack's full scope, in the column beside the catalogue.
//
// A panel rather than a dialog: you're choosing BETWEEN four packs, and a
// dialog covers the other three at the moment you're comparing them. Here the
// list stays visible and readable at the left, and opening a second pack swaps
// the panel's contents without ever hiding the list.
//
// ⚠️ No scrim, no fixed positioning, no scroll lock. It's a flex sibling of the
// content column — see `ConnectShell`'s `panel` slot — so the page narrows
// rather than being covered, and both sides keep their own scroll.
const props = defineProps({
  pack: { type: Object, required: true },
  // ⚠️ Off on the confirmation screen. The footer's CTA is "start this pack",
  // and by then you have — the panel there is reference material opened beside
  // a booking you are in the middle of making, not a way in.
  actionable: { type: Boolean, default: true },
})
defineEmits(['close'])

const store = useConnectStore()
const router = useRouter()
const { requireAccount } = useAuthGate()

// Booking is: pick a pack → sign in → answer the onboarding questions →
// confirm and book the call. Signed out, the gate sends them to sign up and
// onboarding hands off to `/connect/confirm` at the end; signed in, they go
// straight there.
//
// The gate lands on sign-up, which is `useAuthGate`'s default — someone reading
// a pack's scope and pressing Get started is new business.
const start = () => {
  // Recorded before the gate fires — the confirmation screen is two or four
  // navigations away and has no other way to know which pack this was about.
  store.selectPack(props.pack.value)
  requireAccount(() => router.push('/connect/confirm'))
}
</script>

<template>
  <!-- Its own header and footer, both fixed, with only the scope scrolling
       between them: the panel is tall content in a narrow column, and a CTA
       that scrolls away at the bottom of a 2000px document is a CTA nobody
       reaches. -->
  <header
    class="flex min-h-12 shrink-0 items-start justify-between gap-3 border-b border-outline-gray-1 px-5 py-3"
  >
    <div class="min-w-0">
      <h2 class="text-base font-medium text-ink-gray-8">{{ pack.name }}</h2>
      <p class="mt-0.5 text-p-base text-ink-gray-6">{{ pack.tagline }}</p>
    </div>
    <Button variant="ghost" aria-label="Close" @click="$emit('close')">
      <template #icon><LucideX class="size-4" /></template>
    </Button>
  </header>

  <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
    <PackScope :pack="pack" />
  </div>

  <footer v-if="actionable" class="shrink-0 border-t border-outline-gray-1 px-5 py-3">
    <Button class="w-full" variant="solid" label="Get started" @click="start" />
  </footer>
</template>
