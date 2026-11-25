<script setup>
import ConnectShell from '../components/ConnectShell.vue'
import { RESOURCES } from '../data/partnerAccount'
import { COLLATERAL, FOLDER_ICON } from '../data/collateral'
import frappeMark from '../assets/frappe.svg'
import learningMark from '../assets/apps/learning.svg'
import helpdeskMark from '../assets/apps/helpdesk.png'

// SCREEN — Resources: what Frappe gives partners to sell and deliver with.
// The collateral library leads — it's what Sales comes back for during a deal —
// as folder cards that open inside Connect. The help links follow, and open
// where they live. See PARTNER-VIEW-PLAN.md §7.

const LOGOS = { frappe: frappeMark, learning: learningMark, helpdesk: helpdeskMark }
</script>

<template>
  <ConnectShell root-label="Resources">
    <!-- The list width: the folder grid is scanned across a row. -->
    <div class="fc-page-list space-y-16 pb-10 pt-8">
      <section>
        <h2 class="text-lg-semibold text-ink-gray-8">Collateral</h2>
        <ul class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <li v-for="f in COLLATERAL" :key="f.slug">
            <!-- A card that opens a page, so the whole card is the link and
                 nothing points out of the app. -->
            <RouterLink
              :to="{ name: 'resource-folder', params: { folder: f.slug } }"
              class="block h-full rounded-5 border border-outline-gray-1 p-4 transition-colors hover:bg-surface-gray-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
            >
              <span :class="FOLDER_ICON" class="size-4" aria-hidden="true" />
              <!-- Title and subtext per frappe-patterns list.md: medium headline,
                   `text-p-sm` gray-6 subtext, 4px apart. -->
              <span class="mt-6 flex flex-col gap-1">
                <span class="text-base font-medium text-ink-gray-8">{{ f.name }}</span>
                <span class="text-p-sm text-ink-gray-6">
                  {{ f.files.length }} {{ f.files.length === 1 ? 'file' : 'files' }}
                </span>
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>
      <section v-for="g in RESOURCES" :key="g.key">
        <h2 class="text-lg-semibold text-ink-gray-8">{{ g.title }}</h2>
        <ul class="mt-3 divide-y divide-outline-gray-1">
          <li v-for="item in g.items" :key="item.href">
            <a
              :href="item.href"
              target="_blank"
              rel="noopener"
              class="-mx-2 flex items-center gap-3 rounded-4 px-2 py-4 transition-colors hover:bg-surface-gray-2"
            >
              <img :src="LOGOS[item.logo]" alt="" class="size-7 shrink-0 object-contain" />
              <!-- Title and subtext per frappe-patterns list.md. -->
              <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                <span class="text-base font-medium text-ink-gray-8">{{ item.label }}</span>
                <span v-if="item.note" class="text-p-base text-ink-gray-6">
                  {{ item.note }}
                </span>
              </span>
              <!-- These leave Connect: the out-arrow says so at a glance. -->
              <span class="lucide-arrow-up-right size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>
    </div>
  </ConnectShell>
</template>
