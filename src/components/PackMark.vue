<script setup>
import IconPackage from '~icons/lucide/package'
import { appLogo } from '../data/apps'

// A pack's mark: the sidebar's package in a gray box, the app's logo on its
// corner like an avatar's status badge, so pack and app read as one mark.
// The cart's line item (`lg`) and the welcome dialog's booking (`md`).
//
// ⚠️ Avatar's indicator proportions — about a third of the box, a 2px ring of
// `bg-surface-base`, just past the corner. Hand-rolled because Avatar's slot is
// a 12px status dot, too small for a logo.
defineProps({
  pack: { type: Object, required: true },
  size: { type: String, default: 'lg' },
})

const SIZES = {
  lg: { box: 'size-14 rounded-6', icon: 'size-6', badge: '-bottom-[3px] -right-[3px] rounded-[6px]', logo: 'size-4' },
  md: { box: 'size-10 rounded-5', icon: 'size-5', badge: '-bottom-[2px] -right-[2px] rounded-[5px]', logo: 'size-3.5' },
}
</script>

<template>
  <div class="relative flex shrink-0 items-center justify-center bg-surface-gray-2" :class="SIZES[size].box">
    <IconPackage class="text-ink-gray-6" :class="SIZES[size].icon" stroke-width="1.25" aria-hidden="true" />
    <span class="absolute bg-surface-base p-0.5" :class="SIZES[size].badge">
      <img :src="appLogo(pack.apps[0])" alt="" class="block object-contain" :class="SIZES[size].logo" />
    </span>
  </div>
</template>
