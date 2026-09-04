<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Button, ScrollArea, Sidebar, SidebarHeader, SidebarItem, SidebarLabel, toast } from 'frappe-ui'
import LoginDialog from './LoginDialog.vue'
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
        <SidebarLabel>Discover</SidebarLabel>
        <!-- A building, not a magnifying glass: the item is the directory of
             partner companies, and search is a control that lives inside it. -->
        <!-- `space-y-0.5` and a `nav` per group, as in frappe-ui's own reference
             sidebar. The rows were flush before, which reads denser than the
             component intends and puts an active row's fill hard against its
             neighbours. -->
        <nav class="space-y-0.5">
          <SidebarItem label="Find partners" to="/connect" :active="inDirectory">
            <template #prefix><LucideBuilding2 class="size-4 text-ink-gray-6" /></template>
          </SidebarItem>
          <SidebarItem label="Saved partners">
            <template #prefix><LucideBookmark class="size-4 text-ink-gray-6" /></template>
          </SidebarItem>
          <SidebarItem label="Starter packs">
            <template #prefix><LucidePackage class="size-4 text-ink-gray-6" /></template>
          </SidebarItem>
        </nav>

        <!-- The collaboration half of the product. Present so the rail shows
             where implementation tracking lands, inert until those screens
             exist. -->
        <SidebarLabel>Your projects</SidebarLabel>
        <nav class="space-y-0.5">
          <SidebarItem label="Requests">
            <template #prefix><LucideSend class="size-4 text-ink-gray-6" /></template>
          </SidebarItem>
          <SidebarItem label="Implementation">
            <template #prefix><LucideListChecks class="size-4 text-ink-gray-6" /></template>
          </SidebarItem>
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

      <!-- Top bar. min-h-12 matches SidebarHeader's fixed 48px region, so the
           two line up across the seam. It sits outside the scroll region rather
           than sticking inside it, so nothing scrolls under a sticky element.

           The bottom rule stays. It isn't a section divider — it's the edge of
           the chrome, marking where the fixed bar ends and the scrolling
           content begins. Without it, content scrolls up against nothing. -->
      <header
        class="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-outline-gray-1 bg-surface-base px-4 sm:px-5"
      >
        <!-- "Partners" alone on the list screens; a breadcrumb once you're
             inside one. `crumb` is the trailing label, and "Partners" becomes
             the link back — the profile is a level down, so the bar is where
             that depth is shown rather than adding a Back button to the page. -->
        <nav v-if="crumb" class="flex min-w-0 items-center gap-1.5" aria-label="Breadcrumb">
          <RouterLink
            to="/connect/partners"
            class="shrink-0 text-base text-ink-gray-6 transition-colors hover:text-ink-gray-8"
          >
            Partners
          </RouterLink>
          <LucideChevronRight class="size-4 shrink-0 text-ink-gray-6" aria-hidden="true" />
          <span class="truncate text-base font-medium text-ink-gray-8" aria-current="page">
            {{ crumb }}
          </span>
        </nav>
        <span v-else class="text-base font-medium text-ink-gray-8">Partners</span>

        <!-- Signed out: one auth CTA on every screen, the ghost "Log in or
             create account". This used to promote to a solid "Create account"
             on the results and profile screens, but a solid button in the
             chrome outranks the page's own primary action — on the profile it
             read louder than Contact, which is the thing the page is for. -->
        <Button
          v-if="!store.signedIn"
          variant="ghost"
          label="Log in or create account"
          @click="store.requireLogin()"
        >
          <template #suffix><LucideArrowRight class="size-4" /></template>
        </Button>

        <!-- Signed in: nothing here. The account surface isn't designed yet,
             so the bar shows the absence of the CTA rather than a stand-in for
             a control whose shape nobody has decided. `store.viewer` holds the
             identity for whenever user settings land.

             Reading `store.signedIn` rather than `store.account` keeps the
             enum in the store — see `stores/connect.js`. -->
      </header>

      <!-- frappe-ui's ScrollArea: overlay scrollbars that fade in on hover or
           scroll, instead of a permanent native gutter. Same primitive
           DesktopShell uses for its content region. -->
      <ScrollArea class="min-h-0 flex-1">
        <main class="min-w-0">
          <slot />
        </main>
      </ScrollArea>
    </div>

    <!-- One login prompt for the whole app. It lives here because ConnectShell
         wraps every in-app screen, so a list of thirteen partner rows doesn't
         mount thirteen copies of the same modal — every gated control opens
         this one through `store.requireLogin()`. -->
    <LoginDialog />
  </div>
</template>
