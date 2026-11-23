<!-- ⚠️ A plain `<script>` alongside `<script setup>`: everything in here runs
     ONCE for the module, not once per component instance. That is the whole
     point — see the note on `collapsed` below. -->
<script>
import { ref } from 'vue'

// The rail's open/closed state, deliberately at MODULE scope rather than inside
// `setup`.
//
// ⚠️ Every page renders its own `<ConnectShell>`, so navigating unmounts one
// shell and mounts the next. A `ref` in `setup` is re-created by that, which
// means it re-initialises to its default and the rail snapped shut on every
// single navigation — the visitor opens it, clicks a row, and it closes behind
// them. Hoisting it out makes one ref for the app: the shells come and go, the
// choice stays.
//
// ⚠️ STARTS EXPANDED. Collapsed, the rail was a column of unlabelled icons
// whose tooltips only show on hover, and its expand control only appears when
// the pointer finds the seam — a first visit met six icons and no words. The
// collapsed state stays for whoever chooses it. Below `sm` it still starts
// collapsed: binding the model takes over from Sidebar's own default, and an
// expanded rail would take most of a phone's width.
//
// Session-only, by design — a reload starts expanded again. Persisting it
// would mean writing to localStorage, which nobody has asked for.
const collapsed = ref(window.matchMedia('(max-width: 639px)').matches)
</script>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Alert,
  Avatar,
  Dropdown,
  Button,
  PageHeader,
  ScrollArea,
  Sidebar,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  toast,
  Tooltip,
} from 'frappe-ui'
import ConnectMark from './ConnectMark.vue'
import IconBag from '~icons/lucide/shopping-bag'
import FeedbackDialog from './FeedbackDialog.vue'
import AppSettingsDialog from './settings/AppSettingsDialog.vue'
import { useAuthGate } from '../utils/auth'
import { PROJECT_ROWS, useConnectStore } from '../stores/connect'
import { firmFor, longDate, standingFor } from '../data/partnership'
import LeadsIcon from './icons/LeadsIcon.vue'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import PartnerSettingsDialog from './settings/PartnerSettingsDialog.vue'
import PartnerAccountDialog from './settings/PartnerAccountDialog.vue'
import NotificationsPanel from './NotificationsPanel.vue'
import NotificationsRailItem from './NotificationsRailItem.vue'
import SearchPalette from './SearchPalette.vue'
import NewProjectDialog from './NewProjectDialog.vue'
import { notifications, readRequestNotification, requestNotification } from '../data/notifications'

const store = useConnectStore()
const router = useRouter()
const { requireAccount } = useAuthGate()

// ⚠️ `SidebarItem` infers its active state by comparing the WHOLE path
// (`current.path === target.path`), so a child route lights nothing at all.
// "Find partners" points at /connect, which meant the rail showed no location
// on the partner list and on every profile — two of the three in-app screens,
// and the two you spend the most time on. Every route under /connect is the
// partner directory, so the match is a prefix.
const route = useRoute()
const inMessages = computed(() => route.name === 'messages')
// ── Projects, by name ──────────────────────────────────────────────────────
// ⚠️ THE PROJECT IS THE ROW, not a "Projects" list. Most accounts have one, and
// a list of one is a click that tells you nothing. So the rail names each
// project (newest first) and goes straight to it; past `PROJECT_ROWS` it keeps
// the newest and an "All projects" row for the rest. With none, a "Projects"
// row opens the empty state, which is where sign-in lands too.
// "Requirements sent" belongs to the project it names, so it lights that row.
const openProjectId = computed(() =>
  route.name === 'project' ? route.params.id : route.name === 'brief-sent' ? route.query.project : null,
)
const projectRows = computed(() => {
  const icon = 'lucide-briefcase-business'
  const list = [...store.projects].reverse()
  const row = (p) => ({ to: `/connect/projects/${p.id}`, label: p.name, icon, active: openProjectId.value === p.id })
  if (!list.length) return [{ to: '/connect/projects', label: 'Projects', icon, active: route.name === 'projects' }]
  if (list.length <= PROJECT_ROWS) return list.map(row)
  const newest = row(list[0])
  return [
    newest,
    {
      to: '/connect/projects',
      label: 'All projects',
      icon: 'lucide-layers',
      // An older project has no row of its own, so it lights the list's.
      active: route.name === 'projects' || (Boolean(openProjectId.value) && !newest.active),
    },
  ]
})
// ⚠️ THE DIRECTORY IS NOW ITS OWN DESTINATION, matched by name rather than by
// subtraction. It used to be "everything under /connect that isn't one of the
// other sections", because the rail's first row pointed at /connect and the
// directory had no row of its own — which was true while /connect WAS a partner
// list behind two questions. It is the intake and the recommendation now, so
// the two are separate places and each has its row.
// `contact-partners` too: it sits under /connect/partners and its breadcrumb
// reads Partners, so the rail says the same.
const DIRECTORY_ROUTES = new Set(['results', 'partner', 'partner-reviews', 'saved-partners', 'contact-partners'])
const inDirectory = computed(() => DIRECTORY_ROUTES.has(route.name))

// The front door: the questions, and the answer they produce.
const HOME_ROUTES = new Set(['connect', 'recommendation'])
const inHome = computed(() => HOME_ROUTES.has(route.name))

