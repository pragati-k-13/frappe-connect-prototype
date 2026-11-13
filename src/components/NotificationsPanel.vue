<!--
  Notifications panel, copied from CRM (crm/frontend/src/components/Notifications.vue).
  Slides out of the sidebar's right edge, so the sidebar needs `relative`. Data comes in as a
  prop; the app owns fetching and marking read. Works in Sketch.

  <div class="relative">   ← sidebar
    <SidebarItem id="notifications-btn" label="Notifications" icon="lucide-bell" @click="open = !open" />
    <NotificationsPanel v-model:open="open" :items="notifications" ignore="#notifications-btn"
      @select="go" @read-all="markAllRead" />
  </div>

  Item: { id, from: { name, image? }, action, target, text?, time, read, route }
  `text` replaces the "<from> <action> <target>" line.

  Changed from CRM: width 352px (DESIGN.md), shadow-xl token, ScrollArea, size-1.5 dot,
  plain text instead of server HTML, empty state without a description.
-->
<template>
  <div v-if="open" ref="panel" class="absolute left-full top-0 z-20 h-screen w-[22rem] bg-surface-base shadow-xl">
    <div class="flex h-screen flex-col text-ink-gray-9">
      <div class="flex items-center justify-between">
        <div class="px-4 pb-3 pt-4 text-lg-medium text-ink-gray-8">Notifications</div>
        <div class="mr-3 flex gap-1">
          <Button
            v-if="items.length"
            variant="ghost"
            icon="lucide-check-check"
            tooltip="Mark all as read"
            aria-label="Mark all as read"
            @click="emit('read-all')"
          />
        </div>
      </div>

      <ScrollArea v-if="items.length" class="min-h-0 flex-1" viewport-class="pb-10">
        <div class="divide-y divide-outline-elevation-2 text-base">
          <RouterLink
            v-for="n in items"
            :key="n.id"
            :to="n.route"
            class="flex cursor-pointer items-start gap-2.5 px-4 py-2.5 hover:bg-surface-gray-2"
            @click="select(n)"
          >
            <div class="mt-1 flex items-center gap-2.5">
              <div class="size-1.5 rounded-full" :class="n.read ? 'bg-transparent' : 'bg-surface-gray-10'" />
              <Avatar :label="n.from.name" :image="n.from.image" size="lg" />
            </div>
            <div>
              <div v-if="n.text">{{ n.text }}</div>
              <div v-else class="mb-2 space-x-1 leading-5 text-ink-gray-5">
                <span class="font-medium text-ink-gray-9">{{ n.from.name }}</span>
                <span>{{ n.action }}</span>
                <span class="font-medium text-ink-gray-9">{{ n.target }}</span>
              </div>
              <div class="text-sm text-ink-gray-5">{{ dayjs(n.time).fromNow() }}</div>
            </div>
          </RouterLink>
        </div>
      </ScrollArea>

      <div v-else class="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div class="rounded-full bg-surface-gray-2 p-3 text-ink-gray-5">
          <span class="lucide-bell size-6" aria-hidden="true" />
        </div>
        <p class="text-base text-ink-gray-7">No new notifications</p>
      </div>
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
