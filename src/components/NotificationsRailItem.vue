<script setup>
import { Badge, SidebarItem, Tooltip } from 'frappe-ui'
// The rail's Notifications row, on both sides. Opens the panel. Matches Frappe
// CRM's (crm/frontend/src/components/Layouts/AppSidebar.vue): a gray count
// when expanded, a 6px near-black dot on the bell when collapsed. Gray, not
// red: the count says there's something to read, not that something is wrong.
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
      <span class="relative grid size-4 place-items-center">
        <LucideBell class="size-4 text-ink-gray-7" />
        <!-- Collapsed, frappe-ui hides the label and count (`w-0 opacity-0`),
             and this app opens collapsed, so the dot carries the signal. -->
        <span
          v-if="collapsed && unread"
          class="absolute -right-1 -top-1 size-1.5 rounded-full bg-surface-gray-9 ring-1 ring-[var(--surface-gray-1)]"
          aria-hidden="true"
        />
      </span>
    </template>
    <!-- The count sits in the label, not `#suffix`, as in CRM: the suffix is
         outside the button. It folds into the accessible name. -->
    <span class="flex-1 truncate text-sm leading-tighter">
      Notifications
      <span v-if="unread" class="sr-only">— {{ unread }} unread</span>
    </span>
    <Badge v-if="unread" class="mr-2" variant="subtle" :label="String(unread)" aria-hidden="true" />
  </SidebarItem>
  </div>
</Tooltip>
</template>