// ── The partner's rail ──────────────────────────────────────────────────────
// Each role sees the areas it works in (the roles table in the plan): Sales
// has no Invoices, Finance has no Messages.
const account = usePartnerAccountStore()
const partnerRail = computed(() => {
  const role = store.partnerRole
  // Member is view-only: standing, the profile and resources. The team is in
  // Settings → Users, which every role can open.
  const member = role === 'member'
  const at = (...names) => names.includes(route.name)
  // ONE LIST, NO LABELS. Order does what group labels did: the daily work
  // first (Leads, Customers), then the firm's standing (Partnership, and the
  // Audits that set its PMM level), then the firm's own listing and bills, then
  // Frappe's material last. No counts on the rail: a row waiting on a reply is
  // bold in its list, and the rest comes through Notifications.
  // ⚠️ THE ORDER IS FIXED FOR EVERY TIER. Partnership used to jump to the top
  // for a Beginner, so the list reshuffled the day a firm reached Bronze. A
  // Beginner still LANDS on Partnership — that is `partnerHome`'s job, not
  // the rail's.
  // A Beginner isn't listed, so it has no leads, customers, profile, invoices
  // or audits yet: Partnership and Resources are all there is.
  if (store.partnerTier === 'beginner')
    return [
      {
        items: [
          { label: 'Partnership', to: '/connect/partnership', icon: 'lucide-handshake', active: at('partnership') },
          { label: 'Resources', to: '/connect/resources', icon: 'lucide-folder', active: at('resources') },
        ],
      },
    ]
  return [
    {
      items: [
        !member && role !== 'finance' && { label: 'Leads', to: '/connect/leads', iconComp: LeadsIcon, active: at('leads', 'lead') },
        !member && { label: 'Customers', to: '/connect/customers', icon: 'lucide-building-2', active: at('customers', 'customer') },
        { label: 'Partnership', to: '/connect/partnership', icon: 'lucide-handshake', active: at('partnership') },
        { label: 'Audits', to: '/connect/audits', icon: 'lucide-clipboard-check', active: at('audits', 'audit') },
        { label: 'Public profile', to: '/connect/profile', icon: 'lucide-store', active: at('own-profile', 'own-reviews') },
        !member && role !== 'sales' && { label: 'Invoices', to: '/connect/invoices', icon: 'lucide-receipt', active: at('invoices') },
        { label: 'Resources', to: '/connect/resources', icon: 'lucide-folder', active: at('resources') },
      ].filter(Boolean),
    },
  ]
})

// The partner side's firm and person follow the demo tier: Beginner is a
// different firm. See `data/partnership.js`.
// Someone with an account: a signed-in business, or the partner side, which
// the demo shows as signed in whatever the business-side session says.
const hasAccount = computed(() => store.signedIn || store.role === 'partner')
// ⚠️ THE WEBSITE SHELL. Signed out, the app's sidebar is gone: a visitor
// arrives from frappe.io, and a rail with two links in it said "you are inside
// a product" to someone who has no account yet. They get a website nav instead
// — the logo (which goes Home) and the auth link — and the sidebar appears on
// the far side of sign-in. No breadcrumb for visitors: the browser's Back
// does that job on a website.
const website = computed(() => !hasAccount.value)

const shellSubtitle = computed(() => {
  if (store.role === 'partner') {
    // A firm that has just signed up has no name until its profile is filled
    // in; until then, the person, as on the business side.
    return account.firmName ?? account.edits.me
  }
  // The header is the organization on both sides; the person is in the
  // footer. Falls back to the name for an account with no company yet.
  return store.signedIn ? store.viewer.company || store.viewer.name : undefined
})

// The header is already a Dropdown trigger — `SidebarHeader` takes `menuItems`
// and renders the chevron itself, so clicking the logo opens this rather than
// needing a control of its own.
//
// Signing out does the real thing: it puts the demo back in the signed-out
// state, so the switch is reachable from the product and not only from the
// demo control in the corner.
//
// ⚠️ GIVE FEEDBACK MOVED HERE FROM A RAIL ROW, and the rail was the wrong
// place for it. The four rows above are PLACES — Messages, Home, Partners,
// Starter packs, Projects — and a fifth that opened a dialog over
// wherever you already were did not belong in a list of destinations, however
// carefully it was separated from them. This menu is the one that already
// holds the thing you do rather than the place you go.
//
// It still reaches every screen, which was the whole requirement: the menu
// hangs off the shell's own header, and the shell is on all of them.
//
// ⚠️ OFFERED TO SIGNED-OUT VISITORS TOO, which is why the menu is no longer
// empty for them. Somebody who bounced off the intake without making an account
// is exactly the person with something worth hearing, and the old menu had
// nothing in it — so the chevron never appeared and there was no way to say so.
// ⚠️ THE ONE PIECE OF STATE THIS SHELL OWNS THAT IS NOT NAVIGATION, and it is
// here rather than on each page because the dialog has to be reachable from all
// of them.
// ⚠️ THE ONE BANNER THE PARTNER SIDE HAS. At risk is rare and serious, so it
// shows on every partner screen rather than waiting for a visit to
// Partnership. Everything else about standing waits for that visit.
const atRisk = computed(() => {
  if (store.role !== 'partner' || store.partnerTier === 'beginner') return null
  return standingFor(store.partnerTier, store.partnershipState).risk ?? null
})

