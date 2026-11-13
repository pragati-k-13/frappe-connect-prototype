<script setup>
import { Badge, SidebarItem, Tooltip } from 'frappe-ui'
// The rail's Notifications row, on both sides. Opens the panel; the count and
// the collapsed dot are as they were on the business rail.
defineProps({
  collapsed: { type: Boolean, default: false },
  unread: { type: Number, default: 0 },
})
defineEmits(['toggle'])
</script>

<template>
<Tooltip text="Notifications" side="right" :offset="8" :disabled="!collapsed">
  <!-- The click sits on a wrapper: Tooltip's trigger merges handlers into an
       array, which SidebarItem's `onClick` can't call. -->
  <div id="notifications-btn" @click="$emit('toggle')">
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
  </div>
</Tooltip>
</template>
