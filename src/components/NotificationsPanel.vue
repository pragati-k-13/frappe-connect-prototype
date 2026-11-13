<!--
  Notifications panel, after the Frappe framework's shared NotificationPanel
  (frappe/ui/src/components/Notifications), which Helpdesk uses. Slides out of the sidebar's
  right edge, so the sidebar needs `relative`. Data comes in as a prop; the app owns
  fetching and marking read. Works in Sketch.

  <div class="relative">   ← sidebar
    <SidebarItem id="notifications-btn" label="Notifications" icon="lucide-bell" @click="open = !open" />
    <NotificationsPanel v-model:open="open" :items="notifications" ignore="#notifications-btn"
      @select="go" @read-all="markAllRead" />
  </div>

  Item: { id, from: { name, image? }, action, target, text?, time, read, route }
  `text` replaces the "<from> <action> <target>" line.

  Kept from the framework: the header (title, then Mark all as read and Close as small ghost
  buttons), rows with a rule between them, unread rows lightly filled with a 5px dot left of
  the avatar, gray-1 hover, "No notifications to show". Changed: frappe-ui ScrollArea for the
  list; plain text, not server HTML; a router link per row; CRM's 400px width and right-only
  shadow (the shadow-xl token, clipped). The framework's tabs and Load more are left out: the
  demo has a handful of items.
-->
<template>
  <div v-if="open" ref="panel" class="absolute left-[calc(100%+1px)] top-0 z-20 h-screen w-[25rem] max-w-[calc(100vw-100%-1px)] bg-surface-base shadow-xl [clip-path:inset(0_-3rem_0_0)]">
    <div class="flex h-screen flex-col text-ink-gray-9">
      <div class="flex items-center gap-2 px-4 py-2 pt-4">
        <span class="mr-auto text-md font-medium">Notifications</span>
        <Button
          v-if="items.some((n) => !n.read)"
          variant="ghost"
          size="sm"
          icon="lucide-check-check"
          tooltip="Mark all as read"
          aria-label="Mark all as read"
          @click="emit('read-all')"
        />
        <Button variant="ghost" size="sm" icon="lucide-x" tooltip="Close" aria-label="Close" @click="open = false" />
      </div>

      <ScrollArea v-if="items.length" class="min-h-0 flex-1" viewport-class="pb-10">
        <RouterLink
          v-for="(n, i) in items"
          :key="n.id"
          :to="n.route"
          class="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-surface-gray-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
          :class="[!n.read && 'bg-surface-gray-1/40', i < items.length - 1 && 'border-b border-outline-gray-1']"
          @click="select(n)"
        >
          <div class="relative mt-0.5 shrink-0">
            <span v-if="!n.read" class="absolute -left-2.5 top-1/2 size-[5px] -translate-y-1/2 rounded-full bg-surface-gray-9">
              <span class="sr-only">Unread</span>
            </span>
            <Avatar :label="n.from.name" :image="n.from.image" size="lg" />
          </div>
          <div class="min-w-0 flex-1">
            <div v-if="n.text" class="text-p-base text-ink-gray-8">{{ n.text }}</div>
            <div v-else class="text-p-base text-ink-gray-8">
              <span class="font-semibold">{{ n.from.name }}</span> {{ n.action }}
              <span class="font-semibold">{{ n.target }}</span>
            </div>
            <div class="mt-1 text-p-xs text-ink-gray-5">{{ dayjs(n.time).fromNow() }}</div>
          </div>
        </RouterLink>
      </ScrollArea>

      <div v-else class="py-12 text-center text-p-sm text-ink-gray-5">No notifications to show</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Avatar, Button, ScrollArea } from 'frappe-ui'
import { onClickOutside } from '@vueuse/core'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// "3 hours ago". CRM loads this plugin app-wide; here the panel loads it.
dayjs.extend(relativeTime)

const props = defineProps({
  items: { type: Array, default: () => [] },
  // Selector for the trigger, so clicking it doesn't close-then-reopen.
  ignore: { type: String, default: '' },
})
const open = defineModel('open', { type: Boolean, default: false })
const emit = defineEmits(['select', 'read-all'])

const panel = ref(null)
onClickOutside(panel, () => (open.value = false), { ignore: props.ignore ? [props.ignore] : [] })

// Opening a notification marks it read and closes the panel, as in CRM.
function select(n) {
  emit('select', n)
  open.value = false
}
</script>
