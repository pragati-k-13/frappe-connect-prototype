import { useRoute, useRouter } from 'vue-router'
import { useConnectStore } from '../stores/connect'

// Everything the auth screens and the controls they gate have in common.
//
// The validator lives here rather than on either screen so sign-up and log-in
// can't drift into disagreeing about what a valid email is — the failure you get
// the moment the same check is written out twice.

// ⚠️ Deliberately loose. The only thing worth rejecting on the client is a
// typo the person can see for themselves: no @, nothing before it, nothing
// after it, no dot in the domain. Everything past that (does the domain
// resolve, does the mailbox exist) is the verification email's job, and a
// stricter pattern here only ever rejects addresses that are actually fine.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isEmail = (value) => EMAIL.test(value.trim())

// ⚠️ There is no auth here and there is nothing to call. The delay exists so
// the pending state is reviewable — a button that swaps to "Creating account"
// and back inside one frame can't be designed against. Same reasoning, and the
// same duration, as the log-in screen. A real build replaces the timer with the
// round trip and keeps everything else.
export const AUTH_MS = 1400

// THE GATE. Wrap any control that needs an account:
//
//   const { requireAccount } = useAuthGate()
//   requireAccount(() => store.toggleSaved(id))
//
// Signed in, the action just runs. Signed out, the visitor goes to an auth
// SCREEN carrying `?next=` back to where they are, and the action is held until
// they return — so they land on a saved partner rather than back where they
// started having to press it again.
//
// ⚠️ It used to open a modal over the page, which is why this is a composable
// rather than a store action: it needs the router and the current route, and a
// store reaching for the router is how you get an import cycle.
//
// `screen` picks which of the two the visitor meets. `'login'` is the default,
// because the log-in screen carries a "Create an account" link and so serves
// both, while sign-up in front of a returning customer is a wrong guess with a
// form attached. Pass `'signup'` where the intent really is new business —
// "Get started" on a pack is the case that exists today.
export function useAuthGate() {
  const store = useConnectStore()
  const router = useRouter()
  const route = useRoute()

  const requireAccount = (action, { screen = 'login' } = {}) => {
    if (store.signedIn) {
      action?.()
      return true
    }
    store.holdUntilLogin(action)
    // `fullPath`, not `path`: the packs screen carries the open pack in
    // `?pack=`, so anything less puts the visitor back on the list with the
    // panel they were reading closed.
    router.push({ name: screen, query: { next: route.fullPath } })
    return false
  }

  return { requireAccount }
}
