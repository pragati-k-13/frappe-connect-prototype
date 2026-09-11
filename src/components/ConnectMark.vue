<script setup>
import { Avatar } from 'frappe-ui'
import IconHandshake from '~icons/lucide/handshake'

// Frappe Connect's mark: a handshake on the brand blue. ONE definition for the
// whole app — the sidebar and the onboarding screen used to draw different
// marks (a grey square with `LucideBlocks`, and a hand-rolled violet box),
// which is two identities for one product a couple of clicks apart.
//
// Built on `Avatar` so the box and its corner come from frappe-ui rather than
// from three guessed values: `lg` is 28px, `xl` 32px, both `rounded-[6px]`, and
// the icon well is the component's own.
//
// ⚠️ The fill is NOT Avatar's. Its six themes are all `-2` backgrounds — pale
// tiles for a person's initials — and a product mark wants the saturated one.
// `fc-mark` in index.css overrides that one pairing; it has to be a descendant
// rule because Avatar paints the colour on an inner div, so a class on the root
// would sit behind it. See the note there.
defineProps({
  // Any of Avatar's size tokens. `lg` fills SidebarHeader's own 28px frame.
  size: { type: String, default: 'xl' },
})
</script>

<template>
  <Avatar class="fc-mark" :size="size" shape="square" aria-hidden="true">
    <IconHandshake class="size-full" />
  </Avatar>
</template>