const feedback = ref(false)
const settings = ref(false)

const partnerSettings = ref(false)
// A page can ask for Firm settings on a tab (the Leads page's alert does).
watch(
  () => store.firmSettingsTab,
  (t) => t && (partnerSettings.value = true),
)
watch(partnerSettings, (o) => !o && store.openFirmSettings(null))
const partnerAccount = ref(false)

// ── The footer: the signed-in person, on both sides ─────────────────────────
// The header is the organization (its settings, help); the footer is you
// (your settings, theme, log out), as on Frappe Cloud. One layout for both
// sides, so Log out and Theme are in the same place whichever side you're on.
const me = computed(() =>
  store.role === 'partner' ? account.edits.me ?? firmFor(store.partnerTier).person : store.viewer.name,
)
// Which tab the business settings dialog opens on: the header's Settings is
// the company, the footer's is you.
const settingsTab = ref('profile')
const openSettings = (tab) => {
  settingsTab.value = tab
  settings.value = true
}
const themeMenu = computed(() => ({
  label: 'Theme',
  icon: 'lucide-sun-moon',
  submenu: [
    ['Light', 'light'],
    ['Dark', 'dark'],
    ['System', 'system'],
  ].map(([label, value]) => ({
    label,
    icon: store.preferences.theme === value ? 'lucide-check' : 'lucide-minus',
    onClick: () => (store.preferences.theme = value),
  })),
}))
const footerMenu = computed(() => [
  {
    label: 'Your settings',
    icon: 'lucide-user-cog',
    onClick: () => (store.role === 'partner' ? (partnerAccount.value = true) : openSettings('profile')),
  },
  themeMenu.value,
  { label: 'Log out', icon: 'lucide-log-out', onClick: logOut },
])

const logoMenu = computed(() => [
  // Everyone can open the firm's settings to see who's on the team; the other
  // panels are the owner's.
  ...(store.role === 'partner'
    ? [{ label: 'Firm settings', icon: 'lucide-settings', onClick: () => (partnerSettings.value = true) }]
    : store.signedIn
      ? [{ label: 'Settings', icon: 'lucide-settings', onClick: () => openSettings('company') }]
      : []),
  // A visitor has no footer, so the theme stays here for them. Signed in, it
  // is in the footer with the rest of what's yours.
  ...(hasAccount.value ? [] : [themeMenu.value]),
  { label: 'Give feedback', icon: 'lucide-message-square-quote', onClick: () => (feedback.value = true) },
])

// `store.logOut()` rather than `setAccount('visitor')`: logging out has to drop
// the saved list too. It didn't before, so every bookmark you'd filled stayed
// filled after signing out — the row was reading a list that no longer belonged
// to anyone.
//
// The only signal used to be the dropdown closing and the sidebar's subtitle
// disappearing, neither of which you're looking at when you press it. The count
// is in the description because that's the part you can't see happen.
// ⚠️ ONE LOG OUT. There were two on the partner side, and they did different
// things — one went back to the business side's front door, the other stayed
// put. Both sides now leave the same way: to the partner list, which is the
// visitor's home, with a toast.
const logOut = () => {
  store.setRole('business')
  const cleared = store.logOut()
  router.push('/connect/partners')
  toast('Logged out', {
    id: 'auth',
    description: cleared
      ? `${cleared} saved ${cleared === 1 ? 'partner' : 'partners'} cleared with the session.`
      : undefined,
  })
}

// ⚠️ INVENTED, and static per state. There's no notifications screen and nothing
// generates events, so this is a constant — it exists so the badge has states to
// be reviewed in: the collapsed dot, the expanded count pill, and no badge at
// all. It never clears, because there's nowhere to go and read them.
//
// Zero unless there's a project, and that's the point rather than a detail.
// Notifications come from something HAPPENING — a partner replying, an
// implementation moving — so a signed-out visitor has none, and neither does
// someone who just made an account and hasn't done anything yet. A badge on
// their first screen would be advertising mail that cannot exist.
//
// ⚠️ Keyed on `hasProject` rather than `signedIn` deliberately, even though the
// two are identical today: the enum is `visitor | client`, and `client` means
// "signed in, mid-implementation". Hanging it off the PROJECT rather than the
// account is what makes a future "signed up, nothing started yet" state come out
// at zero without anyone having to remember it.
//
// Wire to real unread state when that screen lands. Note `RailItem` caps its own
// badge at "99+" — anything here that could exceed two digits wants the same.
// Link requests join the partner's list for owners and sales, newest first
// with the rest.
const canReviewLinks = computed(() => ['owner', 'sales'].includes(store.partnerRole))
const notifItems = computed(() => {
  if (store.role !== 'partner') return store.hasProject ? notifications.business : []
  const requests = canReviewLinks.value ? account.requests.map(requestNotification) : []
  return [...notifications.partner, ...requests].sort((a, b) => b.time - a.time)
})
const unread = computed(() => notifItems.value.filter((n) => !n.read).length)
const notifOpen = ref(false)
const searchOpen = ref(false)
const readNotification = (n) => (n.requestId ? readRequestNotification(n.requestId) : (n.read = true))
const readAllNotifications = () => notifItems.value.forEach(readNotification)
// Search's empty state: the places in the rail.
const BUSINESS_PLACES = [
  { to: '/connect/messages', label: 'Messages', icon: 'lucide-inbox' },
  { to: '/connect/partners', label: 'Partners', icon: 'lucide-building-2' },
]
const searchPlaces = computed(() =>
  store.role === 'partner'
    ? partnerRail.value.flatMap((g) => g.items).map((i) => ({ to: i.to, label: i.label, icon: i.icon, iconComp: i.iconComp }))
    : [...projectRows.value, ...BUSINESS_PLACES],
)
// Search's one action, and the business side's only one: starting a project
// has no rail row of its own once you have a project.
const searchActions = computed(() =>
  store.role === 'partner' ? [] : [{ label: 'New project', icon: 'lucide-plus', run: () => store.openNewProject() }],
)
const createProject = (details) => {
  store.newProjectOpen = false
  router.push(`/connect/projects/${store.createProject(details)}`)
}

