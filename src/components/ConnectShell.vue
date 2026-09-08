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
import { signInToast } from '../feedback'
import { useConnectStore } from '../stores/connect'

// Collapsed on arrival: the quiz and the map are the point of this screen, and
// an expanded rail eats width the map wants. Binding the model also takes over
// from Sidebar's default (collapse only below `sm`) — it stays collapsed at
// every width until the visitor opens it.
const collapsed = ref(true)

const store = useConnectStore()

// ⚠️ `SidebarItem` infers its active state by comparing the WHOLE path
// (`current.path === target.path`), so a child route lights nothing at all.
// "Find partners" points at /connect, which meant the rail showed no location
// on the partner list and on every profile — two of the three in-app screens,
// and the two you spend the most time on. Every route under /connect is the
// partner directory, so the match is a prefix.
const route = useRoute()
const inDirectory = computed(() => route.path.startsWith('/connect'))

// The header is already a Dropdown trigger — `SidebarHeader` takes `menuItems`
// and renders the chevron itself, so clicking the logo opens this rather than
// needing a control of its own.
//
// Signing out does the real thing: it puts the demo back in the signed-out
// state, so the switch is reachable from the product and not only from the
// demo control in the corner. Nothing to offer a signed-out visitor, so the
// menu is empty and the chevron doesn't appear.
const logoMenu = computed(() =>
  store.signedIn
    ? [{ label: 'Log out', icon: 'lucide-log-out', onClick: logOut }]
    : [],
)

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
  // reads "Partners".
  crumb: { type: String, default: null },
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
    <Sidebar v-model:collapsed="collapsed" class="fc-sidebar">
      <!-- The second line is the signed-in viewer's name, and nothing at all
           when signed out — an app tagline under the app's own name told a
           visitor what they could already see. -->
      <SidebarHeader
        title="Frappe Connect"
        :subtitle="store.signedIn ? store.viewer.name : undefined"
        :menu-items="logoMenu"
      >
        <template #prefix>
          <div class="flex size-full items-center justify-center bg-surface-gray-7 text-white">
            <LucideBlocks class="size-4" />
          </div>
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
           visible than frappe-ui's 6px stagger when expanded. -->
      <ScrollArea class="min-h-0 flex-1" viewport-class="px-2 pt-0.5">
        <!-- ── The personal pair ──────────────────────────────────────────
             Ungrouped, no `SidebarLabel`, sitting directly under the header and
             above everything you can navigate to. The pattern is Helpdesk's,
             which puts Search and Notifications in exactly this position for
             exactly this reason: these are not places in the app, they're what
             is waiting for YOU. A label would file them as a section of the
             product alongside Discover, which is what they are not.

             Separated from the list below by 28px — see the note there. -->
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

               It's also the least speculative item in the rail: every Contact
               button in the product toasts "the in-app messages screen, which
               doesn't exist yet", and this is the screen those toasts point
               at. -->
          <Tooltip text="Messages" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Messages">
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
             over the first two rows and "Your projects" over Implementation —
             and the second was a heading for a group of one, which labels a
             section that doesn't exist yet rather than the row that's there.
             Dropping both leaves five rows total, which needs no taxonomy: the
             same shape Helpdesk uses, where the personal pair sits above a
             single unlabelled list of destinations.

             ⚠️ `mt-7` replaces the "Discover" label EXACTLY. `SidebarLabel` is
             `h-7` with no margins of its own, so the 28px it occupied was the
             whole gap between the pair above and this list — the spacing is
             unchanged, only the words are gone. Collapsed, that 28px was
             already blank rail (the label hides its text and draws no rule
             unless you pass `divider`), so the collapsed rail is identical.

             `space-y-0.5` inside the `nav`, as in frappe-ui's own reference
             sidebar. The rows were flush before, which reads denser than the
             component intends and puts an active row's fill hard against its
             neighbours.

             Find partners takes a building, not a magnifying glass: the item is
             the directory of partner companies, and search is a control that
             lives inside it. -->
        <nav class="mt-7 space-y-0.5">
          <Tooltip text="Find partners" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Find partners" to="/connect" :active="inDirectory">
              <template #prefix><LucideBuilding2 class="size-4 text-ink-gray-6" /></template>
            </SidebarItem>
          </Tooltip>
          <Tooltip text="Starter packs" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Starter packs">
              <template #prefix><LucidePackage class="size-4 text-ink-gray-6" /></template>
            </SidebarItem>
          </Tooltip>
          <!-- The collaboration half of the product. Present so the rail shows
               where implementation tracking lands, inert until that screen
               exists. -->
          <Tooltip text="Implementation" side="right" :offset="8" :disabled="!collapsed">
            <SidebarItem label="Implementation">
              <template #prefix><LucideListChecks class="size-4 text-ink-gray-6" /></template>
            </SidebarItem>
          </Tooltip>
        </nav>
      </ScrollArea>

    </Sidebar>

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
            to="/connect/partners"
            class="shrink-0 rounded-4 px-0.5 py-1 text-lg-medium text-ink-gray-5 transition-colors hover:text-ink-gray-7"
          >
            Partners
          </RouterLink>
          <span class="mx-0.5 text-base text-ink-gray-4" aria-hidden="true">/</span>
          <span
            class="min-w-0 truncate px-0.5 py-1 text-lg-medium text-ink-gray-9"
            aria-current="page"
          >
            {{ crumb }}
          </span>
        </nav>
        <span v-else class="px-0.5 py-1 text-lg-medium text-ink-gray-9">Partners</span>

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

               ⚠️ It no longer opens anything. `LoginDialog` has been removed
               and a new sign-in design is coming, so this raises a toast naming
               the gap instead — the same treatment Contact gets for the
               messages screen that doesn't exist. A button that swallows a
               click reads as broken; one that says what it would have done
               reads as unfinished, which is the truth.

               When the new prompt lands, put this back to
               `store.requireLogin()` and drop `signInToast` — `requireLogin` is
               the one seam the prompt plugs into, and every gated control in
               the app already runs through it.

               Signed in: nothing here. The account surface isn't designed yet,
               so the bar shows the absence of the CTA rather than a stand-in
               for a control whose shape nobody has decided. `store.viewer`
               holds the identity for whenever user settings land. Reading
               `store.signedIn` rather than `store.account` keeps the enum in
               the store — see `stores/connect.js`. -->
          <Button
            v-if="!store.signedIn"
            variant="ghost"
            class="-mr-2"
            label="Log in or create account"
            @click="signInToast"
          >
            <template #suffix><LucideArrowRight class="size-4" /></template>
          </Button>
        </slot>
      </PageHeader>

      <!-- frappe-ui's ScrollArea: overlay scrollbars that fade in on hover or
           scroll, instead of a permanent native gutter. Same primitive
           DesktopShell uses for its content region. -->
      <ScrollArea class="min-h-0 flex-1">
        <main class="min-w-0">
          <slot />
        </main>
      </ScrollArea>
    </div>

  </div>
</template>
