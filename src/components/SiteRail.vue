<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { Sidebar, SidebarItem, SidebarLabel, ScrollArea } from 'frappe-ui'
import frappeMark from '../assets/frappe.svg'
import IconGrid from '~icons/lucide/layout-grid'
import IconGlobe from '~icons/lucide/globe'
import IconBuilding from '~icons/lucide/building-2'
import IconFile from '~icons/lucide/file-text'
import IconMail from '~icons/lucide/mail'
import IconBook from '~icons/lucide/book-open'
import IconHeart from '~icons/lucide/heart'
import IconUsers from '~icons/lucide/users'
import IconVideo from '~icons/lucide/video'
import IconPen from '~icons/lucide/pen-tool'
import IconAward from '~icons/lucide/award'
import IconQuote from '~icons/lucide/quote'
import IconBriefcase from '~icons/lucide/briefcase'

// frappe.io's sidebar, shared by the three mocked site pages.
//
// The icon rail is its COLLAPSED state, and hover expands it to the labelled
// sidebar. Built on frappe-ui's `Sidebar`, whose `v-model:collapsed` is exactly
// that switch; `Rail` has no expanded state at all.
//
// ⚠️ IT EXPANDS OVER THE PAGE, not beside it. The wrapper holds a fixed 48px in
// the layout and the Sidebar is absolutely positioned inside it, so opening it
// reflows nothing. `Sidebar` itself is a flex item that pushes its neighbours,
// which is right for an app and wrong for a rail you brush past.
//
// ⚠️ TWO ITEMS WORK, because two pages exist here (Get started is stored, not
// routed — see `router.js`). The rest are real
// frappe.io pages this prototype does not stand in for; they stay disabled
// rather than linking to invented routes. See `vDisabled` for how.
const GROUPS = [
  {
    items: [
      { label: 'Products', icon: IconGrid },
      { label: 'Partners', icon: IconGlobe, to: '/' },
      { label: 'Customers', icon: IconBuilding },
      { label: 'Blog', icon: IconFile },
      { label: 'Contact', icon: IconMail, to: '/contact' },
    ],
  },
  {
    label: 'About',
    items: [
      { label: 'Story', icon: IconBook },
      { label: 'Culture', icon: IconHeart },
      { label: 'Team', icon: IconUsers },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'Events', icon: IconVideo },
      { label: 'Design', icon: IconPen },
      { label: 'Community', icon: IconAward },
      { label: 'Testimonials', icon: IconQuote },
      { label: 'Careers', icon: IconBriefcase },
    ],
  },
]

// ⚠️ `SidebarItem` has no `disabled` prop, and a `disabled` attribute falls
// through onto its wrapping div, not the button inside it. This puts it on the
// button, so a pointer and a screen reader both get a real disabled control.
const vDisabled = {
  mounted: (el) => {
    const button = el.querySelector(':scope > button')
    if (button) button.disabled = true
  },
}

// Hover intent: a short wait each way, so a pointer crossing the rail on its
// way to the page does not flash it open.
const collapsed = ref(true)
let timer
const setAfter = (value, ms) => {
  clearTimeout(timer)
  timer = setTimeout(() => (collapsed.value = value), ms)
}
const open = () => setAfter(false, 120)
const close = () => setAfter(true, 180)
// Keyboard users get the labels too: focus opens it at once, and it closes
// when focus leaves the rail altogether.
const onFocusIn = () => {
  clearTimeout(timer)
  collapsed.value = false
}
const onFocusOut = (e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) close()
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <!-- ⚠️ Hidden below `md`. The real site collapses to a hamburger there; the
       mobile nav is not what is under review. -->
  <div class="site-rail relative z-20 hidden h-full w-12 shrink-0 md:block">
    <Sidebar
      v-model:collapsed="collapsed"
      width="13rem"
      class="absolute inset-y-0 left-0 border-r border-outline-gray-2 data-[state=expanded]:shadow-lg"
      @mouseenter="open"
      @mouseleave="close"
      @focusin="onFocusIn"
      @focusout="onFocusOut"
    >
      <!-- Not `SidebarHeader`: that is a workspace dropdown trigger, and the
           mark is not a menu. 12px in centres the 24px mark on the icons'
           24px axis. -->
      <div class="flex h-12 shrink-0 items-center gap-2 px-3">
        <img :src="frappeMark" alt="" class="size-6 shrink-0" />
        <span
          class="site-rail-fade text-[15px] font-semibold text-ink-gray-8"
          :class="collapsed ? 'opacity-0' : 'opacity-100'"
        >
          Frappe
        </span>
      </div>
      <ScrollArea class="min-h-0 flex-1" viewport-class="px-2 pb-4">
        <nav aria-label="Frappe" class="flex flex-col gap-0.5">
          <template v-for="(group, gi) in GROUPS" :key="gi">
            <!-- Kept while collapsed, with its text faded out: the empty row is
                 the gap between the rail's groups. -->
            <SidebarLabel v-if="group.label" class="mt-2">
              <span class="text-[11px] font-semibold uppercase tracking-[0.09em]">
                {{ group.label }}
              </span>
            </SidebarLabel>
            <template v-for="item in group.items" :key="item.label">
              <SidebarItem v-if="item.to" :label="item.label" :icon="item.icon" :to="item.to" />
              <SidebarItem
                v-else
                v-disabled
                :label="item.label"
                :icon="item.icon"
                data-disabled
              />
            </template>
          </template>
        </nav>
      </ScrollArea>
    </Sidebar>
  </div>
</template>

<style scoped>
/* The site is white, and frappe.io marks the current page with a gray-2 fill
   rather than the app's raised white row. */
.site-rail :deep([data-slot='sidebar']) {
  background-color: var(--surface-base);
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.site-rail :deep([data-slot='sidebar-item'][data-state='active']) {
  background-color: var(--surface-gray-2);
  box-shadow: none;
}
.site-rail :deep([data-slot='sidebar-item'][data-disabled]:hover) {
  background-color: transparent;
}
.site-rail :deep([data-slot='sidebar-item'] button:disabled) {
  cursor: default;
}
/* Labels and headings animate at the same speed as the width. Only the
   elements that already transition — a blanket `*` would animate everything. */
.site-rail :deep([data-slot='sidebar'] .transition-all),
.site-rail-fade {
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.site-rail-fade {
  transition-property: opacity;
}
@media (prefers-reduced-motion: reduce) {
  .site-rail :deep([data-slot='sidebar']),
  .site-rail :deep([data-slot='sidebar'] .transition-all),
  .site-rail-fade {
    transition: none;
  }
}
</style>
