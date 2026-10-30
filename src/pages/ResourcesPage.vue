<script setup>
import ConnectShell from '../components/ConnectShell.vue'
import { RESOURCES } from '../data/partnerAccount'

// SCREEN — Resources: what Frappe gives partners to sell and deliver with, in
// one place. Each item links out to where it lives; Connect adds no channel of
// its own. "Help with a project" leads, since first implementations are where
// new partners need it most. See PARTNER-VIEW-PLAN.md §7.
const groups = RESOURCES
</script>

<template>
  <ConnectShell root-label="Resources">
    <div class="fc-page-read space-y-10 py-8">
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
