import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
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
// `screen` picks which of the two the visitor meets, and `'signup'` is the
// default. Anyone the gate stops is by definition not signed in, and on a
// directory reached from a public marketing page that is overwhelmingly someone
// without an account yet. Meeting them with a log-in form asks for a credential
// they don't have; sign-up carries a "Log in" link, so it costs the returning
// customer one click and costs the newcomer nothing.
//
// Pass `'login'` to send someone to the log-in screen instead. Nothing does
// today — it's here so a surface aimed at returning customers has the option
// without reopening this file.
export function useAuthGate() {
  const store = useConnectStore()
  const router = useRouter()
  const route = useRoute()

  const requireAccount = (action, { screen = 'signup' } = {}) => {
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

// The route names that make up the auth flow, so leaving one for another isn't
// mistaken for backing out of it. Sign-up hands off to its verify screen, and
// that hop must not drop what the gate is holding.
const AUTH_ROUTES = new Set(['login', 'signup', 'login-verify', 'signup-verify'])

// Where to land once the visitor is in. `?next=` so a gated control can send
// someone to an auth screen and get them back.
//
// ⚠️ Relative paths only. An absolute URL in a query parameter is how a sign-in
// page becomes an open redirect, and these are linked from a public marketing
// page.
export function nextFrom(route) {
  const to = route.query.next
  return typeof to === 'string' && to.startsWith('/') && !to.startsWith('//') ? to : '/connect'
}

// Leaving the auth flow without finishing drops whatever the gate was holding.
// Otherwise a visitor who backs out and signs in from somewhere else an hour
// later silently completes the action they walked away from.
//
// Route names, not paths: sign-up → verify is still inside the flow, and the
// hop between them must not look like an exit.
export function useAuthExit() {
  const store = useConnectStore()
  onBeforeRouteLeave((to) => {
    if (!store.signedIn && !AUTH_ROUTES.has(to.name)) store.dropPending()
  })
}
