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
// Starts collapsed: the quiz and the map are the point of the landing screen,
// and an expanded rail eats width the map wants. Binding the model also takes
// over from Sidebar's default (collapse only below `sm`), so it stays as left
// at every width.
//
// Session-only, by design — a reload starts collapsed again. Persisting it
// would mean writing to localStorage, which nobody has asked for.
const collapsed = ref(true)
</script>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  Badge,
  Button,
  PageHeader,
  ScrollArea,
  Sidebar,
  SidebarHeader,
  SidebarItem,
  toast,
  Tooltip,
} from 'frappe-ui'
import ConnectMark from './ConnectMark.vue'
import FeedbackDialog from './FeedbackDialog.vue'
import { useAuthGate } from '../utils/auth'
import { useConnectStore } from '../stores/connect'
import { PARTNERS } from '../data/partners'
import { PARTNER_SELF } from '../data/partnerView'

const store = useConnectStore()
const { requireAccount } = useAuthGate()

// ⚠️ `SidebarItem` infers its active state by comparing the WHOLE path
// (`current.path === target.path`), so a child route lights nothing at all.
// "Find partners" points at /connect, which meant the rail showed no location
// on the partner list and on every profile — two of the three in-app screens,
// and the two you spend the most time on. Every route under /connect is the
// partner directory, so the match is a prefix.
const route = useRoute()
// ⚠️ The pack flow is excluded from the directory. Every route under /connect
// used to be the directory; the catalogue was the first that wasn't, and
// without this both rail rows light up at once.
//
// ⚠️ NAMES, not a path prefix. The flow leaves `/connect/packs` after the
// catalogue — confirming and the booked screen are `/connect/confirm` and
// `/connect/confirmed` — so a prefix lit "Find partners" on the last two
// screens of buying a pack, while their own breadcrumb read "Starter packs".
// The rail and the breadcrumb should never disagree about which section you
// are in. A new screen in this flow belongs in this set.
const PACK_ROUTES = new Set(['packs', 'pack', 'checkout', 'pay', 'confirmed'])
const inPacks = computed(() => PACK_ROUTES.has(route.name))
const inMessages = computed(() => route.name === 'messages')
// The tracker's two routes. NAMES rather than a path prefix, for the same
// reason `PACK_ROUTES` is: a section is the set of screens it is made of, and a
// screen that leaves the prefix later should not fall out of its own rail row.
const PROJECT_ROUTES = new Set(['projects', 'project'])
const inProjects = computed(() => PROJECT_ROUTES.has(route.name))
// ⚠️ THE DIRECTORY IS NOW ITS OWN DESTINATION, matched by name rather than by
// subtraction. It used to be "everything under /connect that isn't one of the
// other sections", because the rail's first row pointed at /connect and the
// directory had no row of its own — which was true while /connect WAS a partner
// list behind two questions. It is the intake and the recommendation now, so
// the two are separate places and each has its row.
const DIRECTORY_ROUTES = new Set(['results', 'partner', 'saved-partners'])
const inDirectory = computed(() => DIRECTORY_ROUTES.has(route.name))

// The front door: the questions, and the answer they produce.
const HOME_ROUTES = new Set(['connect', 'recommendation'])
const inHome = computed(() => HOME_ROUTES.has(route.name))

const partnerSelfName = PARTNERS.find((p) => p.id === PARTNER_SELF.partnerId)?.name ?? ''

