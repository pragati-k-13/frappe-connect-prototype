<script setup>
import { inject } from 'vue'

// The breadcrumb, inside the page. Only in the website shell (signed out):
// its nav has no page-title slot, so the way back up ("Partners / Saved")
// moves to the top of the page's own column. Signed in, the app's top bar
// carries it and this renders nothing. Reads what `ConnectShell` provides.
const crumbs = inject('fcCrumbs', null)
</script>

<template>
  <nav
    v-if="crumbs?.show"
    aria-label="Breadcrumb"
    class="flex min-w-0 items-center gap-1 text-sm text-ink-gray-5"
  >
    <RouterLink :to="crumbs.rootTo" class="shrink-0 rounded transition-colors hover:text-ink-gray-7">
      {{ crumbs.rootLabel }}
    </RouterLink>
    <template v-for="t in crumbs.trail" :key="t.to">
      <span aria-hidden="true">/</span>
      <RouterLink :to="t.to" class="min-w-0 truncate rounded transition-colors hover:text-ink-gray-7">
        {{ t.label }}
      </RouterLink>
    </template>
    <span aria-hidden="true">/</span>
    <span class="min-w-0 truncate text-ink-gray-7" aria-current="page">{{ crumbs.crumb }}</span>
  </nav>
</template>