// The seam handle. `railY` follows the pointer down the sidebar's right edge so
// the chevron appears where the hand already is, rather than at a fixed spot
// the user has to travel to — the same behaviour as the drag handles in Notion
// and Linear.
const railY = ref(0)

const onRailMove = (e) => {
  railY.value = e.clientY - e.currentTarget.getBoundingClientRect().top
}
// The Frappe Connect app chrome: frappe-ui's Sidebar + a top bar. Wraps both
// in-app screens so neither re-mounts between the quiz and the results.
//
// Sidebar owns its own collapse behaviour (auto-collapses below `sm`), so
// there's no responsive handling to write here.
defineProps({
  // Trailing breadcrumb label. Unset on the list screens, where the bar just
  // reads the root.
  crumb: { type: String, default: null },
  // The root crumb. "Partners" everywhere except the pack catalogue, which is
  // its own top-level destination rather than a level under the directory —
  // hard-coding "Partners" filed it as one.
  rootLabel: { type: String, default: 'Partners' },
  rootTo: { type: String, default: '/connect/partners' },
  // Crumbs between the root and the current page, `{ label, to }`: a partner's
  // Reviews page reads "Partners / Software@Work / Reviews".
  trail: { type: Array, default: () => [] },
  // Hand the content region to the page at full height, with no scrolling of
  // its own. For a screen whose panes scroll separately — messages, where the
  // thread list and the conversation each keep their own position and the
  // composer stays put at the bottom. A page that scrolls as one document
  // wants the default.
  flush: { type: Boolean, default: false },
  // No top bar. For a screen whose own columns carry its title (Leads), where
  // a 48px row with one word in it is wasted.
  bare: { type: Boolean, default: false },
  // Off where the page carries its own sign-up — the cart, whose Sign up sits
  // under the total. Two ways into one account, one in the chrome and one in
  // the page, split the click.
  authCta: { type: Boolean, default: true },
  // The pages that sell packs: a bag at the bar's far edge, with the count,
  // that goes to the cart page. The one way into the cart, the same on each.
  cart: { type: Boolean, default: false },
  // The partner directory: the way to the saved list, with its count, in the
  // app's top bar. Always shown, "Saved" at zero. Signed in only: visitors
  // can't save, and their top bar is the website nav.
  saved: { type: Boolean, default: false },
})

// Slots: `default` is the screen. `#action` is optional and replaces the top
// bar's trailing control — see the note at the slot for why it replaces the
// auth CTA rather than joining it.
//
// ⚠️ Not declared with `defineSlots()`. It's a TYPES-ONLY macro: in a plain JS
// `<script setup>` it has no runtime argument to accept, and passing it an
// object is a compile error ("defineSlots() cannot accept arguments") rather
// than a lint warning.
</script>

