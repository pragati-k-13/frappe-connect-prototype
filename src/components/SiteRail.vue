<script setup>
import { useRouter } from 'vue-router'
import frappeMark from '../assets/frappe.svg'

// frappe.io's own icon rail, shared by both mocked site pages.
//
// ⚠️ IT IS NAVIGATION, NOT DECORATION, and it was drawn as decoration —
// `aria-hidden`, nothing interactive, on the note that it "establishes that
// this page sits inside the marketing site" and none of it was part of the
// handoff. Then somebody clicked the envelope and asked whether it went to the
// contact page. It does, on the real site: the rail is fourteen links and the
// sixth is `/contact`, titled "Contact Us".
//
// ⚠️ THE ENTRIES, THEIR ORDER AND THEIR TITLES ARE READ OFF frappe.io — hrefs
// and `title` attributes, with the four groups the vertical gaps make. The
// ICONS are the closest Lucide glyph to each and are the only guess in the
// list.
//
// ⚠️ TWO OF THEM WORK, because two of them exist here: Partners is the site
// page and Contact is the other mock. The rest are real pages this prototype
// does not stand in for, so they are disabled buttons rather than links to
// invented routes — `disabled` says so to a pointer and a screen reader alike,
// instead of leaving somebody clicking a dead link twice.
//
// ⚠️ SHARED, because the two mocks are one website and were drifting apart:
// the partners page had the rail and the contact page had a wordmark and a
// text nav of its own invention, so following the envelope landed you on
// something that looked like a different site.
const router = useRouter()

const RAIL = [
  [{ icon: 'house', title: 'Go To Frappe Home' }],
  [
    { icon: 'grid', title: 'Frappe Products' },
    { icon: 'globe', title: 'Frappe Partners', to: '/' },
    { icon: 'book', title: 'Partner Stories' },
    { icon: 'file', title: 'Blog' },
    { icon: 'mail', title: 'Contact Us', to: '/contact' },
  ],
  [
    { icon: 'pin', title: 'Frappe Journeys' },
    { icon: 'users', title: 'Frappe Culture' },
    { icon: 'bulb', title: 'About Frappe Team' },
  ],
  [
    { icon: 'video', title: 'Frappe Events' },
    { icon: 'target', title: 'Frappe Design' },
    { icon: 'award', title: 'Frappe Community' },
  ],
]
</script>

<template>
  <!-- ⚠️ Hidden below `md`, and the Frappe mark goes with it. The real site
       collapses to a hamburger at that width; this mock does not, because the
       mobile nav is not what is under review. -->
  <aside
    class="hidden h-full w-12 shrink-0 flex-col items-center gap-6 border-r border-outline-gray-2 py-4 md:flex"
  >
    <!-- The mark belongs to the rail, not the top bar — checked against
         frappe.io, where it sits at the rail's top and the bar beside it
         carries the breadcrumb alone. -->
    <img :src="frappeMark" alt="" class="size-6" />
    <nav
      v-for="(group, gi) in RAIL"
      :key="gi"
      class="flex flex-col items-center gap-3.5"
      aria-label="Frappe"
    >
      <button
        v-for="item in group"
        :key="item.title"
        type="button"
        :title="item.title"
        :aria-label="item.title"
        :disabled="!item.to"
        class="text-ink-gray-4 enabled:hover:text-ink-gray-7 disabled:cursor-default"
        @click="item.to && router.push(item.to)"
      >
        <LucideHouse v-if="item.icon === 'house'" class="size-4" />
        <LucideLayoutGrid v-else-if="item.icon === 'grid'" class="size-4" />
        <LucideGlobe v-else-if="item.icon === 'globe'" class="size-4" />
        <LucideMail v-else-if="item.icon === 'mail'" class="size-4" />
        <LucideBookOpen v-else-if="item.icon === 'book'" class="size-4" />
        <LucideUsers v-else-if="item.icon === 'users'" class="size-4" />
        <LucideMapPin v-else-if="item.icon === 'pin'" class="size-4" />
        <LucideLightbulb v-else-if="item.icon === 'bulb'" class="size-4" />
        <LucideFileText v-else-if="item.icon === 'file'" class="size-4" />
        <LucideTarget v-else-if="item.icon === 'target'" class="size-4" />
        <LucideVideo v-else-if="item.icon === 'video'" class="size-4" />
        <LucideAward v-else class="size-4" />
      </button>
    </nav>
  </aside>
</template>