// The partner side has one screen so far, Messages, so it keeps the rail's
// first group and none of the business destinations under it.
const shellSubtitle = computed(() => {
  if (store.role === 'partner') return `${PARTNER_SELF.person}, ${partnerSelfName}`
  return store.signedIn ? store.viewer.name : undefined
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
const feedback = ref(false)

const logoMenu = computed(() => [
  { label: 'Give feedback', icon: 'lucide-message-square-quote', onClick: () => (feedback.value = true) },
  ...(store.signedIn ? [{ label: 'Log out', icon: 'lucide-log-out', onClick: logOut }] : []),
])

// `store.logOut()` rather than `setAccount('visitor')`: logging out has to drop
// the saved list too. It didn't before, so every bookmark you'd filled stayed
// filled after signing out — the row was reading a list that no longer belonged
// to anyone.
//
// The only signal used to be the dropdown closing and the sidebar's subtitle
// disappearing, neither of which you're looking at when you press it. The count
// is in the description because that's the part you can't see happen.
const logOut = () => {
  const cleared = store.logOut()
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
const unread = computed(() => (store.hasProject ? 3 : 0))

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
  // Hand the content region to the page at full height, with no scrolling of
  // its own. For a screen whose panes scroll separately — messages, where the
  // thread list and the conversation each keep their own position and the
  // composer stays put at the bottom. A page that scrolls as one document
  // wants the default.
  flush: { type: Boolean, default: false },
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
  <div class="flex h-screen bg-surface-base">
    <Sidebar v-model:collapsed="collapsed" class="fc-sidebar border-r">
      <!-- The second line is the signed-in viewer's name, and nothing at all
           when signed out — an app tagline under the app's own name told a
           visitor what they could already see. -->
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
        <nav class="space-y-0.5">
          <!-- An inbox, not a message bubble. The bubble belongs to the Contact
               buttons that WRITE into this screen; this row is the pile those
               threads land in. `lucide-inbox` is frappe-ui's own choice for the
               row too — see the Sidebar `Collapsed` story.

               It was the least speculative item in the rail, and it is now the
               only live one: the screen exists. ⚠️ The Contact buttons in the
               listing and on the profiles still toast rather than opening a
               thread — starting a conversation from there needs a rule for
               what a brand new thread says, which is a separate decision. -->
          <Tooltip text="Messages" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Messages" to="/connect/messages" :active="inMessages">
              <template #prefix><LucideInbox class="size-4 text-ink-gray-6" /></template>
            </SidebarItem>
          </Tooltip>

          <Tooltip text="Notifications" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Notifications">
              <template #prefix>
                <span class="relative grid place-items-center">
                  <LucideBell class="size-4 text-ink-gray-6" />
                  <!-- ⚠️ The count lives in `#suffix`, and frappe-ui hides that
                       zone entirely when the sidebar is collapsed (`w-0
                       opacity-0`). This app OPENS collapsed, so the suffix alone
                       would mean the unread signal is invisible by default — the
                       one state the badge exists for. The dot takes over there.
                       Its treatment is lifted from `RailItemBadge`: an 8px disc
                       in `surface-red-6` with a `--surface-base` ring so it reads
                       against the icon underneath. -->
                  <span
                    v-if="collapsed && unread"
                    class="absolute -right-1 -top-1 block size-2 rounded-full border border-[var(--surface-base)] bg-surface-red-6"
                    aria-hidden="true"
                  />
                </span>
              </template>
              <!-- The count folds into the accessible name rather than being left
                   as a bare number beside a word, which is what `RailItem` does
                   with its `badge` too. -->
              <span class="truncate text-sm">
                Notifications
                <!-- Only when there are some: "Notifications — 0 unread" is a
                     sentence no screen reader user needs read to them on every
                     pass through the rail. -->
                <span v-if="unread" class="sr-only">— {{ unread }} unread</span>
              </span>
              <!-- `subtle`, not `solid`. A solid red pill was the single most
                   saturated thing on the screen — louder than the page's own
                   primary button, in a grey-on-grey rail, for a count of three.
                   Subtle keeps the red (so it still reads as unread rather than
                   as a total) at roughly the weight of the "Gold" tier badge in
                   the listing, which is the right register for this app.

                   ⚠️ The collapsed dot stays SOLID, deliberately. At 8px there is
                   no room for a fill and a label to share the work — the
                   saturation is the whole signal — and it isn't competing with
                   anything, because in a 48px rail it's the only mark. Loudness
                   is a function of size here, not of colour. -->
              <template v-if="unread" #suffix>
                <Badge variant="subtle" theme="red" size="sm" class="mr-2" aria-hidden="true">
                  {{ unread }}
                </Badge>
              </template>
            </SidebarItem>
          </Tooltip>
        </nav>

        <!-- ── Everywhere you can go ──────────────────────────────────────
             One flat list, no `SidebarLabel`. There used to be two — "Discover"
             over the first two rows and "Your projects" over Projects —
             and the second was a heading for a group of one, which labels a
             section that doesn't exist yet rather than the row that's there.
             Dropping both leaves five rows total — six signed in, with Home —
             which needs no taxonomy: the same shape Helpdesk uses, where the
             personal pair sits above a single unlabelled list of destinations.

             ⚠️ `mt-4`, not the 28px the "Discover" label used to occupy.
             Holding the label's exact height kept the spacing honest while the
             words were being removed, but once they were gone 28px was a gap
             sized for something that is no longer there — it read as a missing
             heading rather than as a seam. 16px is still 8x the `space-y-0.5`
             between rows, so the two groups stay unmistakably separate.

             For reference, frappe-ui's own `SidebarSection` separates groups by
             `mt-2` — but every one of those carries a label doing the work, and
             here the gap is the only thing saying "these are two lists".

             `space-y-0.5` inside the `nav`, as in frappe-ui's own reference
             sidebar. The rows were flush before, which reads denser than the
             component intends and puts an active row's fill hard against its
             neighbours.

             Find partners takes a building, not a magnifying glass: the item is
             the directory of partner companies, and search is a control that
             lives inside it. -->
        <nav v-if="store.role !== 'partner'" class="mt-4 space-y-0.5">
          <!-- ⚠️ HOME IS LIVE NOW, AND IT IS FOR EVERYONE. It was an inert row
               shown only to signed-in accounts, on the reasoning that a visitor
               who arrived from a marketing page has nothing to come home to.
               That was true while /connect was a marketing page. It is the three
               questions and the recommendation they produce — the one screen
               that holds what this account has told us — so a visitor has a home
               from their first answer. -->
          <Tooltip text="Home" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Home" to="/connect" :active="inHome">
              <template #prefix><LucideHouse class="size-4 text-ink-gray-6" /></template>
            </SidebarItem>
          </Tooltip>
          <!-- ⚠️ "Partners", pointing at the DIRECTORY. This row said "Find
               partners" and went to /connect, which stopped being a partner
               search the day that page became an intake — it asked three
               questions about your business and recommended a product. The
               label named something the destination no longer did.
               The directory itself had no row at all, reachable only from a
               link on the landing page, so the fix is one move rather than a
               rename: the building icon means the directory of partner
               companies, which is what this row always meant. -->
          <Tooltip text="Partners" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Partners" to="/connect/partners" :active="inDirectory">
              <template #prefix><LucideBuilding2 class="size-4 text-ink-gray-6" /></template>
            </SidebarItem>
          </Tooltip>
          <Tooltip text="Starter Packs" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Starter Packs" to="/connect/packs" :active="inPacks">
              <template #prefix><LucidePackage class="size-4 text-ink-gray-6" /></template>
            </SidebarItem>
          </Tooltip>
          <!-- The collaboration half of the product. Inert until the tracker
               landed; it is now the index of everything the account has under
               way, and `inProjects` is what keeps it lit on a project's own
               detail page — `SidebarItem` compares whole paths, so a child
               route lights nothing on its own. -->
          <!-- ⚠️ "Projects", AND THE WORD IT REPLACES WAS DOING THREE JOBS.
               "Implementation" is half a service name (Custom implementation),
               it is a STAGE inside a pack project — the page under this row has
               a button reading "Move to Implementation" — and it was the name
               of the list of everything. Three meanings in one product, and the
               list was the only one of the three that had another word
               available. Everything the list actually says already used it: the
               rows are projects, the count line says "3 projects", the empty
               state's button says New project, the route is /connect/projects
               and the home screen says "You have 2 active projects". -->
          <!-- Accounts only: a visitor has no projects, and the route sends
               them to log in. -->
          <Tooltip
            v-if="store.signedIn"
            text="Projects"
            side="right"
            :offset="8"
            :disabled="!collapsed"
          >
            <SidebarItem label="Projects" to="/connect/projects" :active="inProjects">
              <template #prefix><LucideBriefcaseBusiness class="size-4 text-ink-gray-6" /></template>
            </SidebarItem>
          </Tooltip>
        </nav>

      </ScrollArea>
    </Sidebar>

    <FeedbackDialog v-model:open="feedback" />

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
      <div class="group absolute inset-y-0 -left-1.5 z-20 w-3" @mousemove="onRailMove">
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
      <PageHeader class="shrink-0">
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
             nothing. This is two crumbs deep at most and will never need its
             overflow dropdown, so the semantics are worth more than the
             component. Revisit if the directory ever nests further. -->
        <!-- `pr-3` because PageHeader's own row has no gap — its reference
             composition puts a solid button against the crumbs and lets them
             touch. The current crumb truncates, so without this the ellipsis
             runs straight into the auth control at narrow widths. -->
        <nav v-if="crumb" class="flex min-w-0 items-center pr-3" aria-label="Breadcrumb">
          <RouterLink
            :to="rootTo"
            class="shrink-0 whitespace-nowrap rounded-4 px-0.5 py-1 text-lg-medium text-ink-gray-5 transition-colors hover:text-ink-gray-7"
          >
            {{ rootLabel }}
          </RouterLink>
          <span class="mx-0.5 text-base text-ink-gray-4" aria-hidden="true">/</span>
          <span
            class="min-w-0 truncate px-0.5 py-1 text-lg-medium text-ink-gray-9"
            aria-current="page"
          >
            {{ crumb }}
          </span>
        </nav>
        <span v-else class="whitespace-nowrap px-0.5 py-1 text-lg-medium text-ink-gray-9">
          {{ rootLabel }}
        </span>

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
            v-if="!store.signedIn && store.role !== 'partner'"
            variant="ghost"
            class="-mr-2"
            label="Log in or create account"
            @click="requireAccount()"
          >
            <template #suffix><LucideArrowRight class="size-4" /></template>
          </Button>
        </slot>
      </PageHeader>

      <!-- frappe-ui's ScrollArea: overlay scrollbars that fade in on hover or
           scroll, instead of a permanent native gutter. Same primitive
           DesktopShell uses for its content region. -->
      <!-- ⚠️ `fc-content` makes the content column a container-query root, so a
           page inside it can respond to ITS width rather than the viewport's.
           That matters here and nowhere else: with a panel open the column's
           width changes without the window changing, so viewport breakpoints
           inside a page would answer the wrong question. See `index.css`. -->
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