<template>
  <!-- `text-base`: app screens default to frappe-ui's 14px, so text without
       its own size never falls back to the browser's 16px. -->
  <div class="flex h-screen bg-surface-base text-base">
    <!-- The rail and its notifications panel, which slides out of the rail's
         right edge over the page. Outside the Sidebar so its scroll area can't
         clip it. -->
    <div v-if="!website" class="relative z-20 flex shrink-0">
    <Sidebar v-model:collapsed="collapsed" class="fc-sidebar border-r">
      <!-- The second line is the organization — the firm, or the business's
           company — and nothing at all when signed out. The person is in the
           footer. -->
      <SidebarHeader
        title="Frappe Connect"
        :subtitle="shellSubtitle"
        :menu-items="logoMenu"
      >
        <!-- `lg` is 28px, exactly SidebarHeader's own logo frame
             (`size-7 rounded-[6px]`), so the mark fills it rather than sitting
             in it. One definition for the app — see `ConnectMark`. -->
        <template #prefix>
          <ConnectMark size="lg" />
        </template>
      </SidebarHeader>

      <!-- `px-2` on the viewport is frappe-ui's own figure and it is load-bearing
           twice: the ScrollArea root is `overflow-hidden`, so the padding is what
           keeps the active row's shadow from being clipped, AND it is what centres
           a 16px icon in the 48px collapsed rail (8px padding + the item's own
           8px = 16px, centre 24px, exactly half of 48).
           ⚠️ Don't tighten it to `px-1` to line the icons up with the header logo
           in the expanded state. That was tried: it aligns the expanded rail at
           12px and knocks the collapsed rail's icons 4px left of centre while the
           logo sits 2px right of it. Six pixels apart in a 48px rail is far more
           visible than frappe-ui's 6px stagger when expanded.

           `pb-2` is the installed version's own figure, from the only file in
           the package that composes a sidebar — `DesktopShell/stories/Default.vue`.
           The docs site shows `pb-10` for this same composition, but that page
           is live and unversioned, so it isn't evidence about beta.63. -->
      <ScrollArea class="min-h-0 flex-1" viewport-class="px-2 pt-0.5 pb-2">
        <!-- ── The personal pair ──────────────────────────────────────────
             Ungrouped, no `SidebarLabel`, sitting directly under the header and
             above everything you can navigate to. The pattern is Helpdesk's,
             which puts Search and Notifications in exactly this position for
             exactly this reason: these are not places in the app, they're what
             is waiting for YOU. A label would file them as a section of the
             product alongside Discover, which is what they are not.

             Separated from the list below by 16px — see the note there. -->
        <!-- ── ⚠️ Every row's tooltip is OURS, not `SidebarItem`'s ──────────
             `SidebarItem` ships a collapsed-state tooltip and it is broken: it
             hardcodes `<Tooltip placement="right">` while `Tooltip`'s prop is
             `side`, and `Tooltip` sets `inheritAttrs: false`, so `placement` is
             dropped rather than applied to anything. The default `side: 'top'`
             wins, and every label pops UP over the item above it — a bubble
             painted across the middle of a 48px rail. Nothing errors. See
             FRAPPE-UI-NOTES.md.

             It can't be configured from out here (no prop reaches it) and it
             can't be disabled from out here either — its `disabled` is
             `!isCollapsed || !tooltipText`, and `tooltipText` falls back to the
             row's own rendered text, so any row with a visible label has one.
             So it's switched off in CSS instead, by killing pointer events on
             reka-ui's trigger marker — see `.fc-sidebar [data-grace-area-trigger]`
             in `index.css` — and replaced with the wrapper below.

             `side="right"` with `:offset="8"`, and that 8 is arithmetic rather
             than taste. The row sits at x=8-40 inside the 48px collapsed rail
             (the ScrollArea viewport's own `px-2`), and reka measures
             `sideOffset` from the trigger's edge to the ARROW's tip, not to the
             bubble. 40 + 8 = 48, which is exactly the rail's right edge — so
             the tip touches the seam between the sidebar and the content, and
             the bubble itself starts 4px further out (the arrow's height).
             Nothing in the sidebar is covered and nothing floats away from it.
             ⚠️ Tied to that `px-2` and to the 48px collapsed width: move either
             and this wants recomputing, not nudging.

             `:disabled="!collapsed"` because an expanded row already shows its
             label, and a tooltip repeating a visible label is noise.

             ⚠️ Hover only, not focus. reka's trigger merges onto the row's
             outer `<div>`, which isn't focusable — the `<a>`/`<button>` inside
             it is, and `focus` doesn't bubble. Keyboard users get nothing from
             this, exactly as they got nothing from the built-in one for the
             same reason. It isn't a regression, and it isn't a gap in the
             accessible name either: `SidebarItem` puts `aria-label` on the
             control itself. -->
        <!-- ── Search and Notifications, on both sides ─────────────────────
             Signed in only: a visitor has nothing to be notified of. Tools, not
             places, so they sit above the list of pages and apart from it, in
             the same spot on the business side and the partner side. -->
        <nav v-if="hasAccount" class="mb-4 space-y-0.5">
          <Tooltip text="Search" side="right" :offset="8" :disabled="!collapsed">
            <div @click="searchOpen = true">
              <SidebarItem label="Search">
                <template #prefix><span class="lucide-search size-4 text-ink-gray-6" aria-hidden="true" /></template>
                <template #suffix><span class="mr-2 text-xs text-ink-gray-5">⌘K</span></template>
              </SidebarItem>
            </div>
          </Tooltip>
          <NotificationsRailItem :collapsed="collapsed" :unread="unread" @toggle="notifOpen = !notifOpen" />
        </nav>

        <!-- The partner's pages, filtered by role (see `partnerRail`). -->
        <template v-if="store.role === 'partner'">
          <nav v-for="(group, gi) in partnerRail" :key="gi" class="space-y-0.5" :class="gi > 0 && 'mt-4'">
            <SidebarLabel v-if="group.label" divider>{{ group.label }}</SidebarLabel>
            <Tooltip
              v-for="item in group.items"
              :key="item.to"
              :text="item.label"
              side="right"
              :offset="8"
              :disabled="!collapsed"
            >
              <SidebarItem :label="item.label" :route="item.to" :active="item.active">
                <template #prefix>
                  <component :is="item.iconComp" v-if="item.iconComp" class="size-4 text-ink-gray-6" aria-hidden="true" />
                  <span v-else :class="item.icon" class="size-4 text-ink-gray-6" aria-hidden="true" />
                </template>
              </SidebarItem>
            </Tooltip>
          </nav>
        </template>

        <!-- ── The business side's pages ─────────────────────────────────
             Signed in: your projects by name, Messages, Partners. No Home — it
             only repeated these pages and frappe.io's feeds — so the account
             opens on the newest project, the first row. Messages sits
             between the work and the directory: replies to a broadcast from
             Partners land there.
             Signed out: Home (the visitor's front door) and Partners.
             Starter Packs are hidden for now; their routes still exist. -->
        <nav v-else-if="store.signedIn" class="space-y-0.5">
          <Tooltip v-for="p in projectRows" :key="p.to" :text="p.label" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem :label="p.label" :route="p.to" :active="p.active">
              <template #prefix><span :class="p.icon" class="size-4 shrink-0 text-ink-gray-6" aria-hidden="true" /></template>
            </SidebarItem>
          </Tooltip>
          <Tooltip text="Messages" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Messages" route="/connect/messages" :active="inMessages">
              <template #prefix><span class="lucide-inbox size-4 text-ink-gray-6" aria-hidden="true" /></template>
            </SidebarItem>
          </Tooltip>
          <Tooltip text="Partners" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Partners" route="/connect/partners" :active="inDirectory">
              <template #prefix><span class="lucide-building-2 size-4 text-ink-gray-6" aria-hidden="true" /></template>
            </SidebarItem>
          </Tooltip>
        </nav>
        <nav v-else class="space-y-0.5">
          <Tooltip text="Home" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Home" route="/connect" :active="inHome">
              <template #prefix><span class="lucide-house size-4 text-ink-gray-6" aria-hidden="true" /></template>
            </SidebarItem>
          </Tooltip>
          <Tooltip text="Partners" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Partners" route="/connect/partners" :active="inDirectory">
              <template #prefix><span class="lucide-building-2 size-4 text-ink-gray-6" aria-hidden="true" /></template>
            </SidebarItem>
          </Tooltip>
        </nav>

      </ScrollArea>
      <!-- The footer: you, on both sides. -->
      <div v-if="hasAccount" class="shrink-0 px-2 pb-2">
        <Dropdown :options="footerMenu" side="top" align="start">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-4 p-1.5 text-left transition-colors hover:bg-surface-gray-2"
            :class="collapsed && 'justify-center'"
          >
            <Avatar :label="me" size="sm" />
            <template v-if="!collapsed">
              <span class="min-w-0 flex-1 truncate text-sm text-ink-gray-8">{{ me }}</span>
              <span class="lucide-chevrons-up-down size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
            </template>
          </button>
        </Dropdown>
      </div>
    </Sidebar>
    <NotificationsPanel
      v-model:open="notifOpen"
      :items="notifItems"
      ignore="#notifications-btn"
      @select="readNotification"
      @read-all="readAllNotifications"
    />
    </div>
    <SearchPalette v-if="hasAccount" v-model:open="searchOpen" :places="searchPlaces" :actions="searchActions" />
    <NewProjectDialog
      v-if="store.signedIn && store.role !== 'partner'"
      :open="store.newProjectOpen"
      @close="store.newProjectOpen = false"
      @create="createProject"
    />

    <FeedbackDialog v-model:open="feedback" />
    <AppSettingsDialog v-model:open="settings" :initial-tab="settingsTab" />
    <PartnerSettingsDialog v-model:open="partnerSettings" :initial-tab="store.firmSettingsTab" />
    <PartnerAccountDialog v-model:open="partnerAccount" />

    <div class="relative flex min-w-0 flex-1 flex-col">
      <!-- ── Collapse handle ──────────────────────────────────────────────
           Replaces `SidebarCollapseToggle`, which was a permanent button in the
           rail's footer. This is the seam itself: a full-height strip sitting
           over the sidebar's right edge (the content column is `relative`, so
           `-left-1.5` lands on the edge whatever width the sidebar currently
           is). Hovering reveals a hairline down the seam and a chevron at the
           pointer's own height, so the target is already under the hand.

           The strip only tracks the pointer; the chevron is the button, and at
           20px centred on a 12px strip it sits under the cursor whenever it's
           visible. `focus-visible:opacity-100` is what keeps it reachable by
           keyboard, since an `opacity-0` control is still focusable. -->
      <!-- Gone while Notifications is open: the panel covers the seam, and a
           collapse chevron on the panel's edge reads as the panel's own. -->
      <div v-if="!notifOpen && !website" class="group absolute inset-y-0 -left-1.5 z-20 w-3" @mousemove="onRailMove">
        <span
          class="absolute left-1/2 top-0 h-full -translate-x-1/2 border-l border-outline-gray-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          aria-hidden="true"
        />
        <button
          class="absolute left-1/2 grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-outline-gray-2 bg-surface-base text-ink-gray-6 opacity-0 shadow-sm transition-opacity duration-150 hover:text-ink-gray-8 focus-visible:opacity-100 group-hover:opacity-100"
          :style="{ top: `${railY}px` }"
          :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="collapsed = !collapsed"
        >
          <LucideChevronRight v-if="collapsed" class="size-3.5" />
          <LucideChevronLeft v-else class="size-3.5" />
        </button>
      </div>

      <!-- Top bar. frappe-ui's own `PageHeader` rather than a hand-rolled
           `<header>`, which is what this was: the strip's metrics ARE the
           design system's — `min-h-12` (matching SidebarHeader's fixed 48px
           region, so the two line up across the seam), `px-3 sm:px-5`, and the
           bottom rule. The hand-rolled copy had drifted to `px-4` below `sm`,
           4px wider than the system's figure, which is the sort of thing that
           only shows up when two apps are put side by side.

           It sits outside the scroll region rather than sticking inside it, so
           nothing scrolls under a sticky element. `shrink-0` falls through onto
           PageHeader's root, which is what keeps the bar from being squeezed by
           the ScrollArea below it.

           The bottom rule stays, and PageHeader draws it. It isn't a section
           divider — it's the edge of the chrome, marking where the fixed bar
           ends and the scrolling content begins. Without it, content scrolls up
           against nothing. -->
      <!-- 44px, Frappe CRM's bar height on this scale (CRM's 42px isn't a
           step here). `!` because PageHeader carries its own `min-h-12`. -->
      <!-- The website nav, signed out. The logo is Home; the one control is
           the auth link. No page actions here — a page's own Contact lives in
           the page, and the nav stays the same on every screen and at every
           scroll position. -->
      <header
        v-if="website && !bare"
        class="flex h-12 shrink-0 items-center justify-between border-b px-5"
      >
        <!-- The logo goes to the partner list: with Home stored (see the
             router), the list is home. -->
        <RouterLink to="/connect/partners" class="flex items-center gap-2 rounded text-base font-medium text-ink-gray-9">
          <ConnectMark size="md" />
          Frappe Connect
        </RouterLink>
        <div class="flex items-center gap-2">
          <Button
            v-if="authCta"
            variant="ghost"
            class="-mr-2"
            label="Log in or create account"
            @click="requireAccount()"
          >
            <template #suffix><LucideArrowRight class="size-4" /></template>
          </Button>
          <Button
            v-if="cart"
            variant="subtle"
            :label="store.packs.length ? `View cart (${store.packs.length})` : 'View cart'"
            @click="router.push({ name: 'cart' })"
          >
            <template #prefix><IconBag class="size-4" aria-hidden="true" /></template>
          </Button>
        </div>
      </header>
      <PageHeader v-else-if="!bare" class="!min-h-11 h-11 shrink-0">
        <!-- "Partners" alone on the list screens; a breadcrumb once you're
             inside one. `crumb` is the trailing label, and "Partners" becomes
             the link back — the profile is a level down, so the bar is where
             that depth is shown rather than adding a Back button to the page.

             ⚠️ NOT frappe-ui's `Breadcrumbs`, and deliberately. Its metrics are
             copied here exactly — `text-lg-medium`, a `/` at `text-ink-gray-4`,
             `px-0.5 py-1` per crumb, the trail in `ink-gray-5` and the current
             page in `ink-gray-9` — but its markup is a bare `<div>` of
             `<button>`s: no `<nav>` landmark, no `aria-current`, and the page
             you are already on rendered as a focusable control that does
             nothing. This is three crumbs deep at most and will never need its
             overflow dropdown, so the semantics are worth more than the
             component. Revisit if the directory ever nests further. -->
        <!-- `pr-3` because PageHeader's own row has no gap — its reference
             composition puts a solid button against the crumbs and lets them
             touch. The current crumb truncates, so without this the ellipsis
             runs straight into the auth control at narrow widths. -->
        <!-- `#crumb` replaces the trailing label with a control, as Frappe
             CRM puts its view switcher there ("Leads / To reply ▾"). -->
        <nav v-if="crumb || $slots.crumb" class="flex min-w-0 items-center pr-3" aria-label="Breadcrumb">
          <RouterLink
            :to="rootTo"
            class="shrink-0 whitespace-nowrap rounded-4 px-0.5 py-1 text-lg-medium text-ink-gray-5 transition-colors hover:text-ink-gray-7"
          >
            {{ rootLabel }}
          </RouterLink>
          <span class="mx-0.5 text-base text-ink-gray-4" aria-hidden="true">/</span>
          <template v-for="t in trail" :key="t.to">
            <RouterLink
              :to="t.to"
              class="min-w-0 truncate rounded-4 px-0.5 py-1 text-lg-medium text-ink-gray-5 transition-colors hover:text-ink-gray-7"
            >
              {{ t.label }}
            </RouterLink>
            <span class="mx-0.5 text-base text-ink-gray-4" aria-hidden="true">/</span>
          </template>
          <!-- With a trail, the trail crumb truncates and the current page
               keeps its name ("Partners / Softwa… / Reviews"). -->
          <slot name="crumb">
            <span
              :class="trail.length ? 'shrink-0' : 'min-w-0'"
              class="truncate px-0.5 py-1 text-lg-medium text-ink-gray-9"
              aria-current="page"
            >
              {{ crumb }}
            </span>
          </slot>
        </nav>
        <span v-else class="flex items-center gap-2 whitespace-nowrap px-0.5 py-1 text-lg-medium text-ink-gray-9">
          {{ rootLabel }}
          <!-- A state that belongs to the whole page, beside its name (the
               Public profile's "Unlisted"). -->
          <slot name="title-suffix" />
        </span>

        <!-- The bar's right side as ONE item: PageHeader spaces its children
             with `justify-between`, so three loose controls would put the
             middle one in the centre of the bar. Saved sits first, so the
             ghost auth CTA keeps the far edge its `-mr-2` is tuned for. -->
        <div class="flex items-center gap-2">
          <!-- Same shape as the cart's: labelled, with the count, so the bookmark
               on a row and this button read as one feature. Shown at zero too,
               so the bookmark has somewhere visible to go before the first save.
               Signed in only: this bar is the app's, and visitors can't
               save. -->
          <Button
            v-if="saved"
            variant="subtle"
            :label="store.savedPartners.length ? `Saved (${store.savedPartners.length})` : 'Saved'"
            @click="router.push({ name: 'saved-partners' })"
          >
            <template #prefix><LucideBookmark class="size-4" aria-hidden="true" /></template>
          </Button>
          <!-- The trailing control. A page fills it through `#action` — the
               profile does, with its own Contact.

               ⚠️ Whatever a page puts in this slot REPLACES the auth CTA rather
               than joining it: the bar holds one control, and two ghost buttons
               side by side in a 48px strip would be a choice nobody is asking the
               visitor to make.

               `-mr-2` cancels the ghost Button's own 8px of horizontal padding.
               A ghost has no fill to see, so what reads as the bar's right
               padding is where its LABEL stops — 28px in, against the crumb's 20
               on the left. Pulling the box back lands the ink on the same 20px
               the header pads to, which is what the solid button in frappe-ui's
               own PageHeader example gets for free. Same correction the profile
               page's ghost buttons make with `-ml-2`. Anything filling `#action`
               wants it too. -->
          <slot name="action">
            <!-- Signed out: one auth CTA, the ghost "Log in or create account".
                 It used to promote to a solid "Create account" on the results
                 screen, but a solid button in the chrome outranks the page's own
                 primary action.

                 It goes through `requireAccount`, the gate in `utils/auth.js`:
                 signed out, it navigates to the sign-up screen carrying `?next=`
                 back to here. This is the seam the removed `LoginDialog` used to
                 fill and that `signInToast` stood in for; both are gone.

                 Signed in: nothing here. The account surface isn't designed yet,
                 so the bar shows the absence of the CTA rather than a stand-in
                 for a control whose shape nobody has decided. `store.viewer`
                 holds the identity for whenever user settings land. Reading
                 `store.signedIn` rather than `store.account` keeps the enum in
                 the store — see `stores/connect.js`. -->
            <Button
              v-if="authCta && !store.signedIn && store.role !== 'partner'"
              variant="ghost"
              class="-mr-2"
              label="Log in or create account"
              @click="requireAccount()"
            >
              <template #suffix><LucideArrowRight class="size-4" /></template>
            </Button>
          </slot>
          <!-- ⚠️ A BAG, not a cart: `shopping-cart` is the Buying module's mark.
               Labelled, in the catalogue's words ("View cart (2)" beside its
               total): an icon alone up here went unnoticed. -->
          <Button
            v-if="cart"
            variant="subtle"
            :label="store.packs.length ? `View cart (${store.packs.length})` : 'View cart'"
            @click="router.push({ name: 'cart' })"
          >
            <template #prefix><IconBag class="size-4" aria-hidden="true" /></template>
          </Button>
        </div>
      </PageHeader>

      <!-- frappe-ui's ScrollArea: overlay scrollbars that fade in on hover or
           scroll, instead of a permanent native gutter. Same primitive
           DesktopShell uses for its content region. -->
      <!-- ⚠️ `fc-content` makes the content column a container-query root, so a
           page inside it can respond to ITS width rather than the viewport's.
           That matters here and nowhere else: with a panel open the column's
           width changes without the window changing, so viewport breakpoints
           inside a page would answer the wrong question. See `index.css`. -->
      <div
        v-if="atRisk"
        class="shrink-0 border-b border-outline-gray-1 px-3 py-2 sm:px-5"
      >
        <Alert
          theme="amber"
          :title="`${atRisk.criterion} are below ${atRisk.tier}. Fix by ${longDate(atRisk.fixBy)}, before the review on ${longDate(atRisk.review)}.`"
          :primary-action="route.name === 'partnership' ? undefined : { label: 'View', onClick: () => router.push('/connect/partnership') }"
        />
      </div>
      <div class="flex min-h-0 flex-1">
        <!-- ⚠️ Two content regions, one slot. The default wraps the page in a
             ScrollArea and lets it be as tall as it likes; `flush` hands over
             the region at exactly the height left under the top bar and
             scrolls nothing, so a page can put its own scrollers inside it.
             `min-h-0` on both is what lets a child actually scroll instead of
             stretching this box. -->
        <main v-if="flush" class="fc-content flex min-h-0 min-w-0 flex-1">
          <slot />
        </main>
        <ScrollArea
          v-else
          class="fc-content min-h-0 min-w-0 flex-1"
          :class="$slots.panel ? 'hidden md:block' : ''"
        >
          <main class="min-w-0">
            <slot />
          </main>
        </ScrollArea>

        <!-- ⚠️ The width lives in `.fc-panel` (index.css), not in Tailwind
             classes here, because it is the thing that ANIMATES: the panel
             pushes the content column aside rather than appearing beside it, so
             the page and the panel are one motion. `fc-panel-inner` holds the
             contents at full width so nothing inside re-wraps while the box is
             still growing. -->
        <Transition name="panel">
          <aside
            v-if="$slots.panel"
            class="fc-panel flex shrink-0 border-l border-outline-gray-1 bg-surface-base"
          >
            <div class="fc-panel-inner flex min-w-0 flex-col">
              <slot name="panel" />
            </div>
          </aside>
        </Transition>
      </div>
    </div>
  </div>
</template>
