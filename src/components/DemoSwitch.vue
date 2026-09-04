<template>
  <div class="fixed bottom-4 right-4 z-50">
    <Dropdown :options="options" side="top" align="end">
      <Button
        variant="outline"
        size="sm"
        label="Demo"
        icon-left="lucide-flask-conical"
        class="bg-surface-elevation-1 shadow-md"
      />
    </Dropdown>
  </div>
</template>

<script setup>
// The prototype's own control, not part of the product — same bottom-right
// demo switch as frappe-cloud-v2, so reviewers already know where to look.
//
// ⚠️ It shares that corner with the toasts, which is deliberate. frappe-ui's
// `ToastProvider` hardcodes `position="bottom-right"` and exposes no prop to
// move it, so something has to give, and the answer is that a toast simply
// covers this button for the few seconds it's on screen. The alternatives were
// both worse: offsetting the toast stack upward spent dead space under every
// toast on every screen to accommodate a control that isn't part of the
// product, and moving this to bottom-left broke the convention reviewers
// arrive with.
//
// Covering works because vue-sonner's toaster is `position: fixed` at
// `z-index: 999999999` — orders of magnitude above this `z-50` — so the toast
// paints over the button and its action stays clickable. Nothing here enforces
// that; it's the toaster's own stylesheet. If a toast ever renders BEHIND this
// button, that ordering is what changed.
//
// It lives in App.vue rather than in ConnectShell because the marketing page
// (screen 1) has no app chrome at all, and the switch has to be reachable from
// every screen in the flow.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Dropdown } from 'frappe-ui'
import { useConnectStore } from '../stores/connect'

const store = useConnectStore()
const router = useRouter()

// Picking Business restarts the whole demo rather than just setting a flag:
// state is wiped and you land back on the Frappe website, where the flow
// actually begins. Picking the view you're already in is the natural "start
// over" gesture in a prototype, and there's nothing else for it to do.
//
// `reset()` clears answers, the inferred-region flag and the results filters.
// The quiz's own step counter is local to the landing page, so navigating away
// unmounts it and it comes back at question 1 on its own.
function switchTo(role) {
  store.setRole(role)
  store.reset()
  router.push('/')
}

// Switching account state does NOT reset or navigate, unlike switching role.
// It's a property of the viewer rather than a different demo, so flipping it
// should re-render the screen you're on rather than throw you back to the
// start of the flow — that's the comparison a reviewer wants to make.
function setAccount(account) {
  store.setAccount(account)
}

// Frappe Cloud's convention for a radio-style menu group: check on the active
// option, minus on the rest.
const check = (role) => (store.role === role ? 'lucide-check' : 'lucide-minus')
const checkAccount = (account) => (store.account === account ? 'lucide-check' : 'lucide-minus')

const options = computed(() => [
  {
    group: 'View as',
    options: [
      {
        label: 'Business',
        description: 'Restart from the Frappe website',
        icon: check('business'),
        onClick: () => switchTo('business'),
      },
      {
        label: 'Partner',
        // Present but inert: the product has two sides, and hiding the second
        // one would misrepresent its shape. Disabled says "later", not "no".
        description: 'Not in this prototype',
        icon: check('partner'),
        disabled: true,
        onClick: () => switchTo('partner'),
      },
    ],
  },
  // The second axis, and only meaningful on the business side — a partner
  // looking at their own PRM is never "signed out".
  //
  // ⚠️ Both options are live and neither changes anything yet: every screen is
  // still built for the signed-out visitor. The states exist so the switcher
  // names them and so `store.signedIn` / `store.hasProject` have somewhere to
  // read from; the descriptions say so rather than implying a view that isn't
  // there.
  ...(store.role === 'business'
    ? [
        {
          group: 'Business viewer',
          options: [
            {
              label: 'No account',
              description: 'Signed out — every screen as built today',
              icon: checkAccount('visitor'),
              onClick: () => setAccount('visitor'),
            },
            {
              label: 'Ongoing project',
              description: 'Signed in, mid-implementation — views to come',
              icon: checkAccount('client'),
              onClick: () => setAccount('client'),
            },
          ],
        },
      ]
    : []),
])
</script>
