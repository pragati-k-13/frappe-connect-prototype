<script setup>
import { Alert } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import { RESOURCES } from '../data/partnerAccount'
import { COLLATERAL, DRIVE_URL } from '../data/collateral'

// SCREEN — Resources: what Frappe gives partners to sell and deliver with, in
// one place. Each item links out to where it lives; Connect adds no channel of
// its own. "Help with a project" leads, since first implementations are where
// new partners need it most. See PARTNER-VIEW-PLAN.md §7.
const groups = RESOURCES
</script>

<template>
  <ConnectShell root-label="Resources">
    <div class="fc-page-read space-y-10 py-8">
      <!-- No page title in the body: the header already says Resources. -->
      <!-- Temporary: the page merges before its design is settled. -->
      <Alert theme="blue" title="Design in progress. This page will change." />
      <!-- The collateral library first: what Sales comes back for during a deal.
           Each folder opens in Frappe Drive. The help links follow. -->
      <section>
        <h2 class="text-lg-semibold text-ink-gray-8">Collateral</h2>
        <ul class="mt-3 divide-y divide-outline-gray-1">
          <li v-for="f in COLLATERAL" :key="f.name">
            <a
              :href="DRIVE_URL"
              target="_blank"
              rel="noopener"
              class="-mx-2 flex items-center gap-3 rounded-4 px-2 py-3 transition-colors hover:bg-surface-gray-2"
            >
              <span class="lucide-folder size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
              <span class="min-w-0 flex-1 text-base text-ink-gray-8">{{ f.name }}</span>
              <span class="shrink-0 text-sm text-ink-gray-5">{{ f.items }} items</span>
              <span class="lucide-arrow-up-right size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>
      <section v-for="g in groups" :key="g.key">
        <h2 class="text-lg-semibold text-ink-gray-8">{{ g.title }}</h2>
        <ul class="mt-3 divide-y divide-outline-gray-1">
          <li v-for="item in g.items" :key="item.href">
            <a
              :href="item.href"
              target="_blank"
              rel="noopener"
              class="-mx-2 flex items-center gap-3 rounded-4 px-2 py-3 transition-colors hover:bg-surface-gray-2"
            >
              <span class="min-w-0 flex-1">
                <span class="block text-base text-ink-gray-8">{{ item.label }}</span>
                <span class="mt-1 block text-sm text-ink-gray-5">{{ item.note }}</span>
              </span>
              <span class="lucide-arrow-up-right size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>
    </div>
  </ConnectShell>
</template>
