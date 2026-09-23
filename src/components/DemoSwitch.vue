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
import { useRoute, useRouter } from 'vue-router'
import { Button, Dropdown } from 'frappe-ui'
import { stagesFor } from '../data/project'
import { useConnectStore } from '../stores/connect'

const store = useConnectStore()
const router = useRouter()
const route = useRoute()

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
// ⚠️ `demoAccount`, not `setAccount`: it also loads the inbox that belongs to
// the persona. `setAccount` alone is what the app calls when someone finishes
// signing up, and a new account must not be handed conversations it never
// started.
function setAccount(account) {
  store.demoAccount(account)
}

// Frappe Cloud's convention for a radio-style menu group: check on the active
// option, minus on the rest.
const check = (role) => (store.role === role ? 'lucide-check' : 'lucide-minus')
const checkAccount = (account) => (store.account === account ? 'lucide-check' : 'lucide-minus')

// ── The stage picker ───────────────────────────────────────────────────────
// ⚠️ Only on a project's own page, and that is the whole design of it. A stage
// belongs to ONE project, so a picker offered from anywhere else would have to
// guess which project it meant — and with four seeded, the guess would be wrong
// three times in four.
//
// It exists because a tracker's states are its content: four of a pack's five
// stages are unreachable in a demo without ticking through twenty tasks, and a
// reviewer has to be able to look at the last one. `store.setStage` deliberately
// leaves `done` alone, so stepping back and forward returns the same project.
//
// The OTHER way stages move is the project page's own "Everything on my side is
// done", which is the product's real gesture. The two write the same field.
const project = computed(() =>
  route.name === 'project' ? store.projectBy(route.params.id) : null,
)
const stages = computed(() => (project.value ? stagesFor(project.value.service) : []))

// ⚠️ TIME, AS A MENU ITEM. Quotes take days and a prototype has neither days
// nor a server, so the only honest way to show a brief being answered is to let
// the reviewer ask for it. The real send deliberately leaves the project with
// no replies — see `broadcastBrief` — because a project that opens reading
// "5 of 8 replied" one second after Send lies about the thing the whole flow is
// built around.
//
// Offered only where it means something: a custom project whose brief has gone
// out and whose replies have not come back.
const awaitingReplies = computed(
  () => Boolean(project.value?.broadcast) && !project.value?.bids?.length,
)
const checkStage = (key) => (project.value?.stage === key ? 'lucide-check' : 'lucide-minus')

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
              // The messages screen's other viewer: signed in, no booking, and
              // four conversations open with two of them gone quiet. It is the
              // only way to see the active/inactive filter do anything, because
              // a booking gives you exactly one thread.
              label: 'Exploring partners',
              description: 'Signed in, no project, several chats open',
              icon: checkAccount('exploring'),
              onClick: () => setAccount('exploring'),
            },
            {
              label: 'Ongoing project',
              // The description used to end "— views to come". They came: this
              // persona is seeded with four projects covering every state the
              // tracker renders. See `demoProjects`.
              description: 'Signed in, four projects under way',
              icon: checkAccount('client'),
              onClick: () => setAccount('client'),
            },
          ],
        },
      ]
    : []),
  ...(awaitingReplies.value
    ? [
        {
          group: 'Time',
          options: [
            {
              label: 'Partners reply',
              description: 'A few days later, as quotes',
              icon: 'lucide-clock',
              onClick: () => store.simulateReplies(project.value.id),
            },
          ],
        },
      ]
    : []),
  // Absent on every other screen, and on a project with no service — there is
  // no spine to step through until one is chosen.
  ...(stages.value.length
    ? [
        {
          group: 'Project stage',
          options: stages.value.map((stage) => ({
            label: stage.label,
            icon: checkStage(stage.key),
            onClick: () => store.setStage(project.value.id, stage.key),
          })),
        },
      ]
    : []),
])
</script>
