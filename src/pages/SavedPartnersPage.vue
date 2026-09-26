<script setup>
import { computed } from 'vue'
import { Button } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PartnerList from '../components/PartnerList.vue'
import PartnerRow from '../components/PartnerRow.vue'
import { useConnectStore } from '../stores/connect'

// SCREEN — Saved partners. The full list behind the home screen's "View all".
//
// Real `PartnerRow`s, the same as the directory: a saved partner is compared on
// the same facts, and Save and Contact still work here. Unsaving drops the row
// straight away; the toast's Undo puts it back.
const store = useConnectStore()
const partners = computed(() => store.savedPartners)
</script>

<template>
  <ConnectShell crumb="Saved">
    <!-- 800 and `py-8`, the app's one measure for a listing. -->
    <div class="fc-page-list py-8">
      <div v-if="!partners.length" class="py-20 text-center">
        <p class="text-p-lg font-medium text-ink-gray-8">Nothing saved yet</p>
        <p class="mx-auto mt-1.5 max-w-xs text-p-base text-ink-gray-6">
          Bookmark a partner in the directory to keep them here.
        </p>
        <div class="mt-4">
          <Button variant="solid" label="Browse partners" route="/connect/partners" />
        </div>
      </div>

      <template v-else>
        <p class="text-p-sm text-ink-gray-5">
          {{ partners.length }} saved {{ partners.length === 1 ? 'partner' : 'partners' }}, newest
          first
        </p>
        <PartnerList class="mt-4">
          <PartnerRow v-for="p in partners" :key="p.id" :partner="p" />
        </PartnerList>
      </template>
    </div>
  </ConnectShell>
</template>
